
export function NewLine(rawScore, scoreType, line): Line {
    const isMate = scoreType === "mate";
    const score = isMate ? rawScore : rawScore / 100;
    
    return {
        score: `${isMate ? "M" : ""}${score}`,
        rawScore: rawScore,
        scoreType:scoreType,
        line: line,
    } 
}

export interface Line {
    line: string;

    scoreType: string;

    rawScore: number;
    score: string;
}

export interface Move {
    number: number;

    eval: string;

    to: string;
    fen: string;
}
