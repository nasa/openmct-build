import type {Config} from 'jest';
import path from 'path';
import appRootPath from "app-root-path";

const INSTANCES_PATH = path.join(appRootPath.path, 'temp-tests');
process.env.MCT_BUILD_API_INSTANCE_PATH = INSTANCES_PATH;

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js', 'json'],
    testMatch: ['**/src/**/*.spec.ts'],
    transform: {
      '^.+\\.ts$': 'ts-jest'
    },
    collectCoverageFrom: [
      '**/*.{ts,js}',
      '!**/node_modules/**',
      '!**/scripts/**',
      '!**/coverage/**',
      '!**/jest.config.js'
    ],
    collectCoverage: true
};

export default config;