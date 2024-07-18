import { useCallback, useMemo, useState } from "react";

import Chessground from "@react-chess/chessground";
import { Chess } from 'chess.js';
import { DrawShape } from "chessground/draw";
import * as cg from 'chessground/types';

import { engineEval } from "./menu/engine";
import { Lines } from "./menu/lines";
import { Moves } from "./menu/moves";
import { ComputeMoveScore, Line, Move, NewMove, resetEngineCache } from "./types";

declare const colors: readonly ["white", "black"];
declare type Color = typeof colors[number];


interface ChessUXProps {}
export function ChessUX({ }: ChessUXProps): JSX.Element {
    const chess = useMemo(() => new Chess(), []);

    const [orientation, setOrientation] = useState<Color>("white");
    const [fen, setFen] = useState('');
    const [lastMove, setLastMove] = useState([]);
    const [shape, drawArrow] = useState<DrawShape>();

    const [moves, setMoves] = useState<Record<number, Move>>({});
    const [lines, setLines] = useState<Line[]>([]);
    const [computeTime, setComputeTime] = useState(0);

    // TODO hotkey left and right to move from move to move
    const [currentMove, setCurrentMove] = useState(0);

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


        const startTime = performance.now()

        const size = 5;

        for (let i=0; i<moves.length; i+=size) {
            await Promise.all(
                moves.slice(i, i + size)
                    // compute only our moves
                    // .filter((move) => (orientation[0] === move.cmove.color))
                    .map((move) => {
                        return ComputeMoveScore(move).then((scoredMove) => {
                            setMoves((prevMoves) => { return ({ ...prevMoves, [scoredMove.id]: scoredMove }) });
                        });
                    })
            );
        }

        setComputeTime(Math.round((performance.now() - startTime) / 1000));

    }, [chess, setFen]);

    // Load a move
    const onMoveClick = useCallback(async (move: Move) => {
        setCurrentMove(move.id);

        setFen(move.fen);
        setLastMove([move.cmove.from, move.cmove.to]);
        if (move.bestMove) {
            drawArrow({ orig: move.bestMove.slice(0, 2) as cg.Key, dest: move.bestMove.slice(2, 4) as cg.Key, brush: "green" });
        }

        chess.load(move.fen);
        setLines([]);

        await engineEval(move.cmove.color, move.fen, 3, false).then((lines) => setLines(lines));
    }, [chess, setFen, setLastMove, drawArrow]);

    console.log({currentMove: moves[currentMove]})

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ flex: 2 }}>
                <Chessground
                    width={800}
                    height={800}
                    config={{
                    fen: fen,
                    lastMove: lastMove,
                    orientation: orientation,
                    autoCastle: true,
                    highlight: {
                        lastMove: true,
                        check: true,
                    },
                    animation: {
                        enabled: true,
                    },
                    drawable: {
                        enabled: true,
                        autoShapes: shape?[
                            shape,
                        ]: []
                    },
                    events: {
                        move: (orig: cg.Key, dest: cg.Key, capturedPiece?: cg.Piece) => {
                            // TODO create move variant
                            console.log("move");
                        },
                        dropNewPiece: (piece: cg.Piece, key: cg.Key) => {console.log("dropNewPiece")},
                        insert: (elements: cg.Elements) => {console.log("insert")},
                    },
                }} />
            </div>
            <div style={{ marginLeft: 16, width: 400, backgroundColor: "#312e2b", padding: 16 }}>
                
                <div>
                    <div style={{ flex: 1, border: "1px solid white" }}>
                        {/* Fen: <input value={fen} onChange={e => setFen(e.target.value)} /> */}
                        PGN: <textarea onChange={async (e) => await onPGNChange(e.target.value)} />
                        Playing as {orientation}: <input type="checkbox" checked={orientation === "white"} onChange={e => {setOrientation(e.target.checked ? "white": "black")}} />
                    </div>
                    <div style={{ marginTop: 8, height: 700 }}>
                        Analysed in: {computeTime}s

                        <Lines linesForNewPos={lines} expectedLine={moves[currentMove]?.bestLine} />

                        <Moves moves={moves} onMoveClick={onMoveClick} orientation={orientation} currentMove={currentMove} />
                    </div>
                </div>
            </div>
    </div>)
};
