import Api from "./api";
import BuildCommand from "../cli/BuildCommand";
import PluginsCommand from "../cli/PluginsCommand";

describe('API', () => {
    let api:Api;

    beforeEach(() => {
        api = new Api();
    });

    it('Returns a PluginsCommand object', () => {
        let pluginsCommand:PluginsCommand;
        pluginsCommand = api.getCommandForNoun('plugins') as PluginsCommand;
        expect(pluginsCommand).toBeDefined();
        expect(pluginsCommand).toBeInstanceOf(PluginsCommand);
    });

    it('Returns a BuildCommand object', () => {
        let buildCommand:BuildCommand;
        buildCommand = api.getCommandForNoun('build') as BuildCommand;
        expect(buildCommand).toBeDefined();
        expect(buildCommand).toBeInstanceOf(BuildCommand);
    });

    it('Throws for unknown command', () => {
        expect(() => api.getCommandForNoun('frangible')).toThrow();
    });
});