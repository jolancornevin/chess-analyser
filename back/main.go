package main

import (
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/nutsdb/nutsdb"
	"github.com/rs/cors"

	"github.com/jolancornevin/stockfish_http/pkg/handler"
)

func main() {
	nutDB, err := nutsdb.Open(
		nutsdb.DefaultOptions,
		nutsdb.WithDir("./tmp/nutsdb"),
	)
	if err != nil {
		panic(err)
	}
	defer nutDB.Close()

	opening := handler.NewOpeningHandler()
	moveLines := handler.NewGetLinesHandler(nutDB)

	gameLines := handler.NewGameLinesHandler(nutDB)

	router := mux.NewRouter()
	router.HandleFunc("/engine/move_lines", moveLines.Handle)
	router.HandleFunc("/engine/game_lines", gameLines.Handle).Methods("POST")
	router.HandleFunc("/opening", opening.Handle)

	// createGames := handler.NewCreateGamesHandler(pgDB)
	// router.HandleFunc("/games", createGames).Methods("POST")

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
