import React, { useCallback } from "react";

import { Move, Node } from "../types";

const BLACK_CELL_COLOR = "";
const WHITE_CELL_COLOR = "#c3d7ff30";

interface MoveProps {
    move: Move;

    onClick: () => Promise<void>;

    currentMoveID: number;

    orientation: string;
}

function MoveUX({ move, onClick, currentMoveID, orientation }: MoveProps): JSX.Element {
    const noteMove = useCallback((move: Move): JSX.Element => {
        if (!move.scoreComputed) {
            return <>loading</>;
        }

        let score: JSX.Element[] = [];

        if (move.wasOnlyMove && !move.playedOnlyMove) {
            score.push(<>{move.scoreBefore > move.scoreAfter && <img height={15} src="img/miss.png" alt="miss" />}</>);
        }
        if (move.wasOnlyMove && move.playedOnlyMove) {
            score.push(<img height={15} src="img/onlymove.png" alt="onlymove" />);
        }

        if (!move.wasOnlyMove) {
            if (move.scoreDiff < 60) {
            } else if (move.scoreDiff < 80) {
                score.push(
                    <>
                        [{move.scoreBefore > move.scoreAfter && <img height={15} src="img/mistake.png" alt="mistake" />}
                        ]
                    </>,
                );
            } else if (move.scoreDiff < 150) {
                score.push(
                    <>
                        [
                        {move.scoreBefore > move.scoreAfter && (
                            <img height={15} src="img/misstake.png" alt="misstake" />
                        )}
                        ]
                    </>,
                );
            } else {
                // TODO blunter only if we love a piece or it's mate
                score.push(
                    <>
                        [{move.scoreBefore > move.scoreAfter && <img height={15} src="img/blunter.png" alt="blunter" />}
                        ]
                    </>,
                );
            }
        }

        const winBefore = move.wdlBefore.win;
        const winAfter = move.wdlAfter.win;

        // const drawBefore = move.wdlBefore.draw;
        // const drawAfter = move.wdlAfter.draw;

        // const loseBefore = move.wdlBefore.lose;
        // const loseAfter = move.wdlAfter.lose;

        const lostPoints = winBefore - winAfter;

        if (winBefore > 200 && winBefore < 800) {
            if (lostPoints === 0) {
                score.push(<img height={15} src="img/great.png" alt="great" />);
            } else if (lostPoints < 20) {
                score.push(<img height={15} src="img/good.png" alt="good" />);
            } else if (lostPoints < 50) {
                score.push(<img height={15} src="img/ok.png" alt="ok" />);
            } else if (lostPoints < 100) {
                score.push(<img height={15} src="img/misstake.png" alt="misstake" />);
            } else if (lostPoints < 200) {
                score.push(<img height={15} src="img/mistake.png" alt="mistake" />);
            } else {
                score.push(<img height={15} src="img/blunter.png" alt="blunter" />);
            }
        }

        // score.push(<>{(winBefore - winAfter) / 100} {(loseBefore  -loseAfter) / 100} </>);
        // if (winBefore - winAfter > 250) {
        //     score.push(<img height={15} src="img/blunter.png" alt="blunter" />);
        // } else if (winBefore - winAfter > 150) {
        //     score.push(<img height={15} src="img/mistake.png" alt="mistake" />);
        // } else if (winBefore - winAfter > 50) {
        //     score.push(<img height={15} src="img/misstake.png" alt="misstake" />);
        // }
        // // draws
        // else if (drawBefore - drawAfter > 200) {
        //     score.push(<img height={15} src="img/mistake.png" alt="mistake" />);
        // } else if (drawBefore - drawAfter > 100) {
        //     score.push(<img height={15} src="img/misstake.png" alt="misstake" />);
        // }
        // // wins
        // else if (loseBefore - loseAfter > 250) {
        //     score.push(<img height={15} src="img/great.png" alt="great" />);
        // } else if (loseBefore - loseAfter > 150) {
        //     score.push(<img height={15} src="img/good.png" alt="good" />);
        // } else if (loseBefore - loseAfter > 50) {
        //     score.push(<img height={15} src="img/ok.png" alt="ok" />);
        // }

        return <>{score}</>;
    }, []);

    return (
        <div
            style={{
                cursor: "pointer",
                textAlign: "left",
                backgroundColor: move.id === currentMoveID ? "#3c63b2ba" : "",
            }}
            onClick={onClick}
        >
            {move.number}. {move.cmove.san}: {noteMove(move)}
        </div>
    );
}

interface MovesProps {
    startNode: Node<Move>;
    onMoveClick: (move: Node<Move>) => Promise<void>;
    orientation: string;

    currentMoveID: number;

    asLine?: boolean;
}

export function Moves({ startNode, onMoveClick, orientation, currentMoveID, asLine }: MovesProps): JSX.Element {
    let move = startNode;
    const moves = [move];

    while (move.next) {
        moves.push(move.next);
        move = move.next;
    }

    return (
        <div style={{}}>
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    width: "100%",
                }}
            >
                {/* TODO show moves two by two and add [...] when they are alternate moves */}
                {Object.values(moves).map((move, i): JSX.Element => {
                    const bgColor = i % 4 >= 2 ? WHITE_CELL_COLOR : BLACK_CELL_COLOR;

                    return (
                        <React.Fragment key={move.data.id}>
                            {/* add empty box in case we have alternate moves to show */}
                            {move.data.cmove.color === "b" && move.alternates.length > 0 && (
                                <div style={{ width: "50%", height: "24px" }}>...</div>
                            )}

                            <div
                                style={{
                                    width: asLine ? "88px" : "50%",
                                    height: "24px",
                                }}
                            >
                                <MoveUX
                                    move={move.data}
                                    currentMoveID={currentMoveID}
                                    orientation={orientation}
                                    onClick={async () => {
                                        await onMoveClick(move);
                                    }}
                                />
                            </div>

                            {/* add empty box in case we have alternate moves to show */}
                            {move.data.cmove.color === "w" && move.alternates.length > 0 && (
                                <div style={{ width: "50%", height: "24px" }}>...</div>
                            )}

                            {move.alternates.length > 0 && (
                                <div style={{ width: "100%" }}>
                                    {move.alternates.map((alternateMove) => {
                                        return (
                                            <div style={{ marginLeft: 8 }}>
                                                <div style={{ width: "50%" }}></div>
                                                <Moves
                                                    startNode={alternateMove}
                                                    onMoveClick={onMoveClick}
                                                    orientation={orientation}
                                                    currentMoveID={currentMoveID}
                                                    asLine={true}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </React.Fragment>
                    );
                })}
            </div>
        </div>
    );
}
