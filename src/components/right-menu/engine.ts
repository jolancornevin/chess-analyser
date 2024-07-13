import { Mutex } from "async-mutex";
import { Line, NewLine } from "../types";

export const ENGINE_DEPTH = 10;

interface Engine {
    postMessage(string): void;
    onmessage(string): void;
    onerror(string): void;
}

export async function getEngine(): Promise<Engine> {
    const engine = eval("stockfish");

    engine.onerror = (event: any) => {
        console.error({event});
    }

    return new Promise((resolve) => {
        engine.postMessage(`isready`);
        engine.onmessage = (event: { data: string }) => {
            let message = event.data;
            if (message === "readyok") {
                resolve(engine);
            }
        }

    });
}

const mutex = new Mutex();

export async function engineEval(fen: string, nbLines: number): Promise<Line[]> {
    console.log("asking muttex")
    const release = await mutex.acquire();
    console.log("got muttex")

    const lines = await _engineEval(fen, nbLines);

    release();
    console.log("released muttex")

    return lines;
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
        engine.postMessage(`setoption name MultiPV value ${nbLines}`)
    
        engine.postMessage(`ucinewgame`);
        engine.postMessage(`position fen ${fen}`);
        engine.postMessage(`go depth ${ENGINE_DEPTH}`);
        // console.log('-------------');

            
        engine.onmessage = (event: { data: string }) => {
            let message = event.data;
            // console.log(message);

            if (message.startsWith(`info depth ${ENGINE_DEPTH}`)) {
                // console.log(message);
                const regx = message.match(`.*score (?<type>cp|mate) (?<score>.*?) (upperbound|nodes).* pv (?<moves>.*)`);

                // console.debug("got line")
                
                if (regx && regx.groups !== undefined) {
                    const line = NewLine(Number(regx?.groups?.score), regx?.groups?.type, regx?.groups?.moves);
                    lines.push(line)

                    if (isNaN(line.rawScore)) {
                        console.error('ERROR', {line, regx})
                    }

                    if (lines.length === nbLines) {
                        // console.log("resolving because all lines");
                        engine.postMessage("stop");
                        engine.postMessage("quit");
                        
                        lines.sort((a, b) => {
                            // negative value if first < the second argument, zero if ===, and a positive value otherwise.
                            // I want to see the highest score for the line first. Mates are always higher

                            // TODO ------> Maybe it has to be evaluated depending on how's playing ???

                            if (a.scoreType === "mate" && b.scoreType !== "mate") {
                                return a.rawScore * 1000
                            }
                            if (a.scoreType !== "mate" && b.scoreType === "mate") {
                                return b.rawScore * 1000
                            }

                            if (a.rawScore < 0) {
                                if (b.rawScore >= 0) {
                                    return 1
                                } else {
                                    // we want the highest score first (sorting descending instead of ascending)
                                    if (a.rawScore < b.rawScore) {
                                        return 1
                                    } else if (a.rawScore > b.rawScore) {
                                        return 0
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

                        resolve(lines);
                    }
                }
            }
        };
    });
}