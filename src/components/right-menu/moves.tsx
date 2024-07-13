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
        if (!move.scoreDiff) {
            if (orientation[0] !== move.cmove.color) {
                return <></>;
            }

            return <>loading</>;
        }

        let score: JSX.Element[] = [];

        if (move.scoreDiff < 60) {
        } else if (move.scoreDiff < 80) {
            score.push(<>{move.scoreBefore > move.scoreAfter ? <img height={15} src="mistake.png"/> : ''}</>);
        } else if (move.scoreDiff < 150) {
            score.push( <>{move.scoreBefore > move.scoreAfter ? <img height={15} src="misstake.png"/> : ''}</>);
        } else {

            if (move.wasOnlyMove && !move.playedOnlyMove) {
                score.push(<>{move.scoreBefore > move.scoreAfter ? <img height={15} src="miss.png"/> : ''}</>);
            } else {
                score.push(<>{move.scoreBefore > move.scoreAfter ? <img height={15} src="blunter.png"/> : ''}</>);
            }
        }

        if (move.wasOnlyMove && move.playedOnlyMove) {
            score.push(<img height={15} src="onlymove.png"/>);
        }

        return <>{score}</>;
    }, [])

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

    useMemo(() => { 
        if (Object.keys(moves).length !== Object.keys(iniMoves).length) {
            // set the init state when props are changed
            setMoves(iniMoves);
        }

        _moves.forEach((move, i) => {
            // compute only our moves
            if (orientation[0] === move.cmove.color) {
                ComputeMoveScore(move).then((scoredMove) => {
                    setMoves((prevMoves) => { return ({ ...prevMoves, [scoredMove.id]: scoredMove })});
                });
            }
        });
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