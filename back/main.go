package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/jolancornevin/stockfish_http/uci"
	"github.com/notnil/chess"
	"github.com/samber/lo"

	"github.com/rs/cors"
)

const (
	QUICK_ENGINE_DEPTH = 12
	ENGINE_DEPTH       = 20
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

var cache = map[string][]Line{}

func computeLines(color, fenPosition, nbLines string, quick bool) []Line {
	if lines, ok := cache[fenPosition]; ok {
		fmt.Println("cached")
		return lines
	}

	// set up engine to use stockfish exe
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
		panic(err)
	}

	res := lo.Map(
		eng.SearchResults().MultiPV,
		func(info uci.Info, _ int) Line {
			// for some reason, stockfish returns a positive score if the color to move has an advantage and a negative score else
			// We want to standardize the score with negative = advantage black and positive = advantage white.
			// We do this by looking at the color playing (for the engine).
			return Line{
				ScoreCP:   info.Score.CP * lo.Ternary(color == "w", 1, -1),
				ScoreMate: info.Score.Mate * lo.Ternary(color == "w", 1, -1),
				Line:      strings.Join(lo.Map(info.PV, func(move *chess.Move, _ int) string { return move.String() }), " "),

				W: info.WDL[0],
				D: info.WDL[1],
				L: info.WDL[2],
			}
		},
	)

	cache[fenPosition] = res
	return res
}

func handleComputeLines(w http.ResponseWriter, r *http.Request) {
	// ctx := r.Context()

	fenPosition := r.URL.Query().Get("fenPosition")
	nbLines := r.URL.Query().Get("nbLines")
	color := r.URL.Query().Get("color")
	quick := r.URL.Query().Get("quick")

	fmt.Printf("got / request with %s for %v lines \n", fenPosition, nbLines)

	// moves := eng.SearchResults().BestMove

	res := computeLines(color, fenPosition, nbLines, quick == "true")

	response, err := json.Marshal(res)
	if err != nil {
		panic(err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", handleComputeLines)

	handler := cors.Default().Handler(mux)

	fmt.Println("started server")

	err := http.ListenAndServe(":5001", handler)

	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("server closed\n")
	} else if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}
