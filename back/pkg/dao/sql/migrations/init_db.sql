CREATE SCHEMA IF NOT EXISTS chess;

CREATE TABLE chess.game (
    id BIGSERIAL PRIMARY KEY, 
    UUID TEXT NOT NULL UNIQUE, -- chess.com uuid
    date DATE NOT NULL
);

-- store the lines for a given fen
CREATE TABLE chess.fen_lines (
    id BIGSERIAL PRIMARY KEY, 
    fen TEXT UNIQUE,
    lines JSON NOT NULL
);

CREATE TABLE chess.game_moves (
    id BIGSERIAL PRIMARY KEY, 

    game_id BIGINT NOT NULL,
    fen_id BIGINT NOT NULL,
    move_index INT NOT NULL, -- first move, 4th move, etc.

    UNIQUE (game_id, fen_id, move_index),
    CONSTRAINT fk_fen FOREIGN KEY(fen_id) REFERENCES chess.fen_lines(id),
    CONSTRAINT fk_game FOREIGN KEY(game_id) REFERENCES chess.game(id)
);
