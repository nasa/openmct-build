import Api from "./api";
import PluginsCommand from "./commands/PluginsCommand";

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

    it('Throws for unknown command', () => {
        expect(() => api.getCommandForNoun('frangible')).toThrow();
    });
});