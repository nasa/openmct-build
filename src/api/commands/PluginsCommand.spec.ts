import Api from "../api";
import PluginsCommand from "./PluginsCommand";

describe('PluginsCommand', () => {
    let api:Api;
    let pluginsCommand:PluginsCommand

    beforeEach(() => {
        api = new Api();
        pluginsCommand = api.getCommandForNoun('plugins') as PluginsCommand;
    });

    it('Lists installed plugins', () => {
        expect(() => pluginsCommand.execute('list')).not.toThrow();
    });

    it('Supports adding a new plugin', () => {
        expect(() => pluginsCommand.execute('add', 'test plugin', {})).not.toThrow();
    });

    it('rejects unknown verbs', () => {
        expect(() => pluginsCommand.execute('tesselate')).toThrow();
    })
});