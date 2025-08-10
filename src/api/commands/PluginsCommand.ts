import Command from "./Command";
import OpenMctConfiguration from "../../openmct/OpenMctConfiguration";
import OpenMctPlugin from "../../openmct/OpenMctPlugin";
import { PluginMap } from "../../openmct/OpenMctConfigurationDocument";

export default class PluginsCommand extends Command {
    list(name:undefined, {instance}: {instance: string}) {
        console.log(`Listing plugins for instance ${instance}`);
        const config = OpenMctConfiguration.loadConfigurationForInstance(instance);
        const plugins = config.getPlugins();
        console.log(`Plugins for instance ${instance}:`);
        plugins.forEach((plugin: OpenMctPlugin) => console.log(plugin));
    }
    add(name:string, {instance, pluginDefinition}: {instance: string, pluginDefinition: PluginMap}) {
        console.log(`Installing plugin ${name} for instance ${instance}`);
        const config = OpenMctConfiguration.loadConfigurationForInstance(instance);
        const plugin = new OpenMctPlugin(name, pluginDefinition);
        config.addPlugin(plugin);
    }
}