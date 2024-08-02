import { Chess } from "chess.js";

export interface Material {
    q: number; // queen
    b: number; // bishop
    r: number; // rook
    p: number; // pawn
    n: number; // knight

    k: number; // king

    total: number;
}

export interface GameScore {
    w: Material;
    b: Material;
}

const pieceValues = {
    q: 9,
    b: 3,
    r: 5,
    p: 1,
    n: 3,
    k: 0,
};

export function GetCurrentMaterialCount(chess: Chess): GameScore {
    var score: GameScore = {
        w: {
            q: 0,
            b: 0,
            r: 0,
            p: 0,
            n: 0,

            k: 0,

            total: 0,
        },
        b: {
            q: 0,
            b: 0,
            r: 0,
            p: 0,
            n: 0,

            k: 0,

            total: 0,
        },
    };

    for (const line of chess.board()) {
        for (const square of line) {
            if (square === null) {
                continue;
            }
            score[square.color][square.type] += 1;
            score[square.color].total += pieceValues[square.type];
        }
    }

    return score;
}
