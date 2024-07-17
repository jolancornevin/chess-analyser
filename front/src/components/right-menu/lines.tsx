import { Line } from "../types";


interface LinesProps {
    lines: Line[];
}

const LINE_HEIGHT = 60;

export function Lines({ lines }: LinesProps): JSX.Element {
    return (
        <div style={{ flex: 1, marginTop: 8, height: LINE_HEIGHT * 3, border: "1px solid white", }}>
            {[0, 1, 2].map((i) => {
                const line = lines[i];
                if (line === undefined) {
                    return (
                        <div key={i} style={{ height: `${LINE_HEIGHT}px`, textAlign: "left" }}>
                        </div>
                    )
                }

                return (
                    <div key={i} style={{ height: `${LINE_HEIGHT}px`, textAlign: "left" }}>
                        {/* TODO fix the colors of evals ???? */}
                        <span style={{
                            backgroundColor: line.rawScore > 0 ? "white" : "#312e2",
                            color: line.rawScore > 0 ? "black" : "white",
                            fontWeight: "800",
                        }}>
                            {line.score}
                        </span>: {line.line} {/* TODO make moves clickables */}
                        
                    </div>
                )
            })}
        </div>
    )
}