export interface Opening {
    title: string;
}

export async function GetOpening(movesAsString: string): Promise<Opening> {
    const openingQuery = await fetch(`http://127.0.0.1:5001/opening?moves=${movesAsString}`);

    return await openingQuery.json();
}
