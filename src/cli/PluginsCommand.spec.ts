import { test, expect, MCT_BUILD_API_INSTANCE_PATH, EXAMPLE_RECIPES_PATH } from '../test/fixtures';
import Api from "../api/api";
import PluginsCommand from "./PluginsCommand";
import BuildCommand from "./BuildCommand";
import * as fs from 'fs';
import path from "path";
import { captureStdOut } from './TestUtils';

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

test.describe('PluginsCommand verb usage', () => {
    let pluginsCommand: PluginsCommand;

    test.beforeEach(() => {
        pluginsCommand = new PluginsCommand();
    });

    test('returns usage for the add verb', () => {
        expect(pluginsCommand.getUsageForVerb('add')).toBe(
            'Usage: mct plugins add <plugin-name> [--instance <instance-name>] [--npm-package <npm-package-name>] [--options <options>]'
        );
    });

    test('returns usage for the remove verb', () => {
        expect(pluginsCommand.getUsageForVerb('remove')).toBe(
            'Usage: mct plugins remove <plugin-name> [--instance <instance-name>]'
        );
    });

    test('returns usage for the configure verb', () => {
        expect(pluginsCommand.getUsageForVerb('configure')).toBe(
            'Usage: mct plugins configure <plugin-name> [--instance <instance-name>] [--enabled <true|false>] [--npm-package <npm-package-name>] [--options <options>]'
        );
    });

    test('returns general usage for an unrecognized verb', () => {
        expect(pluginsCommand.getUsageForVerb('list')).toBe(
            'Usage: mct plugins <add|remove|configure>'
        );
        expect(pluginsCommand.getUsageForVerb('bogus')).toBe(
            'Usage: mct plugins <add|remove|configure>'
        );
    });
});

test.describe('PluginsCommand', () => {
    let api:Api;
    let pluginsCommand:PluginsCommand;
    let buildCommand:BuildCommand;

    test.beforeEach(async () => {
        api = new Api();
        pluginsCommand = api.getCommandForNoun('plugins') as PluginsCommand;
        buildCommand = api.getCommandForNoun('build') as BuildCommand;
        await buildCommand.execute(undefined, undefined, {instance: 'default'});
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

    test.describe('adding and removing a builtin plugin', () => {
        test.beforeEach(async () => {
            await pluginsCommand.execute('add', `openmct.plugins.PerformanceIndicator`, {instance: 'default'});

            const instanceConfig = fs.readFileSync(path.join(MCT_BUILD_API_INSTANCE_PATH, 'default', 'instance.yaml'), { encoding: 'utf8', flag: 'r' });
            expect(instanceConfig.includes(`openmct.plugins.PerformanceIndicator`)).toBe(true);
        });

        test('Supports adding a new builtin plugin', async ({ page }) => {
            await page.goto('/default/index.html');
            // Proves the plugin isn't just correctly written into instance.yaml/index.html
            // source, but actually loads and executes in a real browser.
            const performanceIndicatorLocator = page.locator('.c-indicator').and(page.getByTitle('Performance Indicator'));
            await expect(performanceIndicatorLocator).toBeVisible();
        });

        test('supports removing a builtin plugin', async ({ page }) => {
            await pluginsCommand.execute('remove', 'openmct.plugins.PerformanceIndicator', {instance: 'default'});
            const instanceConfig = fs.readFileSync(path.join(MCT_BUILD_API_INSTANCE_PATH, 'default', 'instance.yaml'), { encoding: 'utf8', flag: 'r' });
            
            // Confirm that the plugin does not appear in the instance configuration
            expect(instanceConfig.includes(`openmct.plugins.PerformanceIndicator`)).toBe(false);

            await page.goto('/default/index.html');

            // Wait for evidence that the app is fully initialized
            const browseBarObjectLabel = page.getByLabel('Browse bar object name');
            await expect(browseBarObjectLabel).toBeVisible();
            await expect(browseBarObjectLabel).toHaveText('My Items');

            const performanceIndicatorLocator = page.locator('.c-indicator').and(page.getByTitle('Performance Indicator'));
            await expect(performanceIndicatorLocator).toBeHidden();

        });
    });

    test('Lists installed plugins', async () => {
        const outputOfFirstListCommand = await captureStdOut(() =>
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

        const outputOfSecondListCommand = await captureStdOut(() =>
            pluginsCommand.execute('list', undefined, {instance: 'default'})
        );

        expect(outputOfSecondListCommand).toContain('hello-world');
    });

    test('Provides info on a single plugin', async () => {
        const outputOfInfoCommand = await captureStdOut(() =>
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

        const outputOfInfoCommand = await captureStdOut(() =>
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
