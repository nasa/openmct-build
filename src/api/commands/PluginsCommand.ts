import Command from "./Command";
import OpenMctConfiguration from "../../openmct/OpenMctConfiguration";
import OpenMctPlugin from "../../openmct/OpenMctPlugin";
import { PluginMap } from "../../openmct/OpenMctConfigurationDocument";
import MctYamlConfigurator from "../../yaml/MctYamlConfigurator";
import BuildCommand from "./BuildCommand";
import NpmPackageManager from "../../npm/NpmPackageManager";

export default class PluginsCommand extends Command {
    #configurator:MctYamlConfigurator;

    constructor() {
        super();
        this.#configurator = new MctYamlConfigurator();
    }
    list(name:undefined, {instance}: {instance: string}) {
        console.log(`Listing plugins for instance ${instance}`);
        const config = this.#configurator.loadForInstance(instance);
        const plugins = config.getPlugins();
        console.log(`Plugins for instance ${instance}:`);
        plugins.forEach((plugin: OpenMctPlugin) => console.log(plugin));
    }
    async add(name:string, {instance, pluginDefinition}: {instance: string, pluginDefinition: PluginMap}) {
        console.log(`Installing plugin ${name} for instance ${instance}`);
        const config = await this.#configurator.resolveConfiguration({instance});
        const plugin = new OpenMctPlugin(name, pluginDefinition);
        config.addPlugin(plugin);
        this.#configurator.saveForInstance(instance, config);
        this.#rebuild(instance);
    }

    async remove(name:string, {instance}: {instance: string}) {
        console.log(`Removing plugin ${name} for instance ${instance}`);
        const config = await this.#configurator.resolveConfiguration({instance});
        const plugin = config.getPlugin(name);
        if (plugin === undefined) {
            throw new Error(`Plugin ${name} not found for instance ${instance}`);
        }
        config.removePlugin(name);

        if (!plugin.isBuiltin()) {
            const npmPackageManager:NpmPackageManager = NpmPackageManager.getNodePackageManagerForInstance({instance, config});
            npmPackageManager.uninstallPackage(name);    
        }

        this.#configurator.saveForInstance(instance, config);
        this.#rebuild(instance);
    }

    #rebuild(instance: string) {
        console.log(`Rebuilding instance ${instance}`);
        const buildCommand:BuildCommand = new BuildCommand();
        buildCommand.execute(undefined, undefined, {instance});
    }
}