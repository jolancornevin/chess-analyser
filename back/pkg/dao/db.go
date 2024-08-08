package dao

import (
	"github.com/jmoiron/sqlx"
)

func Connect() (*sqlx.DB, error) {
	db, err := sqlx.Connect("postgres", "host=localhost port=5432 user=postgres password=postgres dbname=postgres sslmode=disable")
	return db, err
}
