
export interface Line {
    line: string;

    scoreType: string;

    score: number;
}

export interface Move {
    number: number;

    to: string;
    fen: string;
}
