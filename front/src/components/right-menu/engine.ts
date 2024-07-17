import { Color } from "chess.js";
import { Line, NewLine } from "../types";


export async function engineEval(color: Color, fen: string, nbLines: number, quick: boolean): Promise<Line[]> {
    // the move we have is for current move.
    // We need the next color to adjust the engine score. cf backend
    const colorNextMove = color === "w" ? "b" : "w";

    // const linesP = _engineEval(fen, nbLines);
    const resP = fetch(`http://127.0.0.1:5001/?fenPosition=${fen}&nbLines=${nbLines}&color=${colorNextMove}&quick=${quick}`);

    // const lines = await linesP;
    const res = await (await resP).json();

    const parsedLines = res.map((line): Line => (
        NewLine(
            line.ScoreCP || line.ScoreMate,
            line.ScoreCP !== 0 ? 'cp' : 'mate',
            line.Line,
            line.W, line.D, line.L,
        )
    ))

    console.log({ json: res, parsedLines });

    return sortLines(parsedLines);
}

function sortLines(lines: Line[]): Line[] {
    return lines.sort((a, b) => {
        // negative value if first < the second argument, zero if ===, and a positive value otherwise.
        // I want to see the highest score for the line first. Mates are always higher

        // TODO ------> Maybe it has to be evaluated depending on who's playing ???

        if (a.scoreType === "mate" && b.scoreType !== "mate") {
            return 1
        }
        if (a.scoreType !== "mate" && b.scoreType === "mate") {
            return -1
        }

        if (a.rawScore < 0) {
            if (b.rawScore >= 0) {
                return 1
            } else {
                // we want the highest score first (sorting descending instead of ascending)
                if (a.rawScore > b.rawScore) {
                    return -1
                } else if (a.rawScore < b.rawScore) {
                    return 1
                } else {
                    return 0;
                }
            }
        } else {
            // we want the highest score first (sorting descending instead of ascending)
            if (a.rawScore < b.rawScore) {
                return 1;
            } else if (a.rawScore > b.rawScore) {
                return -1;
            } else {
                return 0;
            }
        }


        return 0
    });
}

// DEPRECATED AND REPLACED BY SERVER CALL

export const ENGINE_DEPTH = 5;

interface Engine {
    postMessage(string): void;
    onmessage(string): void;
    onerror(string): void;
}

let engine = null;

declare global {
    interface Window { stockfish: any; }
}

export async function getEngine(): Promise<Engine> {
    if (engine) {
        return engine
    }

    // engine = eval("stockfish");
    engine = window.stockfish;

    engine.onerror = (event: any) => {
        console.error({event});
    }

    await new Promise((resolve) => {
        engine.postMessage(`isready`);
        engine.onmessage = (event: { data: string }) => {
            let message = event.data;
            if (message === "readyok") {
                resolve(engine);
            }
        }
    });

    return engine;
}

export async function _engineEval(fen: string, nbLines: number): Promise<Line[]> {
    return new Promise(async (_resolve, reject) => {
        const lines: Line[] = [];

        const resolve = (value: Line[] | PromiseLike<Line[]>) => {
            console.log("resolving", value);
            clearTimeout(t);
            _resolve(value);
        }

        // it can happen that there aren't enough lines to match the nbLines.
        // This is a fallback until I find a better way to detect that the engine is done searching.
        const t = setTimeout(() => {
            resolve(lines.sort((a, b) => (a.rawScore - b.rawScore)));
        }, 10000);

        const engine = await getEngine();
        // set number of lines to eval
        engine.postMessage(`setoption name Threads value 4`)

        engine.postMessage(`setoption name MultiPV value ${nbLines}`)
        engine.postMessage(`setoption name UCI_ShowWDL value true`)

        engine.postMessage(`ucinewgame`);

        engine.postMessage(`position fen ${fen}`);
        engine.postMessage(`go depth ${ENGINE_DEPTH}`);
        // console.log('-------------');

        engine.onmessage = (event: { data: string }) => {
            let message = event.data;
            // console.log(message);

            if (message.startsWith(`info depth ${ENGINE_DEPTH}`)) {
                // console.log(message);
                const regx = message.match(`.*score (?<type>cp|mate) (?<score>.*?) (wdl) (?<win>.*?) (?<draw>.*?) (?<lose>.*?) (upperbound|nodes).* pv (?<moves>.*)`);

                if (regx && regx.groups !== undefined) {
                    const line = NewLine(
                        Number(regx?.groups?.score),
                        regx?.groups?.type,
                        regx?.groups?.moves,
                        Number(regx?.groups?.win),
                        Number(regx?.groups?.draw),
                        Number(regx?.groups?.lose),
                    );
                    lines.push(line)

                    if (isNaN(line.rawScore)) {
                        console.error('ERROR', {line, regx})
                    }

                    if (lines.length === nbLines) {
                        // console.log("resolving because all lines");
                        engine.postMessage("stop");
                        // engine.postMessage("quit");

                        resolve(sortLines(lines));
                    }
                }
            }
        };
    });
}
