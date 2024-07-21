package handler

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/notnil/chess"
	"github.com/notnil/chess/opening"
)

type OpeningHandler struct {
	bookECO *opening.BookECO
}

func NewOpeningHandler() *OpeningHandler {
	return &OpeningHandler{
		bookECO: opening.NewBookECO(),
	}
}

func (h *OpeningHandler) Handle(w http.ResponseWriter, r *http.Request) {
	// ctx := r.Context()
	_moves := r.URL.Query().Get("moves")
	moves := strings.Split(_moves, ",")

	g := chess.NewGame()
	for _, move := range moves {
		g.MoveStr(move)
	}

	// TODO FIX Possible() is basically returning everything
	openings := h.bookECO.Possible(g.Moves())

	var opening *opening.Opening
	maxOpeningMatchingMoves := 0

	for _, o := range openings {
		c := 0
		for i, move := range strings.Split(o.PGN(), " ") {
			if move == moves[i] {
				c += 1
			}
		}
		if c > maxOpeningMatchingMoves {
			maxOpeningMatchingMoves = c
			opening = o
		}
	}

	if opening == nil {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{}`))
	}

	response, err := json.Marshal(struct {
		Code  string `json:"code"`
		Title string `json:"title"`
		Pgn   string `json:"pgn"`
		// Game  *chess.Game
	}{
		Code:  opening.Code(),
		Title: opening.Title(),
		Pgn:   opening.PGN(),
		// Game:  o.Game(),
	})
	if err != nil {
		panic(err)
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
}
