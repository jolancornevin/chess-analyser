import type { Config } from "jest";

/** @type {import('ts-jest').JestConfigWithTsJest} **/
const config: Config = {
    rootDir: ".",
    testMatch: ["<rootDir>/src/__tests__/*.ts"],
    transform: {
        "^.+\\.(t|j)s$": "ts-jest",
    },
    verbose: true,
    testEnvironment: "node",
    roots: ["<rootDir>/src"],
    testPathIgnorePatterns: ["<rootDir>/node_modules/"],
};

export default config;
