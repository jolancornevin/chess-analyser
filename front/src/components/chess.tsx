import { useMemo, useState } from "react";

import Chessground from "@react-chess/chessground";
import { Chess } from 'chess.js';
import { DrawShape } from "chessground/draw";
import * as cg from 'chessground/types';
import { RightMenu } from "./right-menu/right-menu";

declare const colors: readonly ["white", "black"];
declare type Color = typeof colors[number];


interface ChessUXProps {}
export function ChessUX({ }: ChessUXProps): JSX.Element {
    const [orientation, setOrientation] = useState<Color>("white");
    const [fen, setFen] = useState('');
    const [lastMove, setLastMove] = useState([]);
    const [shape, drawArrow] = useState<DrawShape>();

    const chess = useMemo(() => new Chess(), []);

    return (
        <div style={{ display: 'flex', flexDirection: 'row' }}>
            <div style={{ flex: 2 }}>
                <Chessground config={{
                    fen: fen,
                    lastMove: lastMove,
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
                        autoShapes: shape?[
                            shape,
                        ]: []
                    },
                    events: {
                        change: () => {console.log("change")},
                        move: (orig: cg.Key, dest: cg.Key, capturedPiece?: cg.Piece) => {
                            // TODO create move variant
                            console.log("move")
                        },
                        dropNewPiece: (piece: cg.Piece, key: cg.Key) => {console.log("dropNewPiece")},
                        select: (key: cg.Key) => {console.log("select")},
                        insert: (elements: cg.Elements) => {console.log("insert")},
                    },
                }} />
            </div>
            <div style={{ marginLeft: 16, width: 500, backgroundColor: "#312e2b", padding: 16 }}>
                <RightMenu chess={chess} orientation={orientation} setOrientation={setOrientation} setFen={setFen} setLastMove={setLastMove} drawArrow={drawArrow} />
            </div>
    </div>)
};
