with insert_cte AS (
    INSERT INTO chess.game (UUID, date) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING ID
) 
SELECT id FROM insert_cte
UNION 
SELECT id FROM chess.game WHERE UUID = $1;