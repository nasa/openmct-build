import PluginsCommand from "./commands/PluginsCommand";

export default class Api {
    static getCommandForNoun(noun: string): PluginsCommand {
        switch (noun) {
            case 'plugins':
                return new PluginsCommand();
            default:
                throw new Error(`Unknown command: ${noun}`);
        }   
    }
}