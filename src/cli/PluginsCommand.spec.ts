import Api from "../api/api";
import PluginsCommand from "./PluginsCommand";
import BuildCommand from "./BuildCommand";
import * as fs from 'fs';
const MCT_BUILD_API_INSTANCE_PATH = process.env.MCT_BUILD_API_INSTANCE_PATH!;

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
        fs.rmSync(MCT_BUILD_API_INSTANCE_PATH, {recursive: true});
    });

    it('Lists installed plugins', () => {
        expect(() => pluginsCommand.execute('list', undefined, {instance: 'default'})).not.toThrow();
    });

    it('Supports adding a new plugin', () => {
        expect(() => pluginsCommand.execute('add', 'test-plugin', {instance: 'default'})).not.toThrow();
    });

    it('rejects unknown verbs', () => {
        expect(() => pluginsCommand.execute('tesselate')).toThrow();
    })
});