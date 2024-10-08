import { Move as cMove } from "chess.js";

import { engineEval } from "../components/engine";
import { Line } from "./line";
import { Node } from "./node";

export interface Move {
    id: number;

    number: number;
    cmove: cMove;
    to: string; // move (d4)
    fen: string;

    scoreComputed: boolean;

    scoreDiff?: number;
    accuracy?: number;

    comment: string;

    scoreBefore?: number;
    scoreAfter?: number;
    wdlBefore?: Record<string, number>;
    wdlAfter?: Record<string, number>;

    wasOnlyMove?: boolean;
    playedOnlyMove?: boolean;

    bestMove?: string;
    bestLine?: Line;
    linesAfter?: Line[];

    alternateMoves?: Move[];
}

var moveID = 0;

// TODO move this to a Game class
export function resetMoveIDs() {
    moveID = 0;
}

export function NewMove(value: cMove, moveNumber: number, comment: string): Move {
    return {
        id: moveID++,

        to: value.to,
        fen: value.after,
        number: moveNumber,
        cmove: value,

        comment: comment,

        scoreComputed: false,
    };
}

export function ComputeMoveScoreFromCache(node: Node<Move>, linesBefore: Line[], linesAfter: Line[]): Node<Move> {
    const move = node.data;

    if (move.scoreComputed) {
        return node;
    }

    return computeMove(node, linesBefore, linesAfter);
}

export async function ComputeMoveScore(node: Node<Move>): Promise<Node<Move>> {
    const move = node.data;

    if (move.scoreComputed) {
        return Promise.resolve(node);
    }

    const currentColor = move.cmove.color;
    const nextColor = currentColor === "w" ? "b" : "w";

    return new Promise(async (resolve, reject) => {
        await engineEval(currentColor, move.cmove.before, 3, false).then(async (linesBefore) => {
            await engineEval(nextColor, move.cmove.after, 3, false).then((linesAfter) => {
                resolve(computeMove(node, linesBefore, linesAfter));
            });
        });
    });
}

function computeMove(node: Node<Move>, linesBefore: Line[], linesAfter: Line[]) {
    const move = node.data;

    let accuracy = 0;
    let scoreDiff = 0;

    const currentColor = move.cmove.color;

    if (linesBefore.length > 0) {
        const bestLineBefore = linesBefore[0];

        // taking the last one because we want the best line for our opponent
        let bestLineAfter = null;

        let winPercentBefore = 0;
        let winPercentAfter = 0;

        // a typical example where linesAfter.length == 0 is after we've played mate move (last move)
        if (linesAfter.length > 0) {
            bestLineAfter = linesAfter[0];
            winPercentBefore = (2 / (1 + Math.exp(-0.00368208 * bestLineBefore.rawScore)) - 1) * 100;
            winPercentAfter = (2 / (1 + Math.exp(-0.00368208 * bestLineAfter.rawScore)) - 1) * 100;

            if (winPercentAfter > winPercentBefore) {
                accuracy = 100;
            } else {
                accuracy = Math.round(
                    103.1668100711649 * Math.exp(-0.04354415386753951 * (winPercentBefore - winPercentAfter)) -
                        3.166924740191411,
                );
            }
            scoreDiff = bestLineBefore.rawScore - bestLineAfter.rawScore;
        }

        let wasOnlyMove =
            // engine found more than one line
            linesBefore.length >= 2 &&
            // the diff between the first line and seconde is high
            ((currentColor === "w" && linesBefore[0].rawScore - linesBefore[1].rawScore > 200) ||
                (currentColor === "b" && linesBefore[0].rawScore * -1 - linesBefore[1].rawScore * -1 > 200));

        let playedOnlyMove =
            wasOnlyMove &&
            // and we played the move
            linesBefore[0].moves[0]?.cmove.lan === move.cmove.lan;

        const newMove = {
            ...move,

            scoreComputed: true,

            scoreDiff: scoreDiff, // (linesBefore.length > 0 ? linesBefore[0].score : "-")
            accuracy: accuracy,

            scoreBefore: bestLineBefore.rawScore,
            scoreAfter: bestLineAfter ? bestLineAfter.rawScore : 0,

            wdlBefore: {
                win: bestLineBefore.win,
                lose: bestLineBefore.lose,
                draw: bestLineBefore.draw,
            },
            wdlAfter: {
                // invert win and lose on purpose to adapt to wdl relative to move
                win: bestLineAfter ? bestLineAfter.lose : 0,
                lose: bestLineAfter ? bestLineAfter.win : 0,
                draw: bestLineAfter ? bestLineAfter.draw : 0,
            },

            wasOnlyMove: wasOnlyMove,
            playedOnlyMove: playedOnlyMove,

            bestMove: bestLineBefore.moves[0].cmove.lan,
            bestLine: bestLineBefore,
            linesAfter: linesAfter,
        };

        console.log({ newMove });
        node.data = newMove;
        return node;
    }

    return node;
}
