import { ChessComGame } from "../types";

export async function GetGames(playerID: string): Promise<ChessComGame[]> {
    const date = new Date();

    let month = date.getUTCMonth() + 1;

    // API: https://www.chess.com/news/view/published-data-api#pubapi-endpoint-games
    const gamesP = await fetch(
        `https://api.chess.com/pub/player/${playerID}/games/${date.getFullYear()}/${(month < 10 ? "0" : "") + month}`,
    );

    return (await gamesP.json()).games.reverse();
}
