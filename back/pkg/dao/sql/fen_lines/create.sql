with insert_cte AS (
    INSERT INTO chess.fen_lines (fen, lines) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING ID
) 
SELECT id FROM insert_cte
UNION 
SELECT id FROM chess.fen_lines WHERE fen = $1;