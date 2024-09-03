package dao

import (
	"context"
	_ "embed"

	"github.com/jackc/pgx/v5"
)

type GameMoves struct {
	DB pgx.Tx
}

func NewGameMoves(db pgx.Tx) *GameMoves {
	return &GameMoves{
		DB: db,
	}
}

//go:embed sql/game_moves/create.sql
var createGameMove string

func (d *GameMoves) Create(ctx context.Context, gameID int64, fenID int64, moveIndex int) error {
	_, err := d.DB.Exec(ctx, createGameMove, gameID, fenID, moveIndex)
	return err
}
