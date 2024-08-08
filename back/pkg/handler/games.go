package handler

import (
	"github.com/jmoiron/sqlx"
)

type CreateGamesHandler struct {
	DB *sqlx.DB
}

func NewCreateGamesHandler(db *sqlx.DB) *CreateGamesHandler {
	return &CreateGamesHandler{
		DB: db,
	}
}

// func (h *CreateGamesHandler) Handle(w http.ResponseWriter, r *http.Request) {
// 	quick := r.URL.Query().Get("quick")

// 	response, err := json.Marshal(lines)
// 	if err != nil {
// 		panic(err)
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	w.Write(response)
// }
