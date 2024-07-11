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

            const isMate = line.scoreType === "mate";
            const score = isMate ? line.score : line.score / 100;

            return (
                <div key={i} style={{ textAlign: "left" }}>
                    <span style={{ backgroundColor: line.score > 0 ? "white" : "black", color: line.score > 0 ? "black" : "white" }}>
                        {isMate ? "M" : ""}{score}
                    </span>: {line.line} {/* TODO make moves clickables */}
                    
                </div>
            )
        })}
    </div>)
}