package handler

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/jolancornevin/stockfish_http/pkg/dao"
)

type GameLinesHandler struct {
	DB *pgxpool.Conn
}

func NewGameLinesHandler(db *pgxpool.Conn) *GameLinesHandler {
	return &GameLinesHandler{
		DB: db,
	}
}

func (h *GameLinesHandler) Handle(w http.ResponseWriter, r *http.Request) {
	ctx := context.Background()

	// for defer
	var err error

	params := mux.Vars(r)
	gameUUID := params["id"]

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
	moveEvals, err := gameDAO.ListLines(ctx, gameUUID)
	if err != nil {
		panic(err)
	}

	response, err := json.Marshal(moveEvals)
	if err != nil {
		panic(err)
	}

	fmt.Printf("done; responding")

	w.Header().Set("Content-Type", "application/json")
	w.Write(response)
}
