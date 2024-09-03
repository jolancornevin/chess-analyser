package dao

import (
	"context"
	_ "embed"

	embeddedpostgres "github.com/fergusstrange/embedded-postgres"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Stopper interface {
	Stop() error
}

func StartDB() (Stopper, error) {
	postgres := embeddedpostgres.NewDatabase(embeddedpostgres.DefaultConfig().
		RuntimePath("./tmp/pg").
		DataPath("./pg_data").Port(5435))
	err := postgres.Start()
	if err != nil {
		return nil, err
	}

	// Do test logic

	return postgres, nil
}

//go:embed sql/migrations/init_db.sql
var initDBSQL string

func Connect(ctx context.Context) (*pgxpool.Conn, error) {
	poolConfig, err := pgxpool.ParseConfig("postgresql://postgres:postgres@localhost:5435?sslmode=disable")
	if err != nil {
		panic(err)
	}

	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		panic(err)
	}

	// _, err = pool.Exec(ctx, "delete from chess.game_moves CASCADE; delete from chess.fen_lines CASCADE; delete from chess.game CASCADE;")
	// if err != nil {
	// 	panic(err)
	// }

	// _, err = pool.Exec(ctx, "drop table chess.game_moves; drop table chess.fen_lines; drop table chess.game;")
	// if err != nil {
	// 	panic(err)
	// }

	_, err = pool.Exec(ctx, initDBSQL)
	if err != nil {
		panic(err)
	}

	return pool.Acquire(ctx)
}
