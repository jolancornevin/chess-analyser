package handler

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/notnil/chess"
	"github.com/nutsdb/nutsdb"
	"github.com/samber/lo"

	"github.com/jolancornevin/stockfish_http/pkg/handler/uci"
)

const (
	QUICK_ENGINE_DEPTH = 10
	ENGINE_DEPTH       = 15
)

type StringMove struct {
	Move string
}

func (m StringMove) String() string {
	return m.Move
}

// ProcessResponse implements the Cmd interface
func (StringMove) ProcessResponse(e *uci.Engine) error {
	return nil
}

type Line struct {
	Line      string
	ScoreCP   int
	ScoreMate int

	W int
	D int
	L int
}

func computeLines(fenPosition, nbLines string, quick bool) []Line {
	// set up engine to use stockfish
	eng, err := uci.New("stockfish")
	if err != nil {
		panic(err)
	}
	defer eng.Close()

	// initialize uci with new game
	if err := eng.Run(uci.CmdUCI, uci.CmdIsReady, uci.CmdUCINewGame); err != nil {
		panic(err)
	}

	// uci.Debug(eng)

	if err := eng.Run(
		// https://github.com/official-stockfish/Stockfish/wiki/UCI-&-Commands#standard-commands
		uci.CmdSetOption{Name: "MultiPV", Value: nbLines},
		uci.CmdSetOption{Name: "UCI_ShowWDL", Value: "true"},

		uci.CmdSetOption{Name: "UCI_LimitStrength", Value: "true"},
		uci.CmdSetOption{Name: "UCI_Elo", Value: lo.Ternary(quick, "2500", "3190")},
		// uci.CmdSetOption{Name: "Threads", Value: "64"},
		// StringMove{Move: fmt.Sprintf("setoption name UCI_ShowWDL value true")},
		StringMove{Move: fmt.Sprintf("position fen %v", fenPosition)},
		uci.CmdGo{Depth: lo.Ternary(quick, QUICK_ENGINE_DEPTH, ENGINE_DEPTH)},
	); err != nil {
		// although rare, it can happen that the engine is not capable of parsing
		// a position (for immediates mates for instance).
		// Let just return nothing.
		fmt.Printf(">>> ERROR: %v", err.Error())
		return []Line{}
	}

	res := lo.Map(
		eng.SearchResults().MultiPV,
		func(info uci.Info, _ int) Line {
			return Line{
				ScoreCP:   info.Score.CP,
				ScoreMate: info.Score.Mate,
				Line:      strings.Join(lo.Map(info.PV, func(move *chess.Move, _ int) string { return move.String() }), " "),

				W: info.WDL[0],
				D: info.WDL[1],
				L: info.WDL[2],
			}
		},
	)

	return res
}

var BUCKET = "lines_bucket"

type LinesHandler struct {
	DB *nutsdb.DB
}

func NewGetLinesHandler(db *nutsdb.DB) *LinesHandler {
	// make sure the bucket exist
	if err := db.Update(func(tx *nutsdb.Tx) error {
		return tx.NewBucket(nutsdb.DataStructureBTree, BUCKET)
	}); err != nil && !errors.Is(err, nutsdb.ErrBucketAlreadyExist) {
		panic(err)
	}

	return &LinesHandler{
		DB: db,
	}
}

func (h *LinesHandler) getFromCache(fenPosition string) []Line {
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

func (h *LinesHandler) writeToCache(fenPosition string, lines []Line) {
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

func (h *LinesHandler) Handle(w http.ResponseWriter, r *http.Request) {
	// ctx := r.Context()

	fenPosition := r.URL.Query().Get("fenPosition")
	nbLines := r.URL.Query().Get("nbLines")
	color := r.URL.Query().Get("color")
	quick := r.URL.Query().Get("quick")

	fmt.Printf("got / request with %s for %v lines with %s \n", fenPosition, nbLines, color)

	lines := h.getFromCache(fenPosition)
	if len(lines) == 0 {
		lines = computeLines(fenPosition, nbLines, quick == "true")
		// only save if we've analysed the position deeply
		if quick != "true" {
			h.writeToCache(fenPosition, lines)
		}
	}

	lines = lo.Map(
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

	response, err := json.Marshal(lines)
	if err != nil {
		panic(err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
}
