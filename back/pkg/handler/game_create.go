package handler

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/notnil/chess"
	"github.com/nutsdb/nutsdb"
	"github.com/samber/lo"
	"golang.org/x/sync/errgroup"

	"github.com/jolancornevin/stockfish_http/pkg/dao"
	"github.com/jolancornevin/stockfish_http/pkg/entities"
)

func getFromCache(cache *nutsdb.DB, fenPosition string) []entities.Line {
	var cachedLine []byte
	// ignore the error as we get one when the key it not found
	err := cache.View(func(tx *nutsdb.Tx) (err error) {
		key := []byte(fenPosition)

		cachedLine, err = tx.Get(BUCKET, key)
		return err
	})

	if err != nil && !errors.Is(err, nutsdb.ErrKeyNotFound) {
		panic(err)
	}

	var res []entities.Line
	if len(cachedLine) > 0 {
		fmt.Println("cached")
		err := json.Unmarshal(cachedLine, &res)
		if err != nil {
			panic(err)
		}
	}

	return res
}

func writeToCache(cache *nutsdb.DB, fenPosition string, lines []entities.Line) {
	err := cache.Update(
		func(tx *nutsdb.Tx) error {
			key := []byte(fenPosition)

			val, err := json.Marshal(lines)
			if err != nil {
				panic(err)
			}

			return tx.Put(BUCKET, key, val, nutsdb.Persistent)
		})
	if err != nil {
		panic(err)
	}
}

type CreateGame struct {
	DB *pgxpool.Conn

	Cache *nutsdb.DB
}

func NewCreateGame(db *pgxpool.Conn, cache *nutsdb.DB) *CreateGame {
	return &CreateGame{
		DB:    db,
		Cache: cache,
	}
}

func (h *CreateGame) Handle(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	// for defer
	var err error

	var body struct {
		UUID string
		date time.Time

		PGN string
	}
	err = json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		panic(err)
	}

	tx, err := h.DB.Begin(ctx)
	if err != nil {
		panic(err)
	}

	defer func() {
		if err != nil {
			tx.Rollback(ctx)
		} else {
			tx.Commit(ctx)
		}
	}()

	gameDAO := dao.NewGames(tx)
	gameID, err := gameDAO.Create(ctx, body.UUID, body.date)
	if err != nil {
		panic(err)
	}

	games, err := chess.GamesFromPGN(strings.NewReader(body.PGN))
	if err != nil {
		panic(err)
	}

	if len(games) != 1 {
		panic(errors.New("wrong number of pgn"))
	}

	game := games[0]
	err = h.computeLines(ctx, tx, gameID, game)
	if err != nil {
		panic(err)
	}

	w.WriteHeader(201)
}

func (h *CreateGame) computeLines(ctx context.Context, tx pgx.Tx, gameID int64, game *chess.Game) error {
	lineDAO := dao.NewFenLines(tx)
	moveDAO := dao.NewGameMoves(tx)

	nbLines := "3"
	positions := game.Positions()

	var mu sync.Mutex

	// start computing the lines, but in batch.
	const batchSize = 5
	for i := 0; i < len(positions); i++ {
		g, ctx := errgroup.WithContext(ctx)

		for j := 0; j < batchSize; j++ {
			index := i*batchSize + j
			g.Go(func() error {
				// we are at the last batch, with not enough lines to fill it
				if index >= len(positions) {
					return nil
				}

				var pos *chess.Position = positions[index]
				fenPosition := pos.String()
				color := lo.Ternary(pos.Turn() == chess.Black, "b", "w")

				// TODO delete the cache now that there is a DB
				lines := getFromCache(h.Cache, fenPosition)
				if len(lines) == 0 {
					lines = computeLines(fenPosition, nbLines, false)
					writeToCache(h.Cache, fenPosition, lines)
				}

				fmt.Printf("line computed %s %d\n", fenPosition, index)

				lines = lo.Map(
					lines,
					func(line entities.Line, _ int) entities.Line {
						// for some reason, stockfish returns a positive score if the color to move has an advantage and a negative score else
						// We want to standardize the score with negative = advantage black and positive = advantage white.
						// We do this by looking at the color playing (for the engine).
						line.ScoreCP = line.ScoreCP * lo.Ternary(color == "w", 1, -1)
						line.ScoreMate = line.ScoreMate * lo.Ternary(color == "w", 1, -1)

						return line
					},
				)

				// lock for DB write
				mu.Lock()
				defer mu.Unlock()

				fmt.Printf("inserting fen\n")
				fenID, err := lineDAO.Create(ctx, fenPosition, lines)
				if err != nil {
					return err
				}

				err = moveDAO.Create(ctx, gameID, fenID, index)
				if err != nil {
					return err
				}

				fmt.Printf("inserted game\n")

				return nil
			})
		}

		if err := g.Wait(); err != nil {
			return err
		}
	}
	return nil
}
