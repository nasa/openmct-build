import { Plugin, PluginMap } from "./OpenMctConfigurationDocument";

export default class OpenMctPlugin {
    #pluginDefinition: Plugin;
    #installFunctionName: string;

    constructor(pluginName: string, pluginDefinition: Plugin) {
        this.#installFunctionName = pluginName;
        this.#pluginDefinition = pluginDefinition;
    }

    getInstallFunctionName(): string {
        return this.#installFunctionName;
    }

    getOptions(): Plugin | undefined {
        return this.#pluginDefinition;
    }
}