import Api from "../api/api";
import PluginsCommand from "./PluginsCommand";
import BuildCommand from "./BuildCommand";
import * as fs from 'fs';
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import appRootPath from "app-root-path";
import path from "path";

const MCT_BUILD_API_INSTANCE_PATH = process.env.MCT_BUILD_API_INSTANCE_PATH!;
const EXAMPLE_RECIPES_PATH = path.join(appRootPath.path, 'recipes', 'examples');

describe('PluginsCommand', () => {
    let api:Api;
    let pluginsCommand:PluginsCommand;
    let buildCommand:BuildCommand;

    beforeEach(() => {
        if (!fs.existsSync(MCT_BUILD_API_INSTANCE_PATH)) {
            fs.mkdirSync(MCT_BUILD_API_INSTANCE_PATH, { recursive: true });
        }
        api = new Api();
        pluginsCommand = api.getCommandForNoun('plugins') as PluginsCommand;
        buildCommand = api.getCommandForNoun('build') as BuildCommand;
        buildCommand.execute(undefined, undefined, {instance: 'default'});
    });

    afterEach(() => {
        fs.rmSync(MCT_BUILD_API_INSTANCE_PATH, {recursive: true, force: true});
    });

    it('Supports adding a new local plugin', async () => {
        await pluginsCommand.execute('add', `file:${path.join(EXAMPLE_RECIPES_PATH, 'hello-world')}`, {instance: 'default', });
        const instanceConfig = fs.readFileSync(path.join(MCT_BUILD_API_INSTANCE_PATH, 'default', 'instance.yaml'), { encoding: 'utf8', flag: 'r' });
        expect(instanceConfig.includes(`npmPackage: file:${path.join(EXAMPLE_RECIPES_PATH, 'hello-world')}`)).toBe(true);
    });

});