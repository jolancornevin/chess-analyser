
import { Move as cMove } from 'chess.js';
import { engineEval } from './right-menu/engine';


export interface Line {
    line: string;

    scoreType: string;

    rawScore: number;
    score: string;
}

export function NewLine(rawScore, scoreType, line): Line {
    const isMate = scoreType === "mate";
    const score = isMate ? rawScore : rawScore / 100;
    
    return {
        score: `${isMate ? "M" : ""}${score}`, // in pawns
        rawScore: rawScore, // in centipawns
        scoreType:scoreType,
        line: line,
    } 
}

export interface Move {
    id: number;

    number: number;
    to: string; // move (d4)
    fen: string;
    
    scoreComputed: boolean;

    cmove?: cMove;
    scoreDiff?: number;
    accuracy?: number;

    scoreBefore?: number;
    scoreAfter?: number;

    wasOnlyMove?: boolean;
    playedOnlyMove?: boolean;
}

export function NewMove(id: number, value: cMove, moveNumber: number): Move {
    return {
        id: id,

        to: value.to,
        fen: value.after,
        number: moveNumber,
        cmove: value,

        scoreComputed: false,
    }
}

let cache = {};

export function resetEngineCache() {
    cache = {};
}

export async function ComputeMoveScore(move: Move): Promise<Move> {   
    if (!cache[move.id]) {
        cache[move.id] = new Promise(async (resolve, reject) => {
            console.log("computing for real for ", move.id)
            await engineEval(move.cmove.before, 3).then(async (linesBefore) => {
                await engineEval(move.cmove.after, 3).then((linesAfter) => {
                    let accuracy = 0;
                    let scoreDiff = 0;
    
                    console.log(`>>>> got scores for move ${move.to} with ${move.cmove.before} and ${move.cmove.after}`);
    
                    if (linesBefore.length > 0 && linesAfter.length > 0) {
                        const bestLineBefore = linesBefore[0];
    
                        // taking the last one because we want the best line for our opponent
                        const bestLineAfter = linesAfter[0];
                        // Addition to take the perspective of the player playing, so we reverse the score.
                        // if we're white, the line after give a score for black, which will be negative if good for us.
                        bestLineAfter.rawScore *= -1;
                        
                        const winPercentBefore = (2 / (1 + Math.exp(-0.00368208 * bestLineBefore.rawScore)) - 1) * 100;
                        const winPercentAfter = (2 / (1 + Math.exp(-0.00368208 * bestLineAfter.rawScore)) - 1) * 100;
    
                        if (winPercentAfter > winPercentBefore) {
                            accuracy = 100
                        } else {
                            accuracy = Math.round(103.1668100711649 * Math.exp(-0.04354415386753951 * (winPercentBefore - winPercentAfter)) -3.166924740191411);
                        }
    
                        scoreDiff = bestLineBefore.rawScore - bestLineAfter.rawScore;
                        
                        let wasOnlyMove = (
                            // engine found more than one line
                            linesBefore.length >= 2
                            // the diff between the first line and seconde is high
                            && linesBefore[0].rawScore > linesBefore[1].rawScore + 200
                        );
                        
                        let playedOnlyMove = (
                            wasOnlyMove
                            // and we played the move
                            && linesBefore[0].line.startsWith(move.cmove.lan)
                        );
                        
                        console.log({ moveNumber: move.number, move, linesBefore, bestLineBefore, winPercentBefore, linesAfter, bestLineAfter, winPercentAfter, accuracy, scoreDiff });
                        const newMove = {
                            ...move,
    
                            scoreComputed: true,

                            scoreDiff: scoreDiff, // (linesBefore.length > 0 ? linesBefore[0].score : "-")
                            accuracy: accuracy,
            
                            scoreBefore: bestLineBefore.rawScore,
                            scoreAfter: bestLineAfter.rawScore,

                            wasOnlyMove: wasOnlyMove,
                            playedOnlyMove: playedOnlyMove,
                        };
    
                        resolve(newMove);
                    } else {
                        resolve(move);
                    }
                });         
            }); 
        });
    }

    return cache[move.id];
}

