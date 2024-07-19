import { Line } from "../types";

interface LinesProps {
  expectedLine?: Line;
  linesForNewPos: Line[];
}

const LINE_HEIGHT = 60;

export function Lines({ linesForNewPos, expectedLine }: LinesProps): JSX.Element {
  return (
    <>
      {/* show expected line before the move */}
      Best Line:
      <div style={{ flex: 1, marginTop: 8, height: LINE_HEIGHT, border: "1px solid white" }}>
        {expectedLine === undefined ? (
          <div style={{ height: `${LINE_HEIGHT}px`, textAlign: "left" }}></div>
        ) : (
          <div style={{ height: `${LINE_HEIGHT}px`, textAlign: "left" }}>
            <span
              style={{
                backgroundColor: expectedLine.rawScore > 0 ? "white" : "#312e2",
                color: expectedLine.rawScore > 0 ? "black" : "white",
                fontWeight: "800",
              }}
            >
              {expectedLine.score} {expectedLine.rawScore} {expectedLine.rawScore > 0}
            </span>
            : {expectedLine.line}
          </div>
        )}
      </div>
      {/* show suggested line after the move */}
      New Lines:
      <div style={{ flex: 1, marginTop: 8, height: LINE_HEIGHT * 3, border: "1px solid white" }}>
        {[0, 1, 2].map((i) => {
          const line = linesForNewPos[i];
          if (line === undefined) {
            return <div key={i} style={{ height: `${LINE_HEIGHT}px`, textAlign: "left" }}></div>;
          }

          return (
            <div key={i} style={{ height: `${LINE_HEIGHT}px`, textAlign: "left" }}>
              {/* TODO fix the colors of evals ???? */}
              <span
                style={{
                  backgroundColor: line.rawScore > 0 ? "white" : "#312e2",
                  color: line.rawScore > 0 ? "black" : "white",
                  fontWeight: "800",
                }}
              >
                {line.score}
              </span>
              : {line.line} {/* TODO make moves clickables */}
            </div>
          );
        })}
      </div>
    </>
  );
}
