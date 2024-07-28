import { describe, expect, test } from "@jest/globals";

import { sortLines } from "../components/engine";
import { NewLine } from "../types";

const validFen = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1"; // 1. e4:

describe("sort lines", () => {
    test("empty lines", () => {
        expect(sortLines("w", [])).toStrictEqual([]);
    });

    test("white lines", () => {
        const res = sortLines("w", [
            NewLine(validFen, -4, "cp", "c5", 1, 0, 0),
            NewLine(validFen, 4, "cp", "c5", 1, 0, 0),

            NewLine(validFen, 2, "mate", "c5", 1, 0, 0),
            NewLine(validFen, -5, "mate", "c5", 1, 0, 0),

            NewLine(validFen, 1, "cp", "c5", 1, 0, 0),
            NewLine(validFen, -8, "cp", "c5", 1, 0, 0),
            NewLine(validFen, 5, "mate", "c5", 1, 0, 0),

            NewLine(validFen, -1, "mate", "c5", 1, 0, 0),

            NewLine(validFen, 2, "cp", "c5", 1, 0, 0),
        ]);

        expect(res).toStrictEqual([
            // better to worst for white
            NewLine(validFen, 2, "mate", "c5", 1, 0, 0),
            NewLine(validFen, 5, "mate", "c5", 1, 0, 0),
            NewLine(validFen, 4, "cp", "c5", 1, 0, 0),
            NewLine(validFen, 2, "cp", "c5", 1, 0, 0),
            NewLine(validFen, 1, "cp", "c5", 1, 0, 0),
            NewLine(validFen, -4, "cp", "c5", 1, 0, 0),
            NewLine(validFen, -8, "cp", "c5", 1, 0, 0),
            NewLine(validFen, -5, "mate", "c5", 1, 0, 0),
            NewLine(validFen, -1, "mate", "c5", 1, 0, 0),
        ]);
    });

    test("black lines", () => {
        const res = sortLines("b", [
            NewLine(validFen, -4, "cp", "c5", 1, 0, 0),
            NewLine(validFen, 4, "cp", "c5", 1, 0, 0),

            NewLine(validFen, 2, "mate", "c5", 1, 0, 0),
            NewLine(validFen, -5, "mate", "c5", 1, 0, 0),

            NewLine(validFen, 1, "cp", "c5", 1, 0, 0),
            NewLine(validFen, -8, "cp", "c5", 1, 0, 0),
            NewLine(validFen, 5, "mate", "c5", 1, 0, 0),

            NewLine(validFen, -1, "mate", "c5", 1, 0, 0),

            NewLine(validFen, 2, "cp", "c5", 1, 0, 0),
        ]);

        expect(res).toStrictEqual([
            // better to worst for black
            NewLine(validFen, -1, "mate", "c5", 1, 0, 0),
            NewLine(validFen, -5, "mate", "c5", 1, 0, 0),
            NewLine(validFen, -8, "cp", "c5", 1, 0, 0),
            NewLine(validFen, -4, "cp", "c5", 1, 0, 0),
            NewLine(validFen, 1, "cp", "c5", 1, 0, 0),
            NewLine(validFen, 2, "cp", "c5", 1, 0, 0),
            NewLine(validFen, 4, "cp", "c5", 1, 0, 0),
            NewLine(validFen, 5, "mate", "c5", 1, 0, 0),
            NewLine(validFen, 2, "mate", "c5", 1, 0, 0),
        ]);
    });
});
