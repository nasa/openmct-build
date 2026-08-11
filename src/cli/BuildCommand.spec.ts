import { test, expect, MCT_BUILD_API_INSTANCE_PATH, EXAMPLE_RECIPES_PATH, RECIPES_PATH } from '../test/fixtures';
import path from "path";
import fs from "fs";
import Api from "../api/api";
import BuildCommand from "./BuildCommand";
import { randomUUID } from "crypto";

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
        api = new Api();
        buildCommand = api.getCommandForNoun('build') as BuildCommand;
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

        const indexHtml = fs.readFileSync(path.join(fullInstancePath, 'index.html'), 'utf-8');
        expect(indexHtml.trimStart().toLowerCase().startsWith('<!doctype html>')).toBe(true);

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
    });

    test('builds a new instance based on a recipe', async ({ page }) => {
        const instanceName:string = randomUUID();
        const fullInstancePath = path.join(MCT_BUILD_API_INSTANCE_PATH, instanceName);
        expect(fs.existsSync(fullInstancePath)).toBe(false);
        await buildCommand.execute(undefined, undefined, {instance: instanceName, recipe: path.join(EXAMPLE_RECIPES_PATH, 'local-plugin', 'recipe.yaml') });
        expect(fs.existsSync(fullInstancePath)).toBe(true);
        expect(fs.existsSync(path.join(fullInstancePath, 'index.html'))).toBe(true);

        const indexHtml = fs.readFileSync(path.join(fullInstancePath, 'index.html'), 'utf-8');
        expect(indexHtml.trimStart().toLowerCase().startsWith('<!doctype html>')).toBe(true);

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
    });

    test('builds a new instance based with correct runtime substitutions', async ({ page }) => {
        const instanceName:string = randomUUID();
        const fullInstancePath = path.join(MCT_BUILD_API_INSTANCE_PATH, instanceName);
        expect(fs.existsSync(fullInstancePath)).toBe(false);
        await buildCommand.execute(undefined, undefined, {instance: instanceName, recipe: path.join(EXAMPLE_RECIPES_PATH, 'runtime-substitutions', 'recipe.yaml') });
        expect(fs.existsSync(fullInstancePath)).toBe(true);
        expect(fs.existsSync(path.join(fullInstancePath, 'index.html'))).toBe(true);

        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        page.on('console', (message) => {
            if (message.type() === 'error') errors.push(message.text());
        });

        await page.goto(`/${instanceName}/index.html`);        
        await page.getByRole('treeitem', { name: 'Sunrise' }).click();

        const sunriseTime = await page.locator('.c-sunrise__time').textContent();
        const sunriseDate = await page.locator('.c-sunrise__date').textContent();
        const sunriseLatitude = await page.locator('.c-sunrise__latitude').textContent();
        const sunriseLongitude = await page.locator('.c-sunrise__longitude').textContent();
       
        // negative test
        expect(sunriseTime).not.toBe('{sunriseTime}');
        expect(sunriseDate).not.toBe('${sunriseDate}');
        expect(sunriseLatitude).not.toBe('${sunriseLatitude}');
        expect(sunriseLongitude).not.toBe('${sunriseLongitude}');

        const timePattern = /^\d{1,2}:\d{2}(?:\s?[AP]M)?$/i;
        const datePattern = /^\d{1,2}\/\d{1,2}\/\d{4}$/;

        // positive test
        expect(sunriseTime).toMatch(timePattern);
        expect(sunriseDate).toMatch(datePattern);
        // these are the values from the recipe at recipes/examples/runtime-substitutions/recipe.yaml
        expect(sunriseLatitude).toBe('33.158');
        expect(sunriseLongitude).toBe('-117.351');

        expect(errors).toEqual([]);
    });

    test('builds successfully from the AMPCS/MCWS recipe', async ({ page }) => {
        test.slow();
        const instanceName:string = randomUUID();
        const fullInstancePath = path.join(MCT_BUILD_API_INSTANCE_PATH, instanceName);
        expect(fs.existsSync(fullInstancePath)).toBe(false);
        await buildCommand.execute(undefined, undefined, {instance: instanceName, recipe: path.join(RECIPES_PATH, 'mcws', 'dev.yaml') });
        expect(fs.existsSync(fullInstancePath)).toBe(true);
        expect(fs.existsSync(path.join(fullInstancePath, 'index.html'))).toBe(true);

        await page.goto(`/${instanceName}/index.html`);
        const aboutModalLabel = page.getByLabel('About Modal');
        await expect(aboutModalLabel).toBeVisible();
        await aboutModalLabel.click();
        const mcwsLabel = page.locator('.l-vista-build-info', {hasText: 'Open MCT for MCWS'});
        await expect(mcwsLabel).toBeVisible();
    });
});
