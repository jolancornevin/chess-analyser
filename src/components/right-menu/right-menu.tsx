import { useCallback, useMemo, useState } from "react";

import { Chess, Move as CMove } from 'chess.js';
import { Line, Move } from "../types";
import { Lines } from "./lines";

const ENGINE_DEPTH = 10;

declare const colors: readonly ["white", "black"];
declare type Color = typeof colors[number];

interface RightMenuProps {
    chess: Chess;

    setFen: React.Dispatch<React.SetStateAction<string>>;

    orientation: Color;
    setOrientation: React.Dispatch<React.SetStateAction<Color>>;
}

export function RightMenu({chess, setFen, orientation, setOrientation }: RightMenuProps): JSX.Element {
    const [moves, setMoves] = useState<Move[]>([]);
    const [lines, setLines] = useState<Line[]>([]);

    const engine = useMemo(() => {
        console.log("getting sf");
        const engine = eval("stockfish");

        // set number of lines to eval
        console.log(engine.postMessage("setoption name MultiPV value 3"))

        engine.onmessage = (event: {data: string}) => {
            let message = event.data;
            console.log(message)
            
            if (message.startsWith(`info depth ${ENGINE_DEPTH}`)) {
                const regx = message.match(`.*score (?<type>cp|mate) (?<score>.*) nodes.* pv (?<moves>.*)`);
                
                if (regx && regx.groups !== undefined) {
                    setLines((prev) => [
                        ...prev,
                        {
                            score: Number(regx?.groups?.score) || 0,
                            scoreType: regx?.groups?.type || "",
                            line: regx?.groups?.moves || "",
                        }
                    ])
                } 
            }
        }
        engine.onerror = (event: any) => {
            console.log({event});
        }
        
        return engine;
    }, []);

    // Load a game
    const onPGNChange = useCallback((pgn: string) => {
        chess.loadPgn(pgn);
        setFen(chess.fen());
        console.log({ chess });

        // start computing every move.
        setMoves(chess.history({ verbose: true }).map((value: CMove, index: number): Move => {
            return { to: value.to, fen: value.after, number: Math.floor(index / 2) };
        }));
    }, [chess, setFen]);

    // Load a move
    const onMoveClick = useCallback((move: Move) => {
        setFen(move.fen);
        chess.load(move.fen);
        setLines([]);

        engine.postMessage(`position fen ${move.fen}`);
        engine.postMessage(`go depth ${ENGINE_DEPTH}`);
    }, [chess, engine, setFen]);

    return (
        <div style={{  }}>
            <div style={{ flex: 1 }}>
                {/* Fen: <input value={fen} onChange={e => setFen(e.target.value)} /> */}
                PGN: <textarea onChange={e => onPGNChange(e.target.value)} />
                Direction: <input type="checkbox" checked={orientation === "white"} onChange={e => {console.log(e.target.value); setOrientation(e.target.checked ? "white": "black")}} />
            </div>

            <Lines lines={lines} />

            <div style={{overflowY:"auto", height: 800, paddingTop: 8}}>
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    width: "100%"
                    }}>
                        {moves.map((move, i): JSX.Element => {
                            // TODO hightlight current move + hotkey left and right to move from move to move
                            return (
                                <div key={i}  style={{ width: "50%", cursor: "pointer", textAlign: "left" }} onClick={() => {
                                    onMoveClick(move)
                                }}>
                                    {move.number}. {move.to}
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    )
}