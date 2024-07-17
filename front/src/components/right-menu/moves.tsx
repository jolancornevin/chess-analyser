import { useCallback, useMemo, useState } from "react";
import { ComputeMoveScore, Move } from "../types";

interface MoveProps {
    move: Move;
    onMoveClick: (move: Move) => Promise<void>

    currentMove: number;
    setCurrentMove: React.Dispatch<React.SetStateAction<number>>;

    orientation: string;
}

function MoveUX({ move, onMoveClick, currentMove, setCurrentMove, orientation }: MoveProps): JSX.Element {    
    // const [move, setMove] = useState(_move);
    
    const noteMove = useCallback((move: Move): JSX.Element => {
        if (!move.scoreComputed) {
            if (orientation[0] !== move.cmove.color) {
                return <></>;
            }

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
        <div style={{ width: "50%", cursor: "pointer", textAlign: "left", backgroundColor: move.id === currentMove? "#8b8987": "" }} onClick={async () => {
            setCurrentMove(move.id);
            await onMoveClick(move)
        }}>
            {move.number}. {move.to}: {noteMove(move)} 
        </div>
    );
}


interface MovesProps {
    _moves: Move[];
    onMoveClick: (move: Move) => Promise<void>
    orientation: string;
}

export function Moves({ _moves, onMoveClick, orientation }: MovesProps): JSX.Element {
    const [currentMove, setCurrentMove] = useState(0);

    const iniMoves: Record<number, Move> = Object.assign({}, ..._moves.map((move) => ({ [move.id]: move })));

    const [moves, setMoves] = useState<Record<number, Move>>({});

    useMemo(async () => { 
        if (Object.keys(moves).length !== Object.keys(iniMoves).length) {
            // set the init state when props are changed
            setMoves(iniMoves);
        }
        
        const size = 5;

        for (let i=0; i<_moves.length; i+=size) {
            await Promise.all(
                _moves.slice(i, i + size)
                    // compute only our moves
                    // .filter((move) => (orientation[0] === move.cmove.color))
                    .map((move) => {
                        return ComputeMoveScore(move).then((scoredMove) => {
                            setMoves((prevMoves) => { return ({ ...prevMoves, [scoredMove.id]: scoredMove }) });
                        });
                    })
            );
        }
    }, [_moves, orientation, setMoves]);
    
    return (
        <div style={{ overflowY: "auto", height: 600, marginTop: 8, border: "1px solid white",  }}>
            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                width: "100%"
            }}>
                {Object.values(moves).map((move, i): JSX.Element => {
                    // TODO hightlight current move + hotkey left and right to move from move to move
                    return (
                        <MoveUX key={move.id} move={move} onMoveClick={onMoveClick} currentMove={currentMove} setCurrentMove={setCurrentMove} orientation={orientation}/>
                    );
                })}
            </div>
        </div>
    )
}