import { useCallback } from "react";
import { Move } from "../types";

interface MoveProps {
    move: Move;

    onClick: () => Promise<void>

    currentMove: number;

    orientation: string;
}

function MoveUX({ move, onClick, currentMove, orientation }: MoveProps): JSX.Element {    
    // const [move, setMove] = useState(_move);
    
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
        <div style={{ width: "50%", cursor: "pointer", textAlign: "left", backgroundColor: move.id === currentMove? "#8b8987": "" }} onClick={onClick}>
            {move.number}. {move.to}: {noteMove(move)} 
        </div>
    );
}


interface MovesProps {
    moves: Record<number, Move>;
    onMoveClick: (move: Move) => Promise<void>
    orientation: string;

    currentMove: number;
}

export function Moves({ moves, onMoveClick, orientation, currentMove }: MovesProps): JSX.Element {    
    return (
            <div style={{ overflowY: "auto", height: 500, marginTop: 8, border: "1px solid white",  }}>
                <div style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "row",
                    flexWrap: "wrap",
                    width: "100%"
                }}>
                    {Object.values(moves).map((move, i): JSX.Element => {
                        return (
                            <MoveUX
                                key={move.id}
                                move={move}
                                currentMove={currentMove}
                                orientation={orientation}
                                onClick={async () => {
                                    await onMoveClick(move)
                                }}
                            />
                        );
                    })}
                </div>
            </div>
    )
}