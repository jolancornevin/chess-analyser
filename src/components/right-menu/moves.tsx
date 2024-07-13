import { Mutex } from "async-mutex";
import { useCallback, useMemo, useState } from "react";
import { Move } from "../types";

interface MoveProps {
    i: number;

    move: Move;
    onMoveClick: (move: Move) => Promise<void>

    currentMove: number;
    setCurrentMove: React.Dispatch<React.SetStateAction<number>>;

    orientation: string;
}

const mutex = new Mutex();

function MoveUX({ i, move, onMoveClick, currentMove, setCurrentMove, orientation }: MoveProps): JSX.Element {    
    // const [move, setMove] = useState(_move);
    
    useMemo(async () => {
        // compute only our moves
        if (orientation[0] !== move.cmove.color) {
            return;
        }

        // const release = await mutex.acquire();
        
        // const computedMove = await ComputeMoveScore(_move);
        
        // setMove(computedMove);
        // release();
    }, []);
    
    const noteMove = useCallback((move: Move) => {

        if (!move.scoreDiff) {
            if (orientation[0] !== move.cmove.color) {
                return '';
            }

            return 'loading';
        }

        if (move.scoreDiff < 20) {
            return ''
        }

        if (move.scoreDiff < 60) {
            return move.scoreBefore > move.scoreAfter ? 'Meh' : '';
        }

        if (move.scoreDiff < 150) {
            return move.scoreBefore > move.scoreAfter ? 'Oops' : '';
        }

        return move.scoreBefore > move.scoreAfter ? 'Blunter' : '';
    }, [])

    return (
        <div style={{ width: "50%", cursor: "pointer", textAlign: "left", backgroundColor: i === currentMove? "#8b8987": "" }} onClick={async () => {
            setCurrentMove(i);
            await onMoveClick(move)
        }}>
            {move.number}. {move.to}: {noteMove(move)} 
        </div>
    );
}


interface MovesProps {
    moves: Move[];
    onMoveClick: (move: Move) => Promise<void>
    orientation: string;
}

export function Moves({ moves, onMoveClick, orientation }: MovesProps): JSX.Element {
    const [currentMove, setCurrentMove] = useState(0);
    
    return (
        <div style={{ overflowY: "auto", height: 600, marginTop: 8, border: "1px solid white",  }}>
            <div style={{
                flex: 1,
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                width: "100%"
            }}>
                {moves.map((move, i): JSX.Element => {
                    // TODO hightlight current move + hotkey left and right to move from move to move
                    return (
                        <MoveUX key={i} i={i} move={move} onMoveClick={onMoveClick} currentMove={currentMove} setCurrentMove={setCurrentMove} orientation={orientation}/>
                    );
                })}
            </div>
        </div>
    )
}