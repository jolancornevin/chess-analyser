INSERT INTO chess.game_moves (game_id, fen_id, move_index) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING;