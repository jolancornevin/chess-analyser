import { useMemo } from "react";

import { Line, LineMove } from "../types/line";

const LINE_HEIGHT = 60;
let lineID = 0;

function LineMoves({
    line,
    onMoveClick,
}: {
    line: LineMove[];
    onMoveClick: (move: LineMove) => Promise<void>;
}): JSX.Element {
    if (!line) {
        return <></>;
    }

    return (
        <>
            {line.map((move) => {
                return (
                    <span onClick={async () => await onMoveClick(move)} style={{ cursor: "pointer" }}>
                        {move.cmove.san}{" "}
                    </span>
                );
            })}
        </>
    );
}

interface LinesProps {
    expectedLine?: Line;
    linesForNewPos: Line[];

    onMoveClick: (move: LineMove) => Promise<void>;
}

export function Lines({
    linesForNewPos: _linesForNewPos,
    expectedLine: _expectedLine,
    onMoveClick,
}: LinesProps): JSX.Element {
    const linesForNewPos = useMemo(() => _linesForNewPos, [_linesForNewPos]);
    const expectedLine = useMemo(() => _expectedLine, [_expectedLine]);

    return (
        <>
            {/* show expected line before the move */}
            Best Line:
            <div style={{ flex: 1, marginTop: 8, height: LINE_HEIGHT, border: "1px solid white" }}>
                <div style={{ height: `${LINE_HEIGHT}px`, textAlign: "left" }}>
                    {expectedLine !== undefined && (
                        <div style={{ height: `${LINE_HEIGHT}px`, textAlign: "left" }}>
                            <span
                                style={{
                                    backgroundColor: expectedLine.rawScore > 0 ? "white" : "",
                                    color: expectedLine.rawScore > 0 ? "black" : "white",
                                    fontWeight: "800",
                                }}
                            >
                                {expectedLine.score}{" "}
                                {expectedLine.materialDiff !== 0 && `[${expectedLine.materialDiff}]`}
                            </span>
                            : <LineMoves line={expectedLine.moves} onMoveClick={onMoveClick} />
                        </div>
                    )}
                </div>
            </div>
            {/* show suggested line after the move */}
            New Lines:
            <div style={{ flex: 1, marginTop: 8, height: LINE_HEIGHT * 3, border: "1px solid white" }}>
                {[0, 1, 2].map((i) => {
                    if (!linesForNewPos || i >= linesForNewPos.length) {
                        return <></>;
                    }
                    const line = linesForNewPos[i];

                    return (
                        <div key={lineID++} style={{ height: `${LINE_HEIGHT}px`, textAlign: "left" }}>
                            {line !== undefined && (
                                <>
                                    <span
                                        style={{
                                            backgroundColor: line.rawScore > 0 ? "white" : "",
                                            color: line.rawScore > 0 ? "black" : "white",
                                            fontWeight: "800",
                                        }}
                                    >
                                        {line.score}
                                        {line.materialDiff !== 0 && `[${line.materialDiff}]`}
                                    </span>
                                    : <LineMoves line={line.moves} onMoveClick={onMoveClick} />
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
