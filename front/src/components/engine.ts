import { Color } from "chess.js";

import { ComputeGame, GetGameLines, MoveLine } from "../api";
import { ComputeMoveScoreFromCache, Move, Node } from "../types";
import { Line, NewLine } from "../types/line";

export async function EngineWholeGame(
    uuid: string,
    pgn: string,
    date: string,
    moves: Record<number, Node<Move>>,
): Promise<Record<number, Node<Move>>> {
    // const moveEvalsQuery = await fetch("http://127.0.0.1:5001/engine/game_lines", {
    //     method: "POST",
    //     headers: {
    //         Accept: "application/json",
    //         "Content-Type": "application/json",
    //     },
    //     body: JSON.stringify({ pgn: pgn }),
    // });
    // const moveEvals: Array<Array<EngineLine>> = await moveEvalsQuery.json();

    // TODO
    // - get the games
    // - create the game if it doesn't exists
    // - get the game lines and sort by move index
    // - fix duplicate fen in different games
    await ComputeGame(uuid, pgn, date);

    const moveEvals = await GetGameLines(uuid);

    console.log({ moveEvals });

    return Object.fromEntries(
        Object.entries(moves).map(([moveId, node], i) => {
            const linesBefore = moveEvals[i];
            const linesAfter = i + 1 === Object.keys(moves).length ? ({} as MoveLine) : moveEvals[i + 1];

            const parsedLinesBefore = linesBefore.Lines.map(
                (line): Line =>
                    NewLine(
                        node.data.cmove.before,
                        line.ScoreCP || line.ScoreMate,
                        line.ScoreMate !== 0 ? "mate" : "cp",
                        line.Line,
                        line.W,
                        line.D,
                        line.L,
                    ),
            );

            let parsedLinesAfter = [];
            if (linesAfter && linesAfter.Lines) {
                parsedLinesAfter = linesAfter.Lines.map(
                    (line): Line =>
                        NewLine(
                            node.data.cmove.after,
                            line.ScoreCP || line.ScoreMate,
                            line.ScoreMate !== 0 ? "mate" : "cp",
                            line.Line,
                            line.W,
                            line.D,
                            line.L,
                        ),
                );
            }

            const currentColor = node.data.cmove.color;
            const nextColor = currentColor === "w" ? "b" : "w";

            return [
                moveId,
                ComputeMoveScoreFromCache(
                    node,
                    sortLines(currentColor, parsedLinesBefore),
                    sortLines(nextColor, parsedLinesAfter),
                ),
            ];
        }),
    );
}

let cache = {};
export function resetEngineCache() {
    cache = {};
}

export async function engineEval(color: Color, fen: string, nbLines: number, quick: boolean): Promise<Line[]> {
    const cacheKey = fen + nbLines;

    if (!cache[cacheKey]) {
        cache[cacheKey] = new Promise(async (resolve, reject) => {
            // const linesP = _engineEval(fen, nbLines);
            const resP = fetch(
                `http://127.0.0.1:5001/engine/move_lines?fenPosition=${fen}&nbLines=${nbLines}&color=${color}&quick=${quick}`,
            );

            // const lines = await linesP;
            const res = await (await resP).json();

            const parsedLines = res.map(
                // TODO add TS type for the back response
                (line): Line =>
                    NewLine(
                        fen,
                        line.ScoreCP || line.ScoreMate,
                        line.ScoreMate !== 0 ? "mate" : "cp",
                        line.Line,
                        line.W,
                        line.D,
                        line.L,
                    ),
            );

            resolve(sortLines(color, parsedLines));
        });
    }

    return cache[cacheKey];
}

export function sortLines(color: Color, lines: Line[]): Line[] {
    const ascLines = lines.sort((a, b) => {
        // negative value if first is before the second argument, zero if ===, and a positive value otherwise.
        // I want to see the highest score for the line first. Mates are always higher.
        // We sort
        // 1. low to high mate
        // 2. high to low negative score
        // 3. low to high positive score
        // 4. high to low mate
        // and at the end, we'll reverse if the color is white

        if (a.scoreType === "mate" && b.scoreType !== "mate") {
            if (a.rawScore < 0) {
                return -1;
            }
            return 1;
        }
        if (a.scoreType !== "mate" && b.scoreType === "mate") {
            if (b.rawScore < 0) {
                return 1;
            }
            return -1;
        }

        // for mate, the lowest is last
        if (a.scoreType === "mate" && b.scoreType === "mate") {
            if (a.rawScore < 0 && b.rawScore > 0) {
                return -1;
            }

            if (b.rawScore < 0 && a.rawScore > 0) {
                return 1;
            }

            if (b.rawScore < 0 && a.rawScore < 0) {
                if (a.rawScore < b.rawScore) {
                    return 1;
                } else if (a.rawScore > b.rawScore) {
                    return -1;
                } else {
                    return 0;
                }
            }

            // both are > 0
            if (a.rawScore < b.rawScore) {
                return 1;
            } else if (a.rawScore > b.rawScore) {
                return -1;
            } else {
                return 0;
            }
        }

        if (b.rawScore < 0 && a.rawScore < 0) {
            if (a.rawScore < b.rawScore) {
                return -1;
            } else if (a.rawScore > b.rawScore) {
                return 1;
            } else {
                return 0;
            }
        }

        // we want the highest score first (sorting descending instead of ascending)
        if (a.rawScore < b.rawScore) {
            return -1;
        } else if (a.rawScore > b.rawScore) {
            return 1;
        } else {
            return 0;
        }
    });

    if (color === "w") {
        return ascLines.reverse();
    }

    return ascLines;
}
