import { test, expect } from '@playwright/test';
import Api from "./api";
import BuildCommand from "../cli/BuildCommand";
import PluginsCommand from "../cli/PluginsCommand";

test.describe('API', () => {
    let api:Api;

    test.beforeEach(() => {
        api = new Api();
    });

    test('Returns a PluginsCommand object', () => {
        let pluginsCommand:PluginsCommand;
        pluginsCommand = api.getCommandForNoun('plugins') as PluginsCommand;
        expect(pluginsCommand).toBeDefined();
        expect(pluginsCommand).toBeInstanceOf(PluginsCommand);
    });

    test('Returns a BuildCommand object', () => {
        let buildCommand:BuildCommand;
        buildCommand = api.getCommandForNoun('build') as BuildCommand;
        expect(buildCommand).toBeDefined();
        expect(buildCommand).toBeInstanceOf(BuildCommand);
    });

    test('Throws for unknown command', () => {
        expect(() => api.getCommandForNoun('frangible')).toThrow();
    });
});
