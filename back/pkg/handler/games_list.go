package handler

import (
	"github.com/jmoiron/sqlx"
)

type ListGames struct {
	DB *sqlx.DB
}

func NewListGames(db *sqlx.DB) *ListGames {
	return &ListGames{
		DB: db,
	}
}

// func (h *ListGames) Handle(w http.ResponseWriter, r *http.Request) {
// 	quick := r.URL.Query().Get("quick")

// 	response, err := json.Marshal(lines)
// 	if err != nil {
// 		panic(err)
// 	}

// 	w.Header().Set("Content-Type", "application/json")
// 	w.Write(response)
// }
