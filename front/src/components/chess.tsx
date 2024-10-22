import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Chess, SQUARES, Move as cMove } from "chess.js";
import { DrawShape } from "chessground/draw";
import * as cg from "chessground/types";

import Chessground from "@react-chess/chessground";

import { GetOpening } from "../api/opening";
import { ChessComGame, ComputeMoveScore, Line, LineMove, Move, NewMove, Node, resetMoveIDs } from "../types";
import { GameScore, GetCurrentMaterialCount } from "../types/game";
import { ChessComGames } from "./chesscom";
import { EngineWholeGame, resetEngineCache } from "./engine";
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
    const [material, setMaterial] = useState<GameScore>(GetCurrentMaterialCount(chess));

    const [puzzleEnabled, setEnablePuzzle] = useState(false);
    const [puzzleTargetMove, setPuzzleTargetMove] = useState<LineMove>();

    // Moves and computation
    const [moves, setMoves] = useState<Record<number, Node<Move>>>({});
    const [lines, setLines] = useState<Line[]>([]);
    const [computeTime, setComputeTime] = useState(0);

    const [currentMoveID, setCurrentMoveID] = useState(0);

    let nbOfGameMoves = useRef(-1);

    const computeValidMoves = useCallback(() => {
        const dests = new Map();

        // loop through all squares and find legal moves.
        SQUARES.forEach((square) => {
            dests.set(
                square,
                chess.moves({ square, verbose: true })?.map((m) => m.to),
            );
        });

        setAllowedDest(dests);
    }, [chess, setAllowedDest]);

    const computeMaterial = useCallback(() => {
        setMaterial(GetCurrentMaterialCount(chess));
    }, [chess, setMaterial]);

    const onPGNChange = useCallback(
        async (game: ChessComGame) => {
            chess.loadPgn(game.pgn);
            const comments = chess.getComments();

            // just to start from 0 again.
            resetMoveIDs();
            resetEngineCache();
            setLines([]);

            let moves: Record<number, Node<Move>> = {};
            let index = 0;

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

            setFen(moves[0].data.fen);

            const opening = await GetOpening(movesAsString.join(","));

            setOpening(opening.title);

            setMoves(moves);
            setCurrentMoveID(0);

            const startTime = performance.now();

            setMoves(await EngineWholeGame(game.uuid, game.pgn, new Date(game.end_time).toUTCString(), moves));

            setComputeTime(Math.round((performance.now() - startTime) / 1000));
        },
        [chess, setFen, setOpening, setMoves, setCurrentMoveID],
    );

    // Load a game
    const onSelectGame = useCallback(
        async (game: ChessComGame) => {
            onPGNChange(game);
            setCurrentGame(game);

            setOrientation(game.white.username === playerID ? "white" : "black");
        },
        [onPGNChange, setCurrentGame],
    );

    // Load a move
    const loadMove = useCallback(
        async (move: LineMove) => {
            playSound(move.cmove);

            chess.load(move.fen);
            setFen(move.fen);
            setLastMove([move.cmove.from, move.cmove.to]);

            // do it last, after chess.load is done
            computeValidMoves();
            computeMaterial();
        },
        [chess, setFen, setLastMove, computeValidMoves, computeMaterial],
    );

    // Load move WITHIN the current game. It does what loadMove does + a few extra
    // stuff like changing the current game move in the move list.
    const loadCurrentGameMove = useCallback(
        async (node: Node<Move>) => {
            const move = node.data;
            loadMove(move);

            // Update states
            setCurrentMoveID(move.id);

            if (move.bestMove) {
                drawArrow({
                    orig: move.bestMove.slice(0, 2) as cg.Key,
                    dest: move.bestMove.slice(2, 4) as cg.Key,
                    brush: "blue",
                });
            }

            setLines(move.linesAfter);
        },
        [drawArrow, loadMove],
    );

    const handleKeyDown = useCallback(
        (event) => {
            console.log("keydown");
            switch (event.key) {
                case "ArrowLeft":
                    if (currentMoveID - 1 >= 0) {
                        loadCurrentGameMove(moves[currentMoveID - 1]);
                    }
                    break;
                case "ArrowRight":
                    if (currentMoveID + 1 <= nbOfGameMoves.current) {
                        loadCurrentGameMove(moves[currentMoveID + 1]);
                    }
                    break;
                default:
                    return;
            }

            // prevent default action (eg. page moving up/down)
            // but consider accessibility (eg. user may want to use keys to choose a radio button)
            event.preventDefault();
        },
        [loadCurrentGameMove, moves, currentMoveID],
    );
    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, [handleKeyDown]);

    // find the next puzzle in the game i.e positions where there was a significant gain.
    // we do it for both black and white.
    const findNextPuzzle = useCallback((): boolean => {
        // we search from currentMoveID + 2 because our currentMoveID is the move before the puzzle.
        // if we were to look from currentMoveID + 1, we'd always end up on the same puzzle
        for (let i = currentMoveID + 2 ?? 0; i < nbOfGameMoves.current; i++) {
            const move = moves[i];
            if (
                move.data.wasOnlyMove ||
                move.data.bestLine.materialDiff >= 2 ||
                move.data.bestLine.materialDiff <= -2
            ) {
                // select the move before the only move.
                loadCurrentGameMove(moves[i - 1]);

                setPuzzleTargetMove(moves[i].data.bestLine.moves[0]);
                return true;
            }
        }
        // if we haven't found the next puzzle, reset
        setPuzzleTargetMove(undefined);
        setEnablePuzzle(false);

        return false;
    }, [currentMoveID, moves, loadCurrentGameMove]);

    const onBoardMove = useCallback(
        async (from: cg.Key, to: cg.Key, capturedPiece?: cg.Piece) => {
            // if we are here, it means that we've found the correct move.
            // onBoardMove is not called if the move is not among the dest
            if (puzzleEnabled && puzzleTargetMove) {
                // if there is a next puzzle, keep going.
                if (findNextPuzzle()) {
                    return;
                }
                // else, we set the move as usual to validate the last puzzle
            }

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

            // set the move without engine data
            setMoves((prevMoves) => {
                return { ...prevMoves, [node.data.id]: node };
            });

            loadCurrentGameMove(node);

            // start the engine promise
            ComputeMoveScore(node).then((scoredMove: Node<Move>) => {
                setMoves((prevMoves) => {
                    setLines(scoredMove.data.linesAfter);
                    return { ...prevMoves, [scoredMove.data.id]: scoredMove };
                });
            });
        },
        [puzzleEnabled, puzzleTargetMove, chess, moves, currentMoveID, loadCurrentGameMove, findNextPuzzle],
    );

    // compute valid moves to tell chessground which move we can do.
    useEffect(computeValidMoves, [chess, computeValidMoves]);

    const playerColor = currentGame?.white.username === playerID ? "w" : "b";

    const PlayerUX = useCallback(
        ({ username, time, materialDiff }: { username: string; time: string; materialDiff: number }) => {
            return (
                <div style={{ lineHeight: "1.5rem" }}>
                    <b>{username}</b>
                    <span
                        style={{ backgroundColor: "white", color: "black", borderRadius: 4, marginLeft: 8, padding: 4 }}
                    >
                        {time}
                    </span>
                    <span style={{ marginLeft: 8, padding: 4 }}>{materialDiff > 0 ? materialDiff : ""}</span>
                </div>
            );
        },
        [],
    );

    return (
        <div style={{ display: "flex", flexDirection: "row", alignSelf: "flex-start", paddingLeft: 32 }}>
            <div style={{ width: 300, flex: 1 }}>
                <div style={{ border: "1px solid white", padding: 8, marginBottom: 16 }}>
                    Enable Puzzle:
                    <input
                        type="checkbox"
                        id="checkbox"
                        checked={puzzleEnabled}
                        onChange={() => {
                            setEnablePuzzle((prev) => !prev);
                        }}
                    />
                    {puzzleEnabled && (
                        <div>
                            Find Next puzzle <span onClick={findNextPuzzle}>➡️</span> {puzzleTargetMove ? "✅" : "❌"}
                        </div>
                    )}
                </div>

                <ChessComGames playerID={playerID} onSelectGame={onSelectGame} />
            </div>
            <div style={{ flex: 1 }}>
                <PlayerUX
                    username={
                        currentGame?.white.username === playerID
                            ? currentGame?.black.username
                            : currentGame?.white.username
                    }
                    time={
                        moves[currentMoveID]?.data?.cmove.color === playerColor
                            ? moves[currentMoveID]?.data?.comment
                            : moves[currentMoveID - 1]?.data?.comment
                    }
                    materialDiff={
                        currentGame?.white.username === playerID
                            ? material.b.total - material.w.total
                            : material.w.total - material.b.total
                    }
                />

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
                            dests:
                                // if puzzle, make only the target move possible
                                puzzleEnabled && puzzleTargetMove
                                    ? new Map([
                                          [
                                              puzzleTargetMove.cmove.from as cg.Key,
                                              [puzzleTargetMove.cmove.to as cg.Key],
                                          ],
                                      ])
                                    : allowedDest,
                            // if puzzle, don't show the dest so we don't spoil the target
                            showDests: !(puzzleEnabled && puzzleTargetMove),
                        },
                        events: {
                            move: onBoardMove,
                        },
                    }}
                />

                <PlayerUX
                    username={
                        currentGame?.white.username === playerID
                            ? currentGame?.white.username
                            : currentGame?.black.username
                    }
                    time={
                        moves[currentMoveID]?.data?.cmove.color !== playerColor
                            ? moves[currentMoveID]?.data?.comment
                            : moves[currentMoveID - 1]?.data?.comment
                    }
                    materialDiff={
                        currentGame?.white.username === playerID
                            ? material.w.total - material.b.total
                            : material.b.total - material.w.total
                    }
                />
            </div>
            <div style={{ marginLeft: 16, width: 400, paddingLeft: 16 }}>
                <div style={{ height: 700 }}>
                    <div>Analysed in: {computeTime}s</div>
                    <div>Opening: {opening}</div>

                    <Lines
                        linesForNewPos={lines}
                        expectedLine={moves[currentMoveID]?.data?.bestLine}
                        onMoveClick={loadMove}
                    />

                    <div style={{ overflowY: "auto", marginTop: 8, height: 500, border: "1px solid white" }}>
                        {moves[0] !== undefined && (
                            <Moves
                                startNode={moves[0]}
                                onMoveClick={loadCurrentGameMove}
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
