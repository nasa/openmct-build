import BuildCommand from "./commands/BuildCommand";
import Command from "./commands/Command";
import InstancesCommand from "./commands/InstancesCommand";
import PluginsCommand from "./commands/PluginsCommand";

export default class Api {
    getCommandForNoun(noun: string): Command {
        switch (noun) {
            case 'plugins':
                return new PluginsCommand();
            case 'init':
            case 'build':
                return new BuildCommand();
            case 'instances':
                return new InstancesCommand();
            default:
                throw new Error(`Unknown command: ${noun}`);
        }   
    }
}