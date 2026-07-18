import { defineConfig } from '@playwright/test';
import path from 'path';
import appRootPath from 'app-root-path';

const INSTANCES_PATH = path.join(appRootPath.path, 'temp-tests');
process.env.MCT_BUILD_API_INSTANCE_PATH = INSTANCES_PATH;

const PORT = 4173;

export default defineConfig({
    testDir: '.',
    testMatch: '**/src/**/*.spec.ts',
    timeout: 60_000,
    fullyParallel: false,
    workers: 1, // PluginsCommand/BuildCommand specs build/wipe the same shared temp-tests root; avoid cross-file races
    webServer: {
        command: `mkdir -p "${INSTANCES_PATH}" && npx http-server "${INSTANCES_PATH}" -p ${PORT} --silent`,
        url: `http://127.0.0.1:${PORT}`,
        reuseExistingServer: !process.env.CI
    },
    use: {
        baseURL: `http://127.0.0.1:${PORT}`
    }
});
