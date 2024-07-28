import { Color } from "chess.js";

import { Line, NewLine } from "../types/line";

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
                `http://127.0.0.1:5001/?fenPosition=${fen}&nbLines=${nbLines}&color=${color}&quick=${quick}`,
            );

            // const lines = await linesP;
            const res = await (await resP).json();

            const parsedLines = res.map(
                // TODO add type back response
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
