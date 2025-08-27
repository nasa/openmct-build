import { Plugin, PluginMap } from "./OpenMctConfigurationDocument";
import * as path from 'path';
import * as fs from 'fs';
import NpmPackageManager from "../npm/NpmPackageManager";

const DEFAULT_PLUGIN_SOURCE = 'builtin';

export default class OpenMctPlugin {
    #pluginDefinition: Plugin;
    #name: string;

    constructor(pluginName: string, pluginDefinition?: Plugin) {
        this.#name = pluginName;

        if (pluginDefinition === undefined) {
            this.#pluginDefinition = {} as Plugin;
        } else {
            this.#pluginDefinition = pluginDefinition;
        }

        this.#pluginDefinition.source = this.#pluginDefinition.source ?? (this.#isBuiltin(pluginName) ? DEFAULT_PLUGIN_SOURCE : 'npm');
    }

    static fromYamlPluginMapOrString(pluginMapOrString: PluginMap | string): OpenMctPlugin {
        let name:string;
        let yamlPluginDefinition: Plugin;

        if (typeof pluginMapOrString  === 'string') {
            name = pluginMapOrString;
            return new OpenMctPlugin(name);
        } else {
            name = Object.keys(pluginMapOrString)[0] as string;
            yamlPluginDefinition = pluginMapOrString[name];

            return new OpenMctPlugin(name, yamlPluginDefinition);
        }
    }

    #isBuiltin(name: string): boolean {
        return name.startsWith('openmct.');
    }

    toYamlPluginMapOrString(): PluginMap | string {
        if (this.#hasDefinition()) {
            const pluginMap = {} as PluginMap;
            pluginMap[this.#name] = this.#pluginDefinition;

            return pluginMap;
        } else {
            return this.#name;
        }
    }

    #hasDefinition(): boolean {
        return this.#pluginDefinition !== undefined;
    }

    generateInstallFunctionCall(): string {
        let serializedOptions:string = '';
        if (this.#pluginDefinition.options !== undefined) {
            serializedOptions = JSON.stringify(this.#pluginDefinition.options);
        }
        return `${this.#name}(${serializedOptions})`;
    }

    getName(): string {
        return this.#name;
    }

    getOptions(): object | undefined {
        return this.#pluginDefinition.options;
    }

    getSource(): string {
        return this.#pluginDefinition.source ?? DEFAULT_PLUGIN_SOURCE;
    }

    getEntryPoint(): string | undefined {
        return this.#pluginDefinition.entryPoint;
    }
}