// Chess.com API

export interface ChessComePlayer {
    uuid: string;
    "@id": string;
    username: string;

    rating: number;
    result: string; // checkmated, win, timeout
}

export interface ChessComGame {
    uuid: string;

    fen: string;
    pgn: string;
    tcn: string;

    initial_setup: string;

    rated: boolean;
    rules: string; // chess

    end_time: number;
    time_class: string;
    time_control: string;
    url: string;

    accuracies?: {
        black: number;
        white: number;
    };

    white: ChessComePlayer;
    black: ChessComePlayer;
}
