import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Chess, SQUARES, Move as cMove } from "chess.js";
import { DrawShape } from "chessground/draw";
import * as cg from "chessground/types";

import Chessground from "@react-chess/chessground";

import { ChessComGame, ComputeMoveScore, Line, LineMove, Move, NewMove, Node, resetMoveIDs } from "../types";
import { ChessComGames } from "./chesscom";
import { resetEngineCache } from "./engine";
import { Lines } from "./lines";
import { Moves } from "./moves";

declare const colors: readonly ["white", "black"];
declare type Color = (typeof colors)[number];

const playerID = "jolan160";
const captureSound = new Audio("./sounds/capture.mp3");
const moveSound = new Audio("./sounds/move-self.mp3");
const moveCheckSound = new Audio("./sounds/move-check.mp3");
const promotionSound = new Audio("./sounds/promote.mp3");
const castleSound = new Audio("./sounds/castle.mp3");

function playSound(move: cMove) {
    // TODO add check
    if (move.san.endsWith("+") || move.san.endsWith("#")) {
        moveCheckSound.play();
    } else if (move.captured) {
        captureSound.play();
    } else if (move.lan === "O-O" || move.lan === "O-O-O") {
        castleSound.play();
    } else if (move.promotion) {
        promotionSound.play();
    } else {
        moveSound.play();
    }
}

export function ChessUX(): JSX.Element {
    const chess = useMemo(() => new Chess(), []);

    // INPUTS
    const [orientation, setOrientation] = useState<Color>("white");
    const [fen, setFen] = useState("");

    // Chess UX
    const [lastMove, setLastMove] = useState([]);
    const [shape, drawArrow] = useState<DrawShape>();
    const [allowedDest, setAllowedDest] = useState<Map<cg.Key, cg.Key[]>>(new Map());
    const [opening, setOpening] = useState("");
    const [currentGame, setCurrentGame] = useState<ChessComGame>();

    // Moves and computation
    const [moves, setMoves] = useState<Record<number, Node<Move>>>({});
    const [lines, setLines] = useState<Line[]>([]);
    const [computeTime, setComputeTime] = useState(0);

    // TODO hotkey left and right to move from move to move
    const [currentMoveID, setCurrentMoveID] = useState(0);

    let nbOfGameMoves = useRef(-1);

    const onPGNChange = useCallback(
        async (pgn: string) => {
            chess.loadPgn(pgn);
            const comments = chess.getComments();

            // just to start from 0 again.
            resetMoveIDs();
            resetEngineCache();

            const moves: Record<number, Node<Move>> = {};
            let index = 0;
            let lastMoveID = -1;

            let movesAsString = [];
            // start listing every move.
            for (const value of chess.history({ verbose: true })) {
                let timeComment = "";
                // extract the time info from the comment
                const matchs = comments[index].comment.match("%clk (.*)]");
                if (matchs.length === 2) {
                    timeComment = matchs[1];
                }

                const move = NewMove(value, Math.floor(index / 2) + 1, timeComment);
                const node = new Node(move);

                moves[move.id] = node;
                lastMoveID = move.id;

                // on init, all ids will follow each others
                if (index > 0) {
                    moves[move.id - 1].next = node;
                }

                nbOfGameMoves.current = move.id;

                index += 1;
                movesAsString.push(move.cmove.lan);
            }

            if (movesAsString.length === 0) {
                return;
            }

            const resP = fetch(`http://127.0.0.1:5001/opening?moves=${movesAsString.join(",")}`);

            // const lines = await linesP;
            const res = await (await resP).json();

            setOpening(res.title);

            setFen(chess.fen());

            setMoves(moves);
            setCurrentMoveID(lastMoveID);

            const movesAsArray = Object.values(moves);

            // start processing the move with the engine
            const batchSize = 10;
            const startTime = performance.now();

            for (let i = 0; i < movesAsArray.length; i += batchSize) {
                await Promise.all(
                    movesAsArray
                        .slice(i, i + batchSize)
                        // compute only our moves
                        // .filter((move) => (orientation[0] === move.cmove.color))
                        .map((move) => {
                            return ComputeMoveScore(move).then((scoredMove) => {
                                setMoves((prevMoves) => {
                                    return { ...prevMoves, [scoredMove.data.id]: scoredMove };
                                });
                            });
                        }),
                );
            }

            setComputeTime(Math.round((performance.now() - startTime) / 1000));
        },
        [chess, setFen],
    );

    // Load a game
    const onSelectGame = useCallback(
        async (game: ChessComGame) => {
            onPGNChange(game.pgn);
            setCurrentGame(game);

            setOrientation(game.white.username === playerID ? "white" : "black");
        },
        [onPGNChange, setCurrentGame],
    );

    // Load a move
    const onMoveClick = useCallback(
        async (move: LineMove) => {
            console.log(move);
            playSound(move.cmove);

            chess.load(move.fen);
            setFen(move.fen);
            setLastMove([move.cmove.from, move.cmove.to]);

            // do it last, after chess.load is done
            computeValidMoves();
        },
        [chess, setFen, setLastMove],
    );

    // Load a game move. It does what onMoveClick does + compute the engine
    // lines
    const onGameMoveClick = useCallback(
        async (move: Move) => {
            onMoveClick(move);

            // Update states
            setCurrentMoveID(move.id);

            if (move.bestMove) {
                drawArrow({
                    orig: move.bestMove.slice(0, 2) as cg.Key,
                    dest: move.bestMove.slice(2, 4) as cg.Key,
                    brush: "blue",
                });
            }

            // Engines
            setLines(move.linesAfter);
        },
        [drawArrow, onMoveClick],
    );

    const onBoardMove = useCallback(
        async (from: cg.Key, to: cg.Key, capturedPiece?: cg.Piece) => {
            const cMove = chess.move({ from, to });

            const move = NewMove(cMove, moves[currentMoveID].data.number, "");
            let node = new Node(move);

            // special case for when we're manually adding moves after the last move
            if (moves[currentMoveID].next === undefined && currentMoveID !== nbOfGameMoves.current) {
                moves[currentMoveID].next = node;
                nbOfGameMoves.current += 1;
            } else {
                // if the next move is the same as the next move, re-use it
                if (moves[currentMoveID].next?.data.to === node.data.to) {
                    node = moves[currentMoveID].next;
                } else {
                    // look for the same move in the alternate moves
                    const nodeAlreadyInHistory = moves[currentMoveID].alternates.find((x) => {
                        return x.data.to === node.data.to;
                    });
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
                    return { ...prevMoves, [scoredMove.data.id]: scoredMove };
                });
            });

            setMoves((prevMoves) => {
                return { ...prevMoves, [node.data.id]: node };
            });

            onGameMoveClick(node.data);
        },
        [moves, currentMoveID, chess, nbOfGameMoves, onGameMoveClick],
    );

    function computeValidMoves() {
        const dests = new Map();

        // loop through all squares and find legal moves.
        SQUARES.forEach((square) => {
            dests.set(
                square,
                chess.moves({ square, verbose: true })?.map((m) => m.to),
            );
        });

        setAllowedDest(dests);
    }
    // compute valid moves to tell chessground which move we can do.
    useEffect(computeValidMoves, [chess, currentMoveID]);

    const playerColor = currentGame?.white.username === playerID ? "w" : "b";

    return (
        <div style={{ display: "flex", flexDirection: "row", alignSelf: "flex-start", paddingLeft: 32 }}>
            <div style={{ width: 300, flex: 1 }}>
                <ChessComGames playerID={playerID} onSelectGame={onSelectGame} />
            </div>
            <div style={{ flex: 1 }}>
                <div style={{ lineHeight: "1.5rem" }}>
                    <b>
                        {currentGame?.white.username === playerID
                            ? currentGame?.black.username
                            : currentGame?.white.username}
                    </b>
                    <span
                        style={{ backgroundColor: "white", color: "black", borderRadius: 4, marginLeft: 8, padding: 4 }}
                    >
                        {moves[currentMoveID]?.data?.cmove.color !== playerColor
                            ? moves[currentMoveID]?.data?.comment
                            : moves[currentMoveID - 1]?.data?.comment}
                    </span>
                </div>

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
                            autoShapes: shape ? [shape] : [],
                        },
                        movable: {
                            free: false,
                            dests: allowedDest,
                        },
                        events: {
                            move: onBoardMove,
                            dropNewPiece: (piece: cg.Piece, key: cg.Key) => {
                                console.log("dropNewPiece");
                            },
                            insert: (elements: cg.Elements) => {
                                console.log("insert");
                            },
                        },
                    }}
                />

                <div style={{ lineHeight: "1.5rem" }}>
                    <b>{playerID}</b>
                    <span
                        style={{ backgroundColor: "white", color: "black", borderRadius: 4, marginLeft: 8, padding: 4 }}
                    >
                        {moves[currentMoveID]?.data?.cmove.color === playerColor
                            ? moves[currentMoveID]?.data?.comment
                            : moves[currentMoveID - 1]?.data?.comment}
                    </span>
                </div>
            </div>
            <div style={{ marginLeft: 16, width: 400, paddingLeft: 16 }}>
                <div style={{ height: 700 }}>
                    <div>Analysed in: {computeTime}s</div>
                    <div>Opening: {opening}</div>

                    <Lines
                        linesForNewPos={lines}
                        expectedLine={moves[currentMoveID]?.data?.bestLine}
                        onMoveClick={onMoveClick}
                    />

                    <div style={{ overflowY: "auto", marginTop: 8, height: 500, border: "1px solid white" }}>
                        {moves[0] !== undefined && (
                            <Moves
                                firstMove={moves[0]}
                                onMoveClick={onGameMoveClick}
                                orientation={orientation}
                                currentMoveID={currentMoveID}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
