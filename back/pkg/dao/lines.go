package dao

import (
	"context"
	_ "embed"

	"github.com/georgysavva/scany/v2/pgxscan"
	"github.com/jackc/pgx/v5"

	"github.com/jolancornevin/stockfish_http/pkg/entities"
)

type FenLines struct {
	DB pgx.Tx
}

func NewFenLines(db pgx.Tx) *FenLines {
	return &FenLines{
		DB: db,
	}
}

//go:embed sql/fen_lines/create.sql
var createLine string

func (d *FenLines) Create(ctx context.Context, fen string, lines []entities.Line) (int64, error) {
	var id int64
	err := pgxscan.Get(ctx, d.DB, &id, createLine, fen, lines)

	return id, err
}
