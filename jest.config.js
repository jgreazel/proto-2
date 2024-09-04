/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+.ts?$": ["ts-jest", {}],
  },
  moduleNameMapper: {
    "^~/(.*)$": "<rootDir>/src/$1",
    "^lib/(.*)$": "<rootDir>/src/server/api/lib/$1",
    "^domain/(.*)$": "<rootDir>/src/server/api/domain/$1",
  },
};
