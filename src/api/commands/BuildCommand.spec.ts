import Api from "../api";
import BuildCommand from "./BuildCommand";

describe('BuildCommand', () => {
    let api:Api;
    let buildCommand:BuildCommand;

    beforeEach(() => {
        api = new Api();
        buildCommand = api.getCommandForNoun('build') as BuildCommand;
    });

    it('Does not throw', () => {
        expect(() => buildCommand.execute(undefined, undefined, {instance: 'default'})).not.toThrow();
    });
});