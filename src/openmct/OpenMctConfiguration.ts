import OpenMctPlugin from "./OpenMctPlugin";
import {OpenMctConfigurationSchema, PluginMap} from "./OpenMctConfigurationDocument";
import path from "path";
import { env } from "process";
import { JSDOM, VirtualConsole } from 'jsdom';

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
            return plugin.getSource() !== 'builtin'
        });
    }
    getBuiltinPlugins() {
        return this.getPlugins().filter((plugin: OpenMctPlugin) => {
            return plugin.getSource() === 'builtin';
        });
    }
    async generateListOfBuiltinPlugins(instance: string) {
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
        const plugins = installedOpenMct.plugins;
        const pluginList = this.#enumerateBuiltinPlugins(plugins);

        return pluginList;
    }

    #enumerateBuiltinPlugins(pluginObject: any, arrayOfPluginNames: string[] = [], prefix:string = 'openmct.plugins') {
        Object.keys(pluginObject).forEach((objectKey) => {
            if (typeof(pluginObject[objectKey]) === 'object') {
                arrayOfPluginNames.concat(this.#enumerateBuiltinPlugins(pluginObject[objectKey], arrayOfPluginNames, `${prefix}.${objectKey}`));
            }
            else {
                const pluginName = objectKey;
                arrayOfPluginNames.push(`${prefix}.${pluginName}`);
            }
        });
        return arrayOfPluginNames.sort((a, b) => a.localeCompare(b));
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
    getOpenMctVersion(): string | undefined {
        if ('version' in this.#configuration.openmct) {
            return this.#configuration.openmct.version;
        } else {
            // This is a tricky one. I'm not quite sure what to do here.
            return undefined;
        }
    }

    setOpenMctVersion(version: string) {
        this.#configuration.openmct = {version, plugins: this.#configuration.openmct.plugins};
    }

    getNpmPackage(): string {
        if ('npmPackage' in this.#configuration.openmct) {
            return this.#configuration.openmct.npmPackage;
        } else if ('version' in this.#configuration.openmct) {
            return `openmct@${this.getOpenMctVersion()}`;
        } else {
            throw new Error('Invalid configuration. Please ensure it complies with the provided schema.');
        }
    }

    setNpmPackage(npmPackage: string) {
        this.#configuration.openmct = {npmPackage, plugins: this.#configuration.openmct.plugins};
    }

    getConfigurationDocument(): OpenMctConfigurationSchema {
        return this.#configuration;
    }

    toString() {
        return `Open MCT version: ${this.getOpenMctVersion()} Plugin count: ${this.getPlugins().length}`;
    }
}
