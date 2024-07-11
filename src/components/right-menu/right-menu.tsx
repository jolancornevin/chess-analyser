import { useCallback, useState } from "react";

import { Chess } from 'chess.js';
import { Line, Move } from "../types";
import { searchFromFen } from "./engine";
import { Lines } from "./lines";

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

    // Load a game
    const onPGNChange = useCallback(async (pgn: string) => {
        chess.loadPgn(pgn);
        setFen(chess.fen());
        console.log({ chess });

        let moves: Move[] = [];
        let index = 0;
        // start computing every move.
        for (const value of chess.history({ verbose: true })) {
            let _index = index;

            await searchFromFen(value.before, 3).then((lines) => {
                moves.push(
                    { to: value.to, fen: value.after, number: Math.floor(_index / 2), eval: (lines.length > 0? lines[0].score: "-") }
                )
            });            

            index += 1;
        }
        setMoves(moves);
        
    }, [chess, setFen]);

    // Load a move
    const onMoveClick = useCallback(async (move: Move) => {
        setFen(move.fen);
        chess.load(move.fen);
        setLines([]);
        
        await searchFromFen(move.fen, 3).then((lines) => setLines(lines));
    }, [chess, setFen]);

    return (
        <div style={{  }}>
            <div style={{ flex: 1 }}>
                {/* Fen: <input value={fen} onChange={e => setFen(e.target.value)} /> */}
                PGN: <textarea onChange={async (e) => await onPGNChange(e.target.value)} />
                Direction: <input type="checkbox" checked={orientation === "white"} onChange={e => {console.log(e.target.value); setOrientation(e.target.checked ? "white": "black")}} />
            </div>

            <Lines lines={lines} />

            <div style={{overflowY:"auto", height: 600, paddingTop: 8}}>
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
                                <div key={i}  style={{ width: "50%", cursor: "pointer", textAlign: "left" }} onClick={async () => {
                                   await onMoveClick(move)
                                }}>
                                    {move.number}. {move.to} [{move.eval}]
                                </div>
                            );
                        })
                    }
                </div>
            </div>
        </div>
    )
}