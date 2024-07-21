package main

import (
	"errors"
	"fmt"
	"net/http"
	"os"

	"github.com/nutsdb/nutsdb"
	"github.com/rs/cors"

	"github.com/jolancornevin/stockfish_http/pkg/handler"
)

func main() {
	db, err := nutsdb.Open(
		nutsdb.DefaultOptions,
		nutsdb.WithDir("./tmp/nutsdb"),
	)
	if err != nil {
		panic(err)
	}
	defer db.Close()

	opening := handler.NewOpeningHandler()
	lines := handler.NewLinesHandler(db)

	mux := http.NewServeMux()
	mux.HandleFunc("/", lines.Handle)
	mux.HandleFunc("/opening", opening.Handle)

	handler := cors.Default().Handler(mux)

	fmt.Println("started server")

	err = http.ListenAndServe(":5001", handler)

	if errors.Is(err, http.ErrServerClosed) {
		fmt.Printf("server closed\n")
	} else if err != nil {
		fmt.Printf("error starting server: %s\n", err)
		os.Exit(1)
	}
}
