import { useCallback } from "react";
import { Move, Node } from "../types";

interface MoveProps {
    move: Move;

    onClick: () => Promise<void>

    currentMoveID: number;

    orientation: string;

    asLine?: boolean;
}

function MoveUX({ move, onClick, currentMoveID, orientation, asLine }: MoveProps): JSX.Element {    
    const noteMove = useCallback((move: Move): JSX.Element => {
        if (!move.scoreComputed) {

            return <>loading</>;
        }

        let score: JSX.Element[] = [];

        if (move.scoreDiff < 60) {
        } else if (move.scoreDiff < 80) {
            score.push(<>{move.scoreBefore > move.scoreAfter ? <img height={15} src="img/mistake.png"/> : ''}</>);
        } else if (move.scoreDiff < 150) {
            score.push( <>{move.scoreBefore > move.scoreAfter ? <img height={15} src="img/misstake.png"/> : ''}</>);
        } else {
            if (move.wasOnlyMove && !move.playedOnlyMove) {
                score.push(<>{move.scoreBefore > move.scoreAfter ? <img height={15} src="img/miss.png"/> : ''}</>);
            } else {
                // TODO blunter only if we love a piece or it's mate
                score.push(<>{move.scoreBefore > move.scoreAfter ? <img height={15} src="img/blunter.png"/> : ''}</>);
            }
        }

        if (move.wasOnlyMove && move.playedOnlyMove) {
            score.push(<img height={15} src="img/onlymove.png"/>);
        }

        const winBefore = move.wdlBefore.win;
        const winAfter = move.wdlAfter.lose;
        
        const loseBefore = move.wdlBefore.lose;
        const loseAfter = move.wdlAfter.win;
        
        // score.push(<>{(winBefore - winAfter) / 100} {(loseBefore  -loseAfter) / 100} </>);
        if (winBefore - winAfter > 250) {
            score.push(<img height={15} src="img/blunter.png"/>);
        } else if (winBefore - winAfter > 150) {
            score.push(<img height={15} src="img/mistake.png"/>);
        } else if (winBefore - winAfter > 50) {
            score.push(<img height={15} src="img/misstake.png"/>);
        }

        if (loseBefore - loseAfter < -200) {
            score.push(<img height={15} src="img/mistake.png"/>);
        } else if (loseBefore - loseAfter < -100) {
            score.push(<img height={15} src="img/misstake.png"/>);
        } 

        if (loseBefore - loseAfter > 250) {
            score.push(<img height={15} src="img/great.png"/>);
        } else if (loseBefore - loseAfter > 150) {
            score.push(<img height={15} src="img/good.png"/>);
        } else if (loseBefore - loseAfter > 50) {
            score.push(<img height={15} src="img/ok.png"/>);
        }

        return <>{score}</>;
    }, [orientation])

    return (
        <div style={{ cursor: "pointer", textAlign: "left", backgroundColor: move.id === currentMoveID? "#8b8987": "" }} onClick={onClick}>
            {move.number}. {move.to}: {noteMove(move)} 
        </div>
    );
}


interface MovesProps {
    firstMove: Node<Move>;
    onMoveClick: (move: Move) => Promise<void>
    orientation: string;

    currentMoveID: number;

    asLine?: boolean;
}

export function Moves({ firstMove, onMoveClick, orientation, currentMoveID, asLine }: MovesProps): JSX.Element {
    let move = firstMove;
    const moves = [move];

    while (move.next) {
        moves.push(move.next);
        move = move.next
    }

    return (
            <div style={{   }}>
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    width: "100%"
                }}>
                    {Object.values(moves).map((move, i): JSX.Element => {
                        return (
                            <>
                                <div style={{width: asLine? "64px": "50%"}}>
                                    <MoveUX
                                        key={move.data.id}
                                        move={move.data}
                                        currentMoveID={currentMoveID}
                                        orientation={orientation}
                                        onClick={async () => {
                                            await onMoveClick(move.data)
                                        }}
                                        asLine={asLine}
                                    />
                                </div>

                                {move.alternates.length > 0 && <div style={{ width: "100%" }}>
                                    {move.alternates.map((alternateMove) => {
                                        return (
                                            <div style={{ marginLeft: 8 }}>
                                                <Moves firstMove={alternateMove} onMoveClick={onMoveClick} orientation={orientation} currentMoveID={currentMoveID} asLine={true} />
                                            </div>
                                        )
                                    })}
                                </div>}
                            </>
                        );
                    })}
                </div>
            </div>
    )
}