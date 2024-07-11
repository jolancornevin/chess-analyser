import { Line, NewLine } from "../types";

export const ENGINE_DEPTH = 10;


const META = {
    engine: null
}

export function getEngine() {
    if (META.engine) {
        return META.engine
    }

    META.engine = eval("stockfish");

    META.engine.onerror = (event: any) => {
        console.log({event});
    }
    
    return META.engine;
}

export async function searchFromFen(fen: string, nbLines: number): Promise<Line[]> {

    return new Promise((resolve, reject) => {
        // console.debug("computing line")
        const engine = getEngine();
        // set number of lines to eval
        META.engine.postMessage(`setoption name MultiPV value ${nbLines}`)
    
        engine.postMessage(`position fen ${fen}`);
        engine.postMessage(`go depth ${ENGINE_DEPTH}`);
        console.log('-------------');

        const lines: Line[] = [];
            
        engine.onmessage = (event: { data: string }) => {
            let message = event.data;

            if (message.startsWith(`info depth ${ENGINE_DEPTH}`)) {
                // console.log(message);
                const regx = message.match(`.*score (?<type>cp|mate) (?<score>.*) nodes.* pv (?<moves>.*)`);

                // console.debug("got line")
                
                if (regx && regx.groups !== undefined) {
                    lines.push(NewLine(Number(regx?.groups?.score) || 0, regx?.groups?.type || "", regx?.groups?.moves || "",))

                    if (lines.length === nbLines) {
                        engine.postMessage(`stop`);
                        resolve(lines.sort((a, b) => {
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
                                    if (a.rawScore < b.rawScore) {
                                        return 1
                                    } else if (a.rawScore > b.rawScore) {
                                        return 0
                                    }
                                }
                            } else {
                                if (a.rawScore < b.rawScore) {
                                    return -1
                                } else if (a.rawScore > b.rawScore) {
                                    return 1
                                }
                            }


                            return 0
                        }));
                    }
                }
            }
        };

        // it can happen that there aren't enought lines to match the nbLines. 
        // This is a fallback until I find a better way to detect that the engine is done searching.
        setTimeout(() => {resolve(lines.sort((a, b) => (a.rawScore - b.rawScore)));}, 1000)
    });
}