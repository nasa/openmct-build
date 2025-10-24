import OpenMctPlugin from "./OpenMctPlugin";
import {OpenMctConfigurationSchema, PluginMap} from "./OpenMctConfigurationDocument";
import path from "path";
import { DEFAULT_OPEN_MCT_VERSION } from "../constants";
import { env } from "process";

export const INSTANCE_PATH = env.MCT_BUILD_API_INSTANCE_PATH || path.join(process.cwd(), 'instances');
export const CONFIGURATION_YAML = "instance.yaml";

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
    getPlugin(name:string):OpenMctPlugin | undefined {
        return this.getPlugins().find((plugin: OpenMctPlugin) => {
            return plugin.getName() === name;
        });
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
        if (this.hasPlugin(plugin)) {
            this.removePlugin(plugin.getName());
        }
        this.#configuration.openmct.plugins.push(plugin.toYamlPluginMapOrString());
    }
    hasPlugin(plugin: OpenMctPlugin): boolean {
        return this.getPlugins().some((p: OpenMctPlugin) => {
            return p.getName() === plugin.getName();
        });
    }
    removePlugin(name: string) {
        this.#configuration.openmct.plugins = this.#configuration.openmct.plugins?.filter((p: PluginMap | string) => {
            return OpenMctPlugin.fromYamlPluginMapOrString(p).getName() !== name;
        });
    }
    getOpenMctVersion(): string {
        return this.#configuration.openmct.version || DEFAULT_OPEN_MCT_VERSION;
    }
    setOpenMctVersion(version: string) {
        this.#configuration.openmct.version = version;
    }

    getConfigurationDocument(): OpenMctConfigurationSchema {
        return this.#configuration;
    }
}
