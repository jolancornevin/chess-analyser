import { Mutex } from "async-mutex";
import { useCallback, useMemo, useState } from "react";
import { ComputeMoveScore, Move } from "../types";

interface MoveProps {
    move: Move;
    onMoveClick: (move: Move) => Promise<void>

    currentMove: number;
    setCurrentMove: React.Dispatch<React.SetStateAction<number>>;

    orientation: string;
}

const mutex = new Mutex();

function MoveUX({ move, onMoveClick, currentMove, setCurrentMove, orientation }: MoveProps): JSX.Element {    
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
        // set the init state when props are changed
        setMoves(iniMoves);

        _moves.forEach((move, i) => {
            // compute only our moves
            if (orientation[0] === move.cmove.color) {
                ComputeMoveScore(move).then((scoredMove) => {
                    setMoves((prevMoves) => { console.log({prevMoves, scoredMove});  return ({ ...prevMoves, [scoredMove.id]: scoredMove })});
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