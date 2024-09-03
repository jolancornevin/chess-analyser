export interface MoveLine {
    Fen: string;
    Lines: EngineLine[];
    MoveIndex: number;
}

export interface EngineLine {
    D: number;
    W: number;
    L: number;

    Line: string;
    ScoreCP: number;
    ScoreMate: number;
}

export async function ComputeGame(uuid: string, pgn: string, date: string): Promise<void> {
    await fetch("http://127.0.0.1:5001/games", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            UUID: uuid,
            Date: date,
            pgn: pgn,
        }),
    });
}

export async function GetGameLines(uuid: string): Promise<Array<MoveLine>> {
    const linesQuery = await fetch(`http://127.0.0.1:5001/games/${uuid}`);

    const res = await linesQuery.json();

    return res.sort((a, b) => a.MoveIndex - b.MoveIndex);
}
