import Command from "./Command";

export default class PluginsCommand extends Command {
    list() {
        console.log('Listing plugins');
    }
    add(name:string, options: any) {
        console.log(`Installing plugin ${name} with options ${JSON.stringify(options)}`);
    }
}