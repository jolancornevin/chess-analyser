package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/nutsdb/nutsdb"
	"github.com/rs/cors"

	"github.com/jolancornevin/stockfish_http/pkg/dao"
	"github.com/jolancornevin/stockfish_http/pkg/handler"
)

func main() {
	ctx := context.Background()

	nutDB, err := nutsdb.Open(
		nutsdb.DefaultOptions,
		nutsdb.WithDir("./tmp/nutsdb"),
	)
	if err != nil {
		panic(err)
	}
	defer nutDB.Close()

	stopper, err := dao.StartDB()
	if err != nil {
		panic(err)
	}
	defer stopper.Stop()

	pg, err := dao.Connect(ctx)
	if err != nil {
		panic(err)
	}
	defer pg.Conn().Close(ctx)

	router := mux.NewRouter()

	moveLines := handler.NewGetLinesHandler(nutDB)
	router.HandleFunc("/engine/move_lines", moveLines.Handle)

	opening := handler.NewOpeningHandler()
	router.HandleFunc("/opening", opening.Handle)

	createGames := handler.NewCreateGame(pg, nutDB)
	// make it a POST because the PGN can be big and we don't want that in the query params
	router.HandleFunc("/games", createGames.Handle).Methods("POST")

	gameLines := handler.NewGameLinesHandler(pg)
	router.HandleFunc("/games/{id}", gameLines.Handle).Methods("GET")

	handler := cors.Default().Handler(router)

	fmt.Println("started server")

	err = http.ListenAndServe(":5001", handler)

	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("server closed\n")
	} else if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}
