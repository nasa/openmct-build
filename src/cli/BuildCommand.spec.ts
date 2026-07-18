import { test, expect } from '@playwright/test';
import path from "path";
import fs from "fs";
import Api from "../api/api";
import BuildCommand from "./BuildCommand";
import { randomUUID } from "crypto";
import appRootPath from 'app-root-path';

const MCT_BUILD_API_INSTANCE_PATH = process.env.MCT_BUILD_API_INSTANCE_PATH!;
const EXAMPLE_RECIPES_PATH = path.join(appRootPath.path, 'recipes', 'examples');

test.describe('BuildCommand', () => {
    test(`returns correct args`, () => {
        expect(new BuildCommand().getArgsForVerb('')).toEqual({
            options: {
                instance: {
                    type: 'string',
                    short: 'i',
                    default: 'default',
                },
                npmPackage: {
                    type: 'string',
                    short: 'p',
                    default: undefined,
                },
                recipe: {
                    type: 'string',
                    short: 'r',
                    default: undefined,
                },
                version: {
                    type: 'string',
                    short: 'v',
                    default: undefined,
                }
            }
        });
    });
});

test.describe('BuildCommand', () => {
    let api:Api;
    let buildCommand:BuildCommand;

    test.beforeEach(() => {
        if (!fs.existsSync(MCT_BUILD_API_INSTANCE_PATH)) {
            fs.mkdirSync(MCT_BUILD_API_INSTANCE_PATH, { recursive: true });
        }

        api = new Api();
        buildCommand = api.getCommandForNoun('build') as BuildCommand;
    });

    test.afterEach(() => {
        fs.rmSync(MCT_BUILD_API_INSTANCE_PATH, {recursive: true, force: true});
    });

    test('Does not throw', async () => {
        await buildCommand.execute(undefined, undefined, {instance: 'default'});
    });

    test('builds entirely new instance and boots cleanly in a browser', async ({ page }) => {
        const instanceName:string = randomUUID();
        const fullInstancePath = path.join(MCT_BUILD_API_INSTANCE_PATH, instanceName);
        expect(fs.existsSync(fullInstancePath)).toBe(false);
        await buildCommand.execute(undefined, undefined, {instance: instanceName});
        expect(fs.existsSync(fullInstancePath)).toBe(true);
        expect(fs.existsSync(path.join(fullInstancePath, 'index.html'))).toBe(true);

        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
        });

        await page.goto(`/${instanceName}/index.html`);
        // Open MCT keeps network activity going continuously (polling, real-time
        // plugins), so it never reaches 'networkidle' -- wait for its shell to
        // actually render instead.
        const browseBarObjectLabel = page.getByLabel('Browse bar object name');
        await expect(browseBarObjectLabel).toBeVisible();
        await expect(browseBarObjectLabel).toHaveText('My Items');

        expect(errors).toEqual([]);

        fs.rmSync(fullInstancePath, {recursive: true});
    });

    test('builds a new instance based on a recipe', async ({ page }) => {
        const instanceName:string = randomUUID();
        const fullInstancePath = path.join(MCT_BUILD_API_INSTANCE_PATH, instanceName);
        expect(fs.existsSync(fullInstancePath)).toBe(false);
        await buildCommand.execute(undefined, undefined, {instance: instanceName, recipe: path.join(EXAMPLE_RECIPES_PATH, 'local-plugin', 'recipe.yaml') });
        expect(fs.existsSync(fullInstancePath)).toBe(true);
        expect(fs.existsSync(path.join(fullInstancePath, 'index.html'))).toBe(true);

        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
        });

        await page.goto(`/${instanceName}/index.html`);
        const aboutModalLabel = page.getByLabel('About Modal');
        await expect(aboutModalLabel).toBeVisible();
        await aboutModalLabel.click();
        const versionNumberLabel = page.getByLabel('Version Number');
        await expect(versionNumberLabel).toBeVisible();
        await expect(versionNumberLabel).toHaveText('Version: 4.0.0');

        expect(errors).toEqual([]);

        fs.rmSync(fullInstancePath, {recursive: true});
    });
});
