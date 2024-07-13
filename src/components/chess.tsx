import { useMemo, useState } from "react";

import Chessground from "@react-chess/chessground";
import { Chess } from 'chess.js';
import { RightMenu } from "./right-menu/right-menu";

declare const colors: readonly ["white", "black"];
declare type Color = typeof colors[number];


interface ChessUXProps {}
export function ChessUX({ }: ChessUXProps): JSX.Element {
    const [orientation, setOrientation] = useState<Color>("white");
    const [fen, setFen] = useState('');

    const chess = useMemo(() => new Chess(), []);

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ flex: 2 }}>
                <Chessground config={{
                    fen: fen,
                    orientation: orientation,
                    autoCastle: true,
                    highlight: {
                        lastMove: true,
                        check: true,
                    },
                    animation: {
                        enabled: true,
                    },
                    drawable: {
                        enabled: true,
                    },
                }} />
            </div>
            <div style={{ marginLeft: 16, width: 500, backgroundColor: "#312e2b", padding: 16 }}>
                <RightMenu chess={chess} orientation={orientation} setOrientation={setOrientation} setFen={setFen} />
            </div>
    </div>)
};
