package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"

	"github.com/notnil/chess"
	"github.com/nutsdb/nutsdb"
	"github.com/samber/lo"
)

type GameLinesHandler struct {
	DB *nutsdb.DB
}

func NewGameLinesHandler(db *nutsdb.DB) *GameLinesHandler {
	// make sure the bucket exist
	if err := db.Update(func(tx *nutsdb.Tx) error {
		return tx.NewBucket(nutsdb.DataStructureBTree, BUCKET)
	}); err != nil && !errors.Is(err, nutsdb.ErrBucketAlreadyExist) {
		panic(err)
	}

	return &GameLinesHandler{
		DB: db,
	}
}

func (h *GameLinesHandler) getFromCache(fenPosition string) []Line {
	var cachedLine []byte
	// ignore the error as we get one when the key it not found
	err := h.DB.View(func(tx *nutsdb.Tx) (err error) {
		key := []byte(fenPosition)

		cachedLine, err = tx.Get(BUCKET, key)
		return err
	})

	if err != nil && !errors.Is(err, nutsdb.ErrKeyNotFound) {
		panic(err)
	}

	var res []Line
	if len(cachedLine) > 0 {
		fmt.Println("cached")
		err := json.Unmarshal(cachedLine, &res)
		if err != nil {
			panic(err)
		}
	}

	return res
}

func (h *GameLinesHandler) writeToCache(fenPosition string, lines []Line) {
	err := h.DB.Update(
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

type MoveEval struct {
	Before []Line
	After  []Line
}

func (h *GameLinesHandler) Handle(w http.ResponseWriter, r *http.Request) {
	var body struct {
		PGN string
	}
	err := json.NewDecoder(r.Body).Decode(&body)
	if err != nil {
		panic(err)
	}

	pgn := body.PGN
	// pgn := r.URL.Query().Get("pgn")

	games, err := chess.GamesFromPGN(strings.NewReader(pgn))
	if err != nil {
		panic(err)
	}

	if len(games) != 1 {
		panic(errors.New("wrong number of pgn"))
	}
	game := games[0]

	nbLines := "3"
	positions := game.Positions()

	moveEvals := make([][]Line, len(positions))

	// start computing the lines, but in batch.
	const batchSize = 5
	for i := 0; i < len(positions); i++ {
		var wg sync.WaitGroup
		wg.Add(batchSize)

		for j := 0; j < batchSize; j++ {
			go func(index int) {
				// we are at the last batch, with not enough lines to fill it
				if index >= len(positions) {
					wg.Done()
					return
				}

				var pos *chess.Position = positions[index]
				fenPosition := pos.String()
				color := lo.Ternary(pos.Turn() == chess.Black, "b", "w")

				lines := h.getFromCache(fenPosition)
				if len(lines) == 0 {
					lines = computeLines(fenPosition, nbLines, false)
					h.writeToCache(fenPosition, lines)
				}

				fmt.Printf("line computed\n")

				moveEvals[index] = lo.Map(
					lines,
					func(line Line, _ int) Line {
						// for some reason, stockfish returns a positive score if the color to move has an advantage and a negative score else
						// We want to standardize the score with negative = advantage black and positive = advantage white.
						// We do this by looking at the color playing (for the engine).
						line.ScoreCP = line.ScoreCP * lo.Ternary(color == "w", 1, -1)
						line.ScoreMate = line.ScoreMate * lo.Ternary(color == "w", 1, -1)

						return line
					},
				)
				wg.Done()
			}(i*batchSize + j)
		}
		wg.Wait()
	}

	response, err := json.Marshal(moveEvals)
	if err != nil {
		panic(err)
	}

	fmt.Printf("done; responding")

	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
}
