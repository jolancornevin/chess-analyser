SELECT move_index, fen, lines
FROM chess.game
INNER JOIN chess.game_moves on game_moves.game_id = game.id
INNER JOIN chess.fen_lines on game_moves.fen_id = fen_lines.id
WHERE game.UUID = $1;