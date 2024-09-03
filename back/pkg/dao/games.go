package dao

import (
	"context"
	_ "embed"
	"time"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5"
	"github.com/jolancornevin/stockfish_http/pkg/entities"
)

type Games struct {
	DB pgx.Tx
}

func NewGames(db pgx.Tx) *Games {
	return &Games{
		DB: db,
	}
}

//go:embed sql/game/create.sql
var createGame string

func (d *Games) Create(ctx context.Context, UUID string, date time.Time) (int64, error) {
	var id int64
	err := pgxscan.Get(ctx, d.DB, &id, createGame, UUID, date)

	return id, err
}

//go:embed sql/game/list_lines.sql
var listLines string

func (d *Games) ListLines(ctx context.Context, UUID string) ([]entities.GameLines, error) {
	var res []entities.GameLines
	err := pgxscan.Select(ctx, d.DB, &res, listLines, UUID)

	return res, err
}
