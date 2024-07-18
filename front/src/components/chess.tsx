import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Chessground from "@react-chess/chessground";
import { Chess, SQUARES } from 'chess.js';
import { DrawShape } from "chessground/draw";
import * as cg from 'chessground/types';

import { engineEval, resetEngineCache } from "./menu/engine";
import { Lines } from "./menu/lines";
import { Moves } from "./menu/moves";
import { ComputeMoveScore, Line, Move, NewMove, Node, resetMoveIDs } from "./types";

declare const colors: readonly ["white", "black"];
declare type Color = typeof colors[number];

export function ChessUX(): JSX.Element {
    const chess = useMemo(() => new Chess(), []);

    // INPUTS
    const [orientation, setOrientation] = useState<Color>("white");
    const [fen, setFen] = useState('');

    // Chess UX
    const [lastMove, setLastMove] = useState([]);
    const [shape, drawArrow] = useState<DrawShape>();
    const [allowedDest, setAllowedDest] = useState<Map<cg.Key, cg.Key[]>>(new Map());

    // Moves and computation
    const [moves, setMoves] = useState<Record<number, Node<Move>>>({});
    const [lines, setLines] = useState<Line[]>([]);
    const [computeTime, setComputeTime] = useState(0);

    // TODO hotkey left and right to move from move to move
    const [currentMoveID, setCurrentMoveID] = useState(0);

    let nbOfGameMoves = useRef(-1);

    // Load a game
    const onPGNChange = useCallback(async (pgn: string) => {
        chess.loadPgn(pgn);
        
        const moves: Record<number, Node<Move>> = {};
        let index = 0;
        let lastMoveID = -1;

        // just to start from 0 again.
        resetMoveIDs();
        resetEngineCache();

        // start listing every move.
        for (const value of chess.history({ verbose: true })) {
            const move = NewMove(value, Math.floor(index / 2) + 1);
            const node = new Node(move);
            
            moves[move.id] = node;
            lastMoveID = move.id;

            // on init, all ids will follow each others
            if (index > 0) {
                moves[move.id - 1].next = node;
            }

            nbOfGameMoves.current = move.id;

            index += 1;
        }

        setFen(chess.fen());
        
        setMoves(moves);
        setCurrentMoveID(lastMoveID);

        const movesAsArray = Object.values(moves);

        // start processing the move with the engine
        const batchSize = 5;
        const startTime = performance.now()

        for (let i=0; i<movesAsArray.length; i+=batchSize) {
            await Promise.all(
                movesAsArray.slice(i, i + batchSize)
                    // compute only our moves
                    // .filter((move) => (orientation[0] === move.cmove.color))
                    .map((move) => {
                        return ComputeMoveScore(move).then((scoredMove) => {
                            setMoves((prevMoves) => { return ({ ...prevMoves, [scoredMove.data.id]: scoredMove }) });
                        });
                    })
            );
        }

        setComputeTime(Math.round((performance.now() - startTime) / 1000));
    }, [chess, setFen]);

    // Load a move
    const onMoveClick = useCallback(async (move: Move) => {
        console.log(move);

        // Update states
        setCurrentMoveID(move.id);
        chess.load(move.fen);
        setFen(move.fen);

        // UX
        setLastMove([move.cmove.from, move.cmove.to]);
        if (move.bestMove) {
            drawArrow({ orig: move.bestMove.slice(0, 2) as cg.Key, dest: move.bestMove.slice(2, 4) as cg.Key, brush: "green" });
        }

        // Engines
        setLines([]);

    const nextColor = move.cmove.color === 'w'? 'b': 'w';
        await engineEval(nextColor, move.fen, 3, false).then((lines) => setLines(lines));
    }, [chess, setFen, setLastMove, drawArrow]);

    const onBoardMove = useCallback(async (from: cg.Key, to: cg.Key, capturedPiece?: cg.Piece) => {
        const cMove = chess.move({ from, to });

        const move = NewMove(cMove, moves[currentMoveID].data.number);
        let node = new Node(move);

        if (moves[currentMoveID].next === undefined && currentMoveID !== nbOfGameMoves.current) {
            moves[currentMoveID].next = node
        } else {
            // if the next move is the same as the next move, re-use it
            if (moves[currentMoveID].next?.data.to === node.data.to) {
                node = moves[currentMoveID].next
            } else {
                const nodeAlreadyInHistory = moves[currentMoveID].alternates.find((x) => { return x.data.to === node.data.to });
                // check if the move didn't get made before, to re-use it also
                if (!nodeAlreadyInHistory) {
                    moves[currentMoveID].addAlternates(node);
                } else {
                    node = nodeAlreadyInHistory;
                }
            }

        }

        ComputeMoveScore(node).then((scoredMove) => {
            setMoves((prevMoves) => {
                return ({ ...prevMoves, [scoredMove.data.id]: scoredMove });
            });
        });

        setMoves((prevMoves) => {
            return ({ ...prevMoves, [node.data.id]: node });
        });

        onMoveClick(node.data);
    }, [moves, currentMoveID, chess, nbOfGameMoves, onMoveClick]);

    useEffect(function computeValidMoves() {
        const dests = new Map();
        
        // loop through all squares and find legal moves.
        SQUARES.forEach(s => {
          const ms = chess.moves({square: s, verbose: true});
            if (ms.length) {
                dests.set(s, ms.map(m => m.to));
            }
        });

        setAllowedDest(dests);
    }, [chess, currentMoveID]);

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
                    movable: {
                        free: false,
                        dests: allowedDest
                    },
                    events: {
                        move: onBoardMove,
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

                        <Lines linesForNewPos={lines} expectedLine={moves[currentMoveID]?.data?.bestLine} />

                        <div style={{overflowY: "auto", marginTop: 8, height: 500, border: "1px solid white"}}>
                            {moves[0] !== undefined && <Moves firstMove={moves[0]} onMoveClick={onMoveClick} orientation={orientation} currentMoveID={currentMoveID} />}
                        </div>
                    </div>
                </div>
            </div>
    </div>)
};
