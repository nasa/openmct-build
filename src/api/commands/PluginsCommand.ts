import Command from "./Command";
import OpenMctPlugin from "../../openmct/OpenMctPlugin";
import { PluginMap } from "../../openmct/OpenMctConfigurationDocument";
import MctYamlConfigurator from "../../yaml/MctYamlConfigurator";
import BuildCommand from "./BuildCommand";
import path from "path";
import NpmPackageManager from "../../npm/NpmPackageManager";
import NpmPackage from "../../npm/NpmPackage";
import { ParseArgsConfig } from "util";

export default class PluginsCommand extends Command {
    #configurator:MctYamlConfigurator;

    constructor() {
        super();
        this.#configurator = new MctYamlConfigurator();
    }
    getArgsForVerb(verb: string): ParseArgsConfig {
        const additionalArgs:ParseArgsConfig = {
            options: {}
        };

        switch (verb) {
            case 'add':
            additionalArgs.options = {
                npmPackage: {
                    type: 'string',
                    short: 'p',
                    default: undefined,
                }
            };
        };

        return {
            options: {
                ...super.getArgsForVerb(verb).options,
                ...additionalArgs.options
        }};
    }
    async add(name:string, {instance, npmPackage}: {instance: string, npmPackage: string}) {

        const config = await this.#configurator.resolveConfiguration({instance});
        const plugin = new OpenMctPlugin(name, {npmPackage});
        // Standardize names. Use NPM package name as plugin name, but preserve the specifier for how the package should be resolved.
        if (plugin.isNpmPackage()) {
            let npmPackageName = plugin.getNpmPackageName();
            if (npmPackageName.startsWith('file:')) {
                const absolutePath = path.resolve(npmPackageName.substring(5));
                plugin.setNpmPackageName(`file:${absolutePath}`);

            }
            const npmPackageManager:NpmPackageManager = NpmPackageManager.getNodePackageManagerForInstance({instance, config});
            const npmPackage:NpmPackage = npmPackageManager.getPackage(plugin.getNpmPackageName());
            name = npmPackage.getResolvedPackageName();
            plugin.setName(name);
        }
        console.log(`Installing plugin ${plugin.getName()} for instance ${instance}`);
        config.addPlugin(plugin);
        this.#configurator.saveForInstance(instance, config);
        this.#rebuild(instance);
    }
    list(name:undefined, {instance}: {instance: string}) {
        console.log(`Listing plugins for instance ${instance}`);
        const config = this.#configurator.loadForInstance(instance);
        const plugins = config.getPlugins();
        console.log(`Plugins for ${instance} instance:`);
        plugins.forEach((plugin: OpenMctPlugin) => {
            const pluginName = plugin.getName();
            const pluginOptions = plugin.getOptions() ? JSON.stringify(plugin.getOptions()) : '';
            const pluginNpmPackageName = plugin.getNpmPackageName();

            console.log(`- ${pluginName}(${pluginOptions}) ${plugin.isNpmPackage() ? `[${pluginNpmPackageName}]` : ''}`);
        });
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