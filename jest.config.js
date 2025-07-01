
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  coverageDirectory: 'coverage',
  coveragePathIgnorePatterns: [
    "/node_modules/"
  ],
  // store cache inside project to avoid /tmp permission issues
  cacheDirectory: "<rootDir>/node_modules/.cache/jest",
  // ignore built artifacts
  modulePathIgnorePatterns: ["<rootDir>/dist/"],
  testPathIgnorePatterns: ["<rootDir>/dist/"],
  setupFiles: ["<rootDir>/jest.setup.js"],
};
