import OpenMctPlugin from "./OpenMctPlugin";
import {OpenMctConfigurationSchema, Plugin, PluginMap} from "./OpenMctConfigurationDocument";
import MctYamlConfigurator from "../yaml/MctYamlConfigurator";
import path from "path";
import * as fs from 'fs';
import appRootPath from 'app-root-path';

export const INSTANCE_PATH = path.join(appRootPath.path, 'instances');
export const CONFIGURATION_YAML = "instance.yaml";

const DEFAULT_OPEN_MCT_VERSION = 'stable';

export default class OpenMctConfiguration {
    #configuration: OpenMctConfigurationSchema;

    constructor(configuration: OpenMctConfigurationSchema) {
        this.#configuration = configuration;
    }
    getPlugins() {
        return this.#configuration.openmct.plugins?.map((plugin: PluginMap | string) => {
            return OpenMctPlugin.fromYamlPluginMapOrString(plugin);
        }) ?? [];
    }
    getNodePlugins() {
        return this.getPlugins().filter((plugin: OpenMctPlugin) => {
            return plugin.getSource() !== 'builtin';
        });
    }
    getBuiltinPlugins() {
        return this.getPlugins().filter((plugin: OpenMctPlugin) => {
            return plugin.getSource() === 'builtin';
        });
    }
    addPlugin(plugin: OpenMctPlugin) {
        if (this.#configuration.openmct.plugins === undefined) {
            this.#configuration.openmct.plugins = [];
        }
        this.#configuration.openmct.plugins.push(plugin.toYamlPluginMapOrString());
    }

    getOpenMctVersion(): string {
        return this.#configuration.openmct.version || DEFAULT_OPEN_MCT_VERSION;
    }

    static loadConfigurationForInstance(instance: string): OpenMctConfiguration {
        const configurator = new MctYamlConfigurator();
        const configString = fs.readFileSync(path.join(INSTANCE_PATH, instance, CONFIGURATION_YAML), 'utf-8');
        const config = configurator.loadFromYaml(configString);

        return config;
    }
}
