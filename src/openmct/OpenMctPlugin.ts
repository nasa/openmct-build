import { Plugin, PluginMap } from "./OpenMctConfigurationDocument";

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

        this.#pluginDefinition.source = this.#pluginDefinition.source ?? (this.isBuiltin() ? DEFAULT_PLUGIN_SOURCE : 'npm');
        if (this.isNpmPackage()) {
            this.#pluginDefinition.npmPackage = this.#pluginDefinition.npmPackage ?? this.#name;
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

    isBuiltin(): boolean {
        return this.#name.startsWith('openmct.');
    }

    isNpmPackage(): boolean {
        return this.#pluginDefinition.source === 'npm';
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

    generateBuiltinInstallFunctionCall(): string {
        if (!this.isBuiltin()) {
            throw new Error('Plugin is not a builtin plugin');
        }
        return `${this.#name}(${this.serializeInstallOptions()})`;
    }

   serializeInstallOptions(): string {
        let serializedArguments:string = '';
        if (this.#pluginDefinition.options !== undefined) {
            if (Array.isArray(this.#pluginDefinition.options)) {
                serializedArguments = this.#pluginDefinition.options.map((arg: any) => {
                    return JSON.stringify(arg);
                }).join(', ');
            } else {
                serializedArguments = JSON.stringify(this.#pluginDefinition.options);
            }
        }
        return serializedArguments;
    }
    getName(): string {
        return this.#name;
    }

    setName(name: string) {
        this.#name = name;
    }

    getNpmPackageName(): string {
        return this.#pluginDefinition.npmPackage ?? this.getName();
    }

    setNpmPackageName(npmPackageName: string): void {
        this.#pluginDefinition.npmPackage = npmPackageName;
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

    isEnabled(): boolean {
        return this.#pluginDefinition?.enabled === false ? false : true;
    }

    setOptions(options:object) {
        this.#pluginDefinition.options = options;
    }

    setEnabled(enabled:boolean) {
        this.#pluginDefinition.enabled = enabled;
    }

    toJSON(): Plugin {
        return {
            name: this.#name,
            ...this.#pluginDefinition
        }
    }

    toString(): string {
        return this.#name;
    }
}