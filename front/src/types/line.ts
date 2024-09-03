import { Chess, Move as cMove } from "chess.js";

import { GetCurrentMaterialCount } from "./game";

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

    materialDiff: number;

    win: number;
    draw: number;
    lose: number;
}

export function NewLine(startFen, rawScore, scoreType, line, win, draw, lose): Line {
    const isMate = scoreType === "mate";
    const score = isMate ? rawScore : rawScore / 100;

    const chess = new Chess();
    chess.load(startFen);

    const scoreBefore = GetCurrentMaterialCount(chess);

    let moves = [];

    console.log({ line });
    line.split(" ").forEach((move: string) => {
        // move is of format: c1b2. We want a more human format, but also
        // to keep the from and to in order to draw arrows
        const tsMove = chess.move(move);
        moves.push({
            cmove: tsMove,
            fen: tsMove.after,
        } as LineMove);
    });

    const scoreAfter = GetCurrentMaterialCount(chess);

    return {
        startFen,
        moves,

        score: `${isMate ? "M" : ""}${score}`, // in pawns
        rawScore: isMate ? rawScore * 1000 : rawScore, // in centipawns
        scoreType,

        materialDiff: scoreAfter.w.total - scoreAfter.b.total - (scoreBefore.w.total - scoreBefore.b.total),

        win,
        draw,
        lose,
    };
}
