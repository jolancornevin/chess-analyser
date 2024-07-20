export interface Line {
    line: string;

    scoreType: string;

    rawScore: number;
    score: string;

    win: number;
    draw: number;
    lose: number;
}

export function NewLine(rawScore, scoreType, line, win, draw, lose): Line {
    const isMate = scoreType === "mate";
    const score = isMate ? rawScore : rawScore / 100;

    return {
        score: `${isMate ? "M" : ""}${score}`, // in pawns
        rawScore: isMate ? rawScore * 1000 : rawScore, // in centipawns
        scoreType,
        line,

        win,
        draw,
        lose,
    };
}
