import { test, expect } from '@playwright/test';
import Api from "../api/api";
import PluginsCommand from "./PluginsCommand";
import BuildCommand from "./BuildCommand";
import * as fs from 'fs';
import appRootPath from "app-root-path";
import path from "path";

const MCT_BUILD_API_INSTANCE_PATH = process.env.MCT_BUILD_API_INSTANCE_PATH!;
const EXAMPLE_RECIPES_PATH = path.join(appRootPath.path, 'recipes', 'examples');

/**
 * Captures everything written to this process's stdout (console.log, console.info,
 * direct process.stdout.write calls) while `during` runs. Output still reaches the
 * real stdout; this just tees it into the returned string.
 */
async function captureStdout(during: () => Promise<unknown>): Promise<string> {
    const chunks: string[] = [];
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string | Uint8Array, ...args: any[]) => {
        chunks.push(chunk.toString());
        return originalWrite(chunk, ...args);
    }) as typeof process.stdout.write;

    try {
        await during();
    } finally {
        process.stdout.write = originalWrite;
    }

    return chunks.join('');
}

test.describe('PluginsCommand verb arguments', () => {
    const instanceOption = {
        type: 'string',
        short: 'i',
        default: 'default',
    };
    let pluginsCommand: PluginsCommand;

    test.beforeEach(() => {
        pluginsCommand = new PluginsCommand();
    });

    test('returns correct options for the add verb', () => {
        expect(pluginsCommand.getArgsForVerb('add')).toEqual({
            options: {
                instance: instanceOption,
                npmPackage: {
                    type: 'string',
                    short: 'p',
                    default: undefined,
                },
                options: {
                    type: 'string',
                    short: 'o',
                    default: undefined,
                }
            }
        });
    });

    test('returns correct options for the configure verb', () => {
        expect(pluginsCommand.getArgsForVerb('configure')).toEqual({
            options: {
                instance: instanceOption,
                enabled: {
                    type: 'boolean',
                    short: 'e',
                    default: undefined,
                },
                npmPackage: {
                    type: 'string',
                    short: 'p',
                    default: undefined,
                },
                options: {
                    type: 'string',
                    short: 'o',
                    default: undefined,
                }
            }
        });
    });

    test('returns correct options for the list verb', () => {
        expect(pluginsCommand.getArgsForVerb('list')).toEqual({
            options: {
                instance: instanceOption,
                available: {
                    type: 'boolean',
                    short: 'a',
                    default: false,
                },
                indexUrl: {
                    type: 'string',
                    short: 'u',
                    default: 'https://nasa.github.io/openmct/openmct-plugins-index.json',
                }
            }
        });
    });

    test('returns correct options for the remove verb', () => {
        expect(pluginsCommand.getArgsForVerb('remove')).toEqual({
            options: {
                instance: instanceOption
            }
        });
    });

    test('returns correct options for the info verb', () => {
        expect(pluginsCommand.getArgsForVerb('info')).toEqual({
            options: {
                instance: instanceOption
            }
        });
    });
});

test.describe('PluginsCommand', () => {
    let api:Api;
    let pluginsCommand:PluginsCommand;
    let buildCommand:BuildCommand;

    test.beforeEach(async () => {
        if (!fs.existsSync(MCT_BUILD_API_INSTANCE_PATH)) {
            fs.mkdirSync(MCT_BUILD_API_INSTANCE_PATH, { recursive: true });
        }
        api = new Api();
        pluginsCommand = api.getCommandForNoun('plugins') as PluginsCommand;
        buildCommand = api.getCommandForNoun('build') as BuildCommand;
        await buildCommand.execute(undefined, undefined, {instance: 'default'});
    });

    test.afterEach(() => {
        fs.rmSync(MCT_BUILD_API_INSTANCE_PATH, {recursive: true, force: true});
    });

    test.describe('adding and removing a local plugin', () => {
        test.beforeEach(async () => {
            await pluginsCommand.execute('add', `file:${path.join(EXAMPLE_RECIPES_PATH, 'hello-world')}`, {instance: 'default'});

            const instanceConfig = fs.readFileSync(path.join(MCT_BUILD_API_INSTANCE_PATH, 'default', 'instance.yaml'), { encoding: 'utf8', flag: 'r' });
            expect(instanceConfig.includes(`npmPackage: file:${path.join(EXAMPLE_RECIPES_PATH, 'hello-world')}`)).toBe(true);
        });

        test('Supports adding a new local plugin', async ({ page }) => {
            const dialogMessage = new Promise<string>((resolve) => {
                page.once('dialog', async (dialog) => {
                    resolve(dialog.message());
                    await dialog.dismiss();
                });
            });

            await page.goto('/default/index.html');

            // Proves the plugin isn't just correctly written into instance.yaml/index.html
            // source, but actually loads and executes in a real browser.
            expect(await dialogMessage).toBe('Hello world!');
        });

        test('supports removing a local plugin', async ({ page }) => {
            await pluginsCommand.execute('remove', 'hello-world', {instance: 'default'});
            const instanceConfig = fs.readFileSync(path.join(MCT_BUILD_API_INSTANCE_PATH, 'default', 'instance.yaml'), { encoding: 'utf8', flag: 'r' });
            
            // Confirm that the plugin does not appear in the instance configuration
            expect(instanceConfig.includes(`npmPackage: file:${path.join(EXAMPLE_RECIPES_PATH, 'hello-world')}`)).toBe(false);

            let dialogAppeared = false;
            page.once('dialog', async (dialog) => {
                await dialog.dismiss();
            });

            await page.goto('/default/index.html');

            // Wait for evidence that the app is fully initialized
            const browseBarObjectLabel = page.getByLabel('Browse bar object name');
            await expect(browseBarObjectLabel).toBeVisible();
            await expect(browseBarObjectLabel).toHaveText('My Items');

            // Confirm that the hello world dialog did not appear
            expect(dialogAppeared).toBe(false);

        });
    });

    test('Lists installed plugins', async () => {
        const outputOfFirstListCommand = await captureStdout(() =>
            pluginsCommand.execute('list', undefined, {instance: 'default'})
        );

        // Verifies the same stdout output a user of `mct plugins list` sees
        expect(outputOfFirstListCommand).toContain('openmct.plugins.Espresso');
        expect(outputOfFirstListCommand).toContain('openmct.plugins.MyItems');
        expect(outputOfFirstListCommand).toContain('openmct.plugins.LocalStorage');
        expect(outputOfFirstListCommand).toContain('openmct.plugins.UTCTimeSystem');
        expect(outputOfFirstListCommand).toContain('openmct.plugins.PlanLayout');
        expect(outputOfFirstListCommand).toContain('openmct.plugins.DisplayLayout');
        expect(outputOfFirstListCommand).toContain('openmct.plugins.Conductor');
        expect(outputOfFirstListCommand).toContain('mct-bootstrap-plugin');

        expect(outputOfFirstListCommand).not.toContain('hello-world');

        await pluginsCommand.execute('add', `file:${path.join(EXAMPLE_RECIPES_PATH, 'hello-world')}`, {instance: 'default'});

        const outputOfSecondListCommand = await captureStdout(() =>
            pluginsCommand.execute('list', undefined, {instance: 'default'})
        );

        expect(outputOfSecondListCommand).toContain('hello-world');
    });

    test('Provides info on a single plugin', async () => {
        const outputOfInfoCommand = await captureStdout(() =>
            pluginsCommand.execute('info', 'openmct.plugins.Conductor', {instance: 'default'})
        );
        expect(outputOfInfoCommand).toContain('Instance: default');
        expect(outputOfInfoCommand).toContain('Name: openmct.plugins.Conductor');
        expect(outputOfInfoCommand).toContain('Options:');
        expect(outputOfInfoCommand).toContain('- menuOptions:');
        expect(outputOfInfoCommand).toContain('Source: builtin');
        expect(outputOfInfoCommand).toContain('Enabled: true');
    });

    test('Supports disabling a plugin via the configure command', async ({page}) => {
        await pluginsCommand.execute('add', `file:${path.join(EXAMPLE_RECIPES_PATH, 'hello-world')}`, {instance: 'default'});

        await pluginsCommand.execute('configure', 'hello-world', {instance: 'default', enabled: false});

        const outputOfInfoCommand = await captureStdout(() =>
            pluginsCommand.execute('info', 'hello-world', {instance: 'default'})
        );

        expect(outputOfInfoCommand).toContain('Enabled: false');
        expect(outputOfInfoCommand).not.toContain('Enabled: true');

        let dialogAppeared = false;
        page.once('dialog', async (dialog) => {
            await dialog.dismiss();
        });

        await page.goto('/default/index.html');

        // Wait for evidence that the app is fully initialized
        const browseBarObjectLabel = page.getByLabel('Browse bar object name');
        await expect(browseBarObjectLabel).toBeVisible();
        await expect(browseBarObjectLabel).toHaveText('My Items');

        // Confirm that the hello world dialog did not appear
        expect(dialogAppeared).toBe(false);


    });

    test('Supports installing a local plugin with multiple entry points', async ({page}) => {
        await pluginsCommand.execute('add', 'hello-world', {npmPackage: `file:${path.join(EXAMPLE_RECIPES_PATH, 'local-plugin', 'plugin')}`, instance: 'default'});

        await page.goto('/default/index.html');

        // Wait for evidence that the app is fully initialized
        const helloWorldIndicator = page.locator('.c-indicator', {hasText: 'Hello World!'});
        await expect(helloWorldIndicator).toBeVisible();

        await pluginsCommand.execute('configure', 'hello-world', {instance: 'default', options: '{"greeting": "Playwright"}'});

        await page.reload();

        // Wait for evidence that the app is fully initialized
        const helloPlaywrightIndicator = page.locator('.c-indicator', {hasText: 'Hello Playwright!'});
        await expect(helloPlaywrightIndicator).toBeVisible();
        await expect(helloWorldIndicator).not.toBeVisible();

    });


});
