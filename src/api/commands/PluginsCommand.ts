import Command from "./Command";
import OpenMctConfiguration from "../../openmct/OpenMctConfiguration";
import OpenMctPlugin from "../../openmct/OpenMctPlugin";

export default class PluginsCommand extends Command {
    list(name:string, {instance}: {instance: string}) {
        console.log(`Listing plugins for instance ${instance}`);
        const config = OpenMctConfiguration.loadConfigurationForInstance(instance);
        const plugins = config.getPlugins();
        console.log(`Plugins for instance ${instance}:`);
        plugins.forEach((plugin: OpenMctPlugin) => console.log(plugin.getInstallFunctionName()));
    }
    add(name:string, {instance}: {instance: string}) {
        console.log(`Installing plugin ${name} for instance ${instance}`);
        const config = OpenMctConfiguration.loadConfigurationForInstance(instance);
    }
}