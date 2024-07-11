import { Line } from "../types";


interface LinesProps {
    lines: Line[];
}

export function Lines({ lines }: LinesProps): JSX.Element {
    return (<div style={{ flex: 1, paddingTop: 8 }}>
        {[0, 1, 2].map((i) => {
            const line = lines[i];
            if (line === undefined) {
                return (
                    <div key={i} style={{ height: "68px", textAlign: "left" }}>
                    </div>
                )
            }

            return (
                <div key={i} style={{ height: "68px", textAlign: "left" }}>
                    {/* TODO fix the colors of evals ???? */}
                    <span style={{ backgroundColor: line.rawScore > 0 ? "white" : "black", color: line.rawScore > 0 ? "black" : "white" }}>
                        {line.score}
                    </span>: {line.line} {/* TODO make moves clickables */}
                    
                </div>
            )
        })}
    </div>)
}