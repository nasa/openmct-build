import BuildCommand from "../cli/BuildCommand";
import Command from "../cli/Command";
import InstancesCommand from "../cli/InstancesCommand";
import PluginsCommand from "../cli/PluginsCommand";

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