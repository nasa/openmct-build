import Command from "./Command";
import OpenMctPlugin from "../openmct/OpenMctPlugin";
import { ParseArgsConfig } from "util";
import InvalidApiCallError from "../api/InvalidApiCallError";
import Plugins from "../api/Plugins";

export default class PluginsCommand extends Command {
    #pluginsApi:Plugins;

    constructor() {
        super();
        this.#pluginsApi = new Plugins();
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
        let parsedOptions:object | any[] | undefined;

        if (name === undefined) {
            throw new InvalidApiCallError('Plugin name is required');
        }
        if (options !== undefined) {
            parsedOptions = this.#parseOptions(options);
        }
        console.log(`Adding plugin ${name} for ${instance} instance`);
        return this.#pluginsApi.add(name, {instance, npmPackage, options: parsedOptions});
    }
    async list(name: undefined, {instance, available, indexUrl}: {instance: string, available?: boolean, indexUrl: string}) {
        let plugins;

        if (available) {
            plugins = await this.#pluginsApi.listAll(instance, indexUrl);
        } else {
            plugins = await this.#pluginsApi.listInstalled(name, {instance});
        }
        
        plugins?.forEach((plugin:OpenMctPlugin) => {
            console.log(plugin.getName());
        });

        return plugins;
    }
    async remove(name:string, {instance}: {instance: string}) {
        if (name === undefined) {
            throw new InvalidApiCallError('Plugin name is required');
        }
        console.log(`Removing plugin ${name} for ${instance} instance`);

        return this.#pluginsApi.remove(name, {instance});
    }
    async configure(name:string, {instance, enabled, npmPackage, options}: {instance: string, enabled?: boolean, npmPackage?: string, options?: string}) {
        if (name === undefined) {
            throw new InvalidApiCallError('Plugin name is required');
        }
        console.log(`Configuring plugin ${name} for instance ${instance}`);
        let parsedOptions:object | any[] | undefined;
        if (options !== undefined) {
            parsedOptions = this.#parseOptions(options);
        }
        return this.#pluginsApi.configure(name, {instance, enabled, npmPackage, options: parsedOptions});
    }

    async info(name:string, {instance}: {instance: string}) {
        const plugin:(OpenMctPlugin | void) = await this.#pluginsApi.info(name, {instance});
        console.log(`Instance: ${instance}`);
        if (plugin) {
            console.log(plugin.toStringDetailed());
        } else {
            console.log(`Plugin undefined`);
        }
    }
    #parseOptions(options: string): object | any[] {
        try {
            return JSON.parse(options);
        } catch (error) {
            throw new InvalidApiCallError('Invalid options');
        }
    }
}