import { useMemo } from "react";

import { Line } from "../types/line";

interface LinesProps {
    expectedLine?: Line;
    linesForNewPos: Line[];
}

const LINE_HEIGHT = 60;
let lineID = 0;

export function Lines({ linesForNewPos: _linesForNewPos, expectedLine: _expectedLine }: LinesProps): JSX.Element {
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
                                {expectedLine.score}
                            </span>
                            : {expectedLine.line}
                        </div>
                    )}
                </div>
            </div>
            {/* show suggested line after the move */}
            New Lines:
            <div style={{ flex: 1, marginTop: 8, height: LINE_HEIGHT * 3, border: "1px solid white" }}>
                {[0, 1, 2].map((i) => {
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
                                    </span>
                                    : {line.line}
                                </>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
