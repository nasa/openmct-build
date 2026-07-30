import { test as base, expect } from '@playwright/test';
import * as fs from 'fs';
import path from 'path';
import appRootPath from 'app-root-path';

export const MCT_BUILD_API_INSTANCE_PATH = process.env.MCT_BUILD_API_INSTANCE_PATH!;
export const RECIPES_PATH = path.join(appRootPath.path, 'recipes');
export const EXAMPLE_RECIPES_PATH = path.join(RECIPES_PATH, 'examples');

type McrBuildFixtures = {
    /**
     * Guarantees an empty instance root before every test and wipes it afterwards,
     * so no test inherits build artifacts from a previous one. Declared `auto` so it
     * applies to every test that imports this module's `test`, without having to be
     * named as a test argument.
     */
    instanceRoot: string;
};

export const test = base.extend<McrBuildFixtures>({
    instanceRoot: [async ({}, use) => {
        fs.mkdirSync(MCT_BUILD_API_INSTANCE_PATH, { recursive: true });

        await use(MCT_BUILD_API_INSTANCE_PATH);

        fs.rmSync(MCT_BUILD_API_INSTANCE_PATH, { recursive: true, force: true });
    }, { auto: true }]
});

export { expect };
