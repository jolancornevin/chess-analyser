import { Chess, Move as cMove } from "chess.js";

export interface LineMove {
    // san: string; // Nxc2
    // lan: string; // d4c2
    cmove: cMove;
    fen: string;
}

export interface Line {
    startFen: string;
    moves: LineMove[];

    scoreType: string;

    rawScore: number;
    score: string;

    win: number;
    draw: number;
    lose: number;
}

export function NewLine(startFen, rawScore, scoreType, line, win, draw, lose): Line {
    const isMate = scoreType === "mate";
    const score = isMate ? rawScore : rawScore / 100;

    const chess = new Chess();
    chess.load(startFen);

    let moves = [];

    line.split(" ").forEach((move: string) => {
        // move is of format: c1b2. We want a more human format, but also
        // to keep the from and to in order to draw arrows
        const tsMove = chess.move(move);
        moves.push({
            cmove: tsMove,
            fen: tsMove.after,
        } as LineMove);
    });

    return {
        startFen,
        moves,

        score: `${isMate ? "M" : ""}${score}`, // in pawns
        rawScore: isMate ? rawScore * 1000 : rawScore, // in centipawns
        scoreType,

        win,
        draw,
        lose,
    };
}
