import OpenMctPlugin from "./OpenMctPlugin";
import {OpenMctConfigurationSchema, Plugin, PluginMap} from "./OpenMctConfigurationDocument";
import MctYamlConfigurator from "../yaml/MctYamlConfigurator";
import path from "path";
import * as fs from 'fs';
import appRootPath from 'app-root-path';

export const INSTANCE_PATH = path.join(appRootPath.path, 'instances');
export const CONFIGURATION_YAML = "instance.yaml";

export default class OpenMctConfiguration {
    #configuration: OpenMctConfigurationSchema;

    constructor(configuration: OpenMctConfigurationSchema) {
        this.#configuration = configuration;
    }
    getPlugins() {
        return this.#configuration.openmct.plugins.map((plugin: PluginMap | string) => {
            if (typeof plugin === 'string') {
                return new OpenMctPlugin(plugin, {});
            } else {
                return new OpenMctPlugin(Object.keys(plugin)[0], plugin[Object.keys(plugin)[0]]);
            }
        });
    }
    addPlugin(plugin: OpenMctPlugin) {
        if (this.#configuration.openmct.plugins === undefined) {
            this.#configuration.openmct.plugins = [];
        }
        const yamlPlugin = plugin.getOptions();
        if (yamlPlugin === undefined) {
            this.#configuration.openmct.plugins.push(plugin.getInstallFunctionName());    
        } else {
            const yamlPluginMap = {} as PluginMap;
            yamlPluginMap[plugin.getInstallFunctionName()] = yamlPlugin;
            this.#configuration.openmct.plugins.push(yamlPluginMap);
    
        }


    }
    static loadConfigurationForInstance(instance: string): OpenMctConfiguration {
        const configurator = new MctYamlConfigurator();
        const configString = fs.readFileSync(path.join(INSTANCE_PATH, instance, CONFIGURATION_YAML), 'utf-8');
        const config = configurator.loadFromYaml(configString);

        return config;
    }
}
