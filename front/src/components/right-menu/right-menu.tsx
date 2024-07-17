import { useCallback, useState } from "react";

import { Chess } from 'chess.js';
import { DrawShape } from "chessground/draw";
import * as cg from 'chessground/types';

import { Line, Move, NewMove, resetEngineCache } from "../types";
import { engineEval } from "./engine";
import { Lines } from "./lines";
import { Moves } from "./moves";

declare const colors: readonly ["white", "black"];
declare type Color = typeof colors[number];

interface RightMenuProps {
    chess: Chess;

    setLastMove: React.Dispatch<React.SetStateAction<any[]>>;
    setFen: React.Dispatch<React.SetStateAction<string>>;

    orientation: Color;
    setOrientation: React.Dispatch<React.SetStateAction<Color>>;

    drawArrow: React.Dispatch<React.SetStateAction<DrawShape>>;
}

export function RightMenu({chess, setFen, setLastMove, orientation, setOrientation, drawArrow }: RightMenuProps): JSX.Element {
    const [moves, setMoves] = useState<Move[]>([]);
    const [lines, setLines] = useState<Line[]>([]);

    // Load a game
    const onPGNChange = useCallback(async (pgn: string) => {
        chess.loadPgn(pgn);
        resetEngineCache();

        const moves: Move[] = [];
        let index = 0;

        // start computing every move.
        for (const value of chess.history({ verbose: true })) {
            let _index = index;

            moves.push(NewMove(_index, value, Math.floor(_index / 2) + 1));

            index += 1;
        }

        setFen(chess.fen());
        setMoves(moves);
        
    }, [chess, setFen]);

    // Load a move
    const onMoveClick = useCallback(async (move: Move) => {
        setFen(move.fen);
        setLastMove([move.cmove.from, move.cmove.to]);
        if (move.bestMove) {
            drawArrow({ orig: move.bestMove.slice(0, 2) as cg.Key, dest: move.bestMove.slice(2, 4) as cg.Key, brush: "green" });
        }
        
        chess.load(move.fen);
        setLines([]);
        
        await engineEval(move.fen, 3).then((lines) => setLines(lines));
    }, [chess, setFen, setLastMove, drawArrow]);

    return (
        <div>
            <div style={{ flex: 1, border: "1px solid white" }}>
                {/* Fen: <input value={fen} onChange={e => setFen(e.target.value)} /> */}
                PGN: <textarea onChange={async (e) => await onPGNChange(e.target.value)} />
                Playing as {orientation}: <input type="checkbox" checked={orientation === "white"} onChange={e => {setOrientation(e.target.checked ? "white": "black")}} />
            </div>
            <div style={{ marginTop: 8, height: 700}}>
                <Lines lines={lines} />
                <Moves _moves={moves} onMoveClick={onMoveClick} orientation={orientation} />
            </div>            
        </div>
    )
}