import { Plugin, PluginMap } from "./OpenMctConfigurationDocument";
import * as path from 'path';
import * as fs from 'fs';
import NpmPackageManager from "../npm/NpmPackageManager";

const DEFAULT_PLUGIN_SOURCE = 'builtin';

export default class OpenMctPlugin {
    #pluginDefinition: Plugin;
    #installFunctionName: string;

    constructor(pluginName: string, pluginDefinition?: Plugin) {
        this.#installFunctionName = pluginName;
        if (pluginDefinition === undefined) {
            this.#pluginDefinition = {
                source: DEFAULT_PLUGIN_SOURCE
            } as Plugin;
        } else {
            this.#pluginDefinition = pluginDefinition;
        }
        
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

    toYamlPluginMapOrString(): PluginMap | string {
        if (this.#hasDefinition()) {
            const pluginMap = {} as PluginMap;
            pluginMap[this.#installFunctionName] = this.#pluginDefinition;

            return pluginMap;
        } else {
            return this.#installFunctionName;
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
        return `${this.#installFunctionName}(${serializedOptions})`;
    }

    getInstallFunctionName(): string {
        return this.#installFunctionName;
    }

    getOptions(): object | undefined {
        return this.#pluginDefinition.options;
    }

    getSource(): string {
        return this.#pluginDefinition.source ?? DEFAULT_PLUGIN_SOURCE;
    }
}