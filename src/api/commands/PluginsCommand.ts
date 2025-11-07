import Command from "./Command";
import OpenMctPlugin from "../../openmct/OpenMctPlugin";
import MctYamlConfigurator from "../../yaml/MctYamlConfigurator";
import BuildCommand from "./BuildCommand";
import path from "path";
import fs from "fs";
import NpmPackageManager from "../../npm/NpmPackageManager";
import NpmPackage from "../../npm/NpmPackage";
import { JSDOM, VirtualConsole } from 'jsdom';
import { ParseArgsConfig } from "util";
import { INSTANCE_PATH } from "../../openmct/OpenMctConfiguration";
import InvalidCommandError from "./InvalidCommandError";

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
                    },
                    options: {
                        type: 'string',
                        short: 'o',
                        default: undefined,
                    }
                };
                break;
            case 'configure':
                additionalArgs.options = {
                    enabled: {
                        type: 'boolean',
                        short: 'e',
                        default: undefined,
                    },
                    npmPackage: {
                        type: 'string',
                        short: 'p',
                        default: undefined,
                    },
                    options: {
                        type: 'string',
                        short: 'o',
                        default: undefined,
                    }
                };
                break;
            case 'list':
                additionalArgs.options = {
                    available: {
                        type: 'boolean',
                        short: 'a',
                        default: false,
                    },
                    indexUrl: {
                        type: 'string',
                        short: 'u',
                        default: 'https://nasa.github.io/openmct/openmct-plugins-index.json',
                    }
                };
                break;
        };

        return {
            options: {
                ...super.getArgsForVerb(verb).options,
                ...additionalArgs.options
        }};
    }
    getUsageForVerb(verb: string): string {
        switch (verb) {
            case 'add':
                return 'Usage: mct plugins add <plugin-name> [--instance <instance-name>] [--npm-package <npm-package-name>] [--options <options>]';
            case 'remove':
                return 'Usage: mct plugins remove <plugin-name> [--instance <instance-name>]';
            case 'configure':
                return 'Usage: mct plugins configure <plugin-name> [--instance <instance-name>] [--enabled <true|false>] [--npm-package <npm-package-name>] [--options <options>]';
            default:
                return 'Usage: mct plugins <add|remove|configure>';
        }
    }
    async add(name:string, {instance, npmPackage, options}: {instance: string, npmPackage?: string, options?: string}) {
        if (name === undefined) {
            throw new InvalidCommandError('Plugin name is required');
        }
        if (npmPackage === undefined) {
            npmPackage = name;
        }
        const config = await this.#configurator.resolveConfiguration({instance});
        const plugin = await this.#getMatchingPlugin(name, instance, npmPackage);
        if (!plugin) {
            throw new Error(`Unknown plugin ${name}`);
        }
        if (config.hasPlugin(plugin)) {
            throw new Error(`Plugin ${name} already installed in ${instance} instance`);
        }
        if (options !== undefined) {
            const parsedOptions = this.#parseOptions(options);
            plugin.setOptions(parsedOptions);
        }
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
    #parseOptions(options: string): object | any[] {
        try {
            return JSON.parse(options);
        } catch (error) {
            throw new InvalidCommandError('Invalid options');
        }
    }
    async #getMatchingPlugin(name: string, instance: string, npmPackage?: string): Promise<OpenMctPlugin | undefined> {
        if (name.startsWith('openmct.')) {
            return this.#getMatchingBuiltinPlugin(name, instance);
        } else {
            // Attempt to treat it as an npm package. Will fail later if no NPM package matches.
            return this.#getMatchingNpmPlugin(name, npmPackage);
        }
    }
    #getPluginPathCaseInsensitive(object: any, propertyPath: string, resolvedPath: string[] = []): string | undefined {
        const properties = propertyPath.split('.');
        const firstOrderProperties = Object.keys(object);
        const matchingPropertyKey = firstOrderProperties.find(property => property.toLowerCase() === properties[0].toLowerCase());

        if (!matchingPropertyKey) {
            return undefined;
        }
        resolvedPath.push(matchingPropertyKey);

        const property = object[matchingPropertyKey];
        if (properties.length === 1) {
            if (typeof(property) === 'function') {
                return resolvedPath.join('.');
            }
        }
        return this.#getPluginPathCaseInsensitive(property, properties.slice(1).join('.'), resolvedPath);
    }

    async #getMatchingBuiltinPlugin(name: string, instance: string) {
        const virtualConsole = new VirtualConsole();
        virtualConsole.sendTo(console);
        const fullInstancePath:string = path.join(INSTANCE_PATH, instance);
        const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {virtualConsole, runScripts: 'dangerously', resources: 'usable'});
        const scriptElement = dom.window.document.createElement('script');
        
        await new Promise((resolve, reject) => {
            try {
                scriptElement.addEventListener('load', resolve);
                scriptElement.addEventListener('error', reject);
                scriptElement.src = `file://${fullInstancePath}/node_modules/openmct/dist/openmct.js`;
                dom.window.document.head.appendChild(scriptElement);
            } catch (error) {
                console.error(error);
                reject(error);
            }
        }).catch((error) => {
            throw error;
        });
        
        const installedOpenMct = dom.window.openmct;
        const pluginNameWithoutPrefix = name.substring('openmct.plugins.'.length);
        const matchingPluginPath = this.#getPluginPathCaseInsensitive(installedOpenMct.plugins, pluginNameWithoutPrefix);
        if (!matchingPluginPath) {
            dom.window.close();
            return undefined;
        } else {
            dom.window.close();
            return new OpenMctPlugin(['openmct', 'plugins', matchingPluginPath].join('.'));
        }
    }
    async #getMatchingNpmPlugin(name: string, npmPackage?: string) {
        return new OpenMctPlugin(name, {npmPackage});
    }
    async listAll(instance:string, indexUrl:string): Promise<OpenMctPlugin[]> {
        const listOfAllPlugins: OpenMctPlugin[] = [];
        console.info(`Listing all available plugins for ${instance} instance`);
        const config = await this.#configurator.resolveConfiguration({instance});
        const pluginList = await config.generateListOfBuiltinPlugins(instance);
        pluginList.forEach((pluginName: string) => {
            listOfAllPlugins.push(new OpenMctPlugin(pluginName));
        });
        const npmPackageList = await NpmPackageManager.generateListOfAvailableNpmPlugins(indexUrl);
        npmPackageList.forEach((pkg: NpmPackage) => {
            listOfAllPlugins.push(new OpenMctPlugin(pkg.getResolvedPackageName(), {npmPackage: pkg.getConfiguredPackageName()}));
        });
        return listOfAllPlugins;
    }
    async list(name: undefined, {instance, available, indexUrl}: {instance: string, available?: boolean, indexUrl: string}): Promise<OpenMctPlugin[]> {
        if (available) {
            return this.listAll(instance, indexUrl);
        } else {
            return this.listInstalled(name, {instance});
        }
    }
    listInstalled(name:undefined, {instance}: {instance: string}) {
        console.log(`Listing plugins for instance ${instance}`);
        const config = this.#configurator.loadForInstance(instance);
        const plugins = config.getPlugins();

        return plugins;
    }
    async remove(name:string, {instance}: {instance: string}) {
        if (name === undefined) {
            throw new InvalidCommandError('Plugin name is required');
        }
        console.log(`Removing plugin ${name} for ${instance} instance`);
        const config = await this.#configurator.resolveConfiguration({instance});
        const matchingPlugin = await this.#getMatchingPlugin(name, instance);
        if (!matchingPlugin) {
            throw new Error(`Unknown Plugin ${name}`);
        }
        if (!config.hasPlugin(matchingPlugin)) {
            throw new Error(`Plugin ${name} not installed for ${instance} instance`);
        }
        config.removePlugin(matchingPlugin.getName());

        if (!matchingPlugin.isBuiltin()) {
            const npmPackageManager:NpmPackageManager = NpmPackageManager.getNodePackageManagerForInstance({instance, config});
            npmPackageManager.uninstallPackage(matchingPlugin.getName());    
        }

        this.#configurator.saveForInstance(instance, config);
        this.#rebuild(instance);
    }

    async configure(name:string, {instance, enabled, npmPackage, options}: {instance: string, enabled?: boolean, npmPackage?: string, options?: string}) {
        if (name === undefined) {
            throw new InvalidCommandError('Plugin name is required');
        }
        console.log(`Configuring plugin ${name} for instance ${instance}`);
        const config = await this.#configurator.resolveConfiguration({instance});
        const plugin = config.getPlugin(name);
        if (plugin === undefined) {
            throw new Error(`Plugin ${name} not found for instance ${instance}`);
        }
        if (enabled !== undefined) {
            plugin.setEnabled(enabled);
        }
        if (npmPackage !== undefined) {
            plugin.setNpmPackageName(npmPackage);
        }
        if (options !== undefined) {
            const parsedOptions = this.#parseOptions(options);
            plugin.setOptions(parsedOptions);
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