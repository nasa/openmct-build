import OpenMctPlugin from "./OpenMctPlugin";
import {OpenMctConfigurationSchema, Plugin} from "./OpenMctConfigurationDocument";

export default class OpenMctConfiguration {
    #configuration: OpenMctConfigurationSchema;
    constructor(configuration: OpenMctConfigurationSchema) {
        this.#configuration = configuration;
    }
    getPlugins() {
        return Object.entries(this.#configuration.openmct.plugins).map(([pluginName, plugin]: [string, Plugin]) => new OpenMctPlugin(pluginName, plugin));
    }
}
