import { useMemo, useState } from "react";

import { GetGames } from "../api/chesscom";
import { ChessComGame } from "../types";

interface ChessComGamesProps {
    playerID: string;
    onSelectGame: (game: ChessComGame) => Promise<void>;
}

export function ChessComGames({ playerID, onSelectGame }: ChessComGamesProps): JSX.Element {
    const [games, setGames] = useState<ChessComGame[]>([]);
    const [selectedGame, setSelectedGame] = useState(-1);

    useMemo(async () => {
        if (!playerID) {
            return;
        }

        setGames(await GetGames(playerID));
    }, [playerID]);

    return (
        <div style={{ flex: 1 }}>
            {/* <div>
                Manual set: PGN: <textarea onChange={async (e) => await onPGNChange(e.target.value)} />
            </div> */}

            <div>
                Games for <b>{playerID}</b>:
            </div>

            <div style={{ overflowY: "auto", height: 700 }}>
                {games?.map((game: ChessComGame, i) => {
                    // const game = _game;

                    const isWhite = game.white.username === playerID;
                    const playerResult = isWhite ? game.white.result : game.black.result;
                    const adversaryResult = isWhite ? game.black.result : game.white.result;
                    const won = playerResult === "win";
                    const draw = playerResult !== "win" && adversaryResult !== "win";

                    return (
                        <div key={i}>
                            {i + 1 < games.length &&
                                new Date(game.end_time * 1000).getUTCDate() !==
                                    new Date(games[i + 1].end_time * 1000).getUTCDate() && (
                                    <div>-------------------------------</div>
                                )}
                            <div
                                style={{
                                    height: 48,
                                    flex: 1,
                                    flexDirection: "column",
                                    paddingTop: 8,
                                    cursor: "pointer",
                                    backgroundColor: i === selectedGame ? "#3c63b2ba" : "initial",
                                    margin: "auto",
                                }}
                                onClick={async () => {
                                    setSelectedGame(i);
                                    return await onSelectGame(game);
                                }}
                            >
                                <div>
                                    <div>
                                        <span
                                            style={{
                                                backgroundColor: "white",
                                                width: 8,
                                                height: 8,
                                                display: "inline-block",
                                                marginRight: 8,
                                            }}
                                        ></span>
                                        {game.white.username} VS{" "}
                                        <span
                                            style={{
                                                backgroundColor: "black",
                                                width: 8,
                                                height: 8,
                                                display: "inline-block",
                                                marginRight: 8,
                                            }}
                                        ></span>
                                        {game.black.username}
                                    </div>
                                    <div>{draw ? "🟰" : won ? `✅ [${adversaryResult}]` : `❌ [${playerResult}]`}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
