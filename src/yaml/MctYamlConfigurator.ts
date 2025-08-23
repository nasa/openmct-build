import OpenMctConfiguration, { CONFIGURATION_YAML, INSTANCE_PATH } from "../openmct/OpenMctConfiguration";
import * as yamllib from 'js-yaml';
import { Validator, ValidationError } from 'jsonschema';
import { OpenMctConfigurationSchema, Plugin, PluginMap } from "../openmct/OpenMctConfigurationDocument";
import * as path from 'path';
import * as fs from 'fs';
import merge from 'lodash.merge';
import readline from "readline/promises";

const SCHEMA_LOCATION = path.join(__dirname, 'openmct-configuration-schema.json');
const BASE_CONFIG_LOCATION = path.join(__dirname, 'openmct-base.yaml');

export default class MctYamlConfigurator {
    #jsonSchema: object;
    #validator: Validator;

    constructor() {
        const jsonSchema = fs.readFileSync(SCHEMA_LOCATION, 'utf-8');
        this.#jsonSchema = JSON.parse(jsonSchema);
        this.#validator = new Validator();
    }

    loadFromYaml(yaml: string): OpenMctConfiguration {
        let doc: OpenMctConfigurationSchema;
        if (yaml === undefined || yaml.length === 0) {
            doc = this.#loadDefaultConfigurationDocument();
        } else {
            doc = this.#loadYaml(yaml);
            doc = this.#applyBaseConfiguration(doc);
        }

        const openmctConfiguration = new OpenMctConfiguration(doc);

        return openmctConfiguration;
    }

    loadForInstance(instance: string): OpenMctConfiguration {
        const configString = fs.readFileSync(path.join(INSTANCE_PATH, instance, CONFIGURATION_YAML), 'utf-8');
        const config = this.loadFromYaml(configString);

        return config;
    }

    saveForInstance(instance: string, config: OpenMctConfiguration) {
        const configString = this.serializeToYaml(config);
        fs.writeFileSync(path.join(INSTANCE_PATH, instance, CONFIGURATION_YAML), configString);
    }

    instanceConfigExists(instance: string): boolean {
        return fs.existsSync(path.join(INSTANCE_PATH, instance, CONFIGURATION_YAML));
    }

    serializeToYaml(configuration: OpenMctConfiguration) {
        return yamllib.dump(configuration.getConfigurationDocument());
    }

    loadDefaultConfiguration(): OpenMctConfiguration {
        const baseConfigDoc = this.#loadDefaultConfigurationDocument();
        return new OpenMctConfiguration(baseConfigDoc);
    }

    async resolveConfiguration({template, instance}: {template?: string, instance: string}): Promise<OpenMctConfiguration> {
        let config:OpenMctConfiguration;
        const configurator:MctYamlConfigurator = new MctYamlConfigurator();

        if (template !== undefined) {
            if (configurator.instanceConfigExists(instance)) {
                const rl = readline.createInterface({
                    input: process.stdin, //or fileStream 
                    output: process.stdout
                    });
                const answer = await rl.question('You have specified a template. This will override any existing configuration for this instance. Are you sure? (y/n) ');
                rl.close();
                if (answer !== 'y') {
                    throw new Error('User canceled');
                }
            }
            const templateYaml = fs.readFileSync(template, 'utf-8');
            config = configurator.loadFromYaml(templateYaml);
        } else {
            if (configurator.instanceConfigExists(instance)) {
                config = configurator.loadForInstance(instance);
            } else {
                config = configurator.loadDefaultConfiguration();
            }
        }

        return config;
    }

    #loadDefaultConfigurationDocument(): OpenMctConfigurationSchema {
        const baseConfigText = fs.readFileSync(BASE_CONFIG_LOCATION, 'utf-8');
        return this.#loadYaml(baseConfigText);
    }

    #loadYaml(yaml: string): OpenMctConfigurationSchema {
        let doc = yamllib.load(yaml) as OpenMctConfigurationSchema;

        const result = this.#validator.validate(doc, this.#jsonSchema);
        if (result.errors.length > 0) {
            const errorMessages = result.errors.map(err => 
                `[${err.property}] ${err.message}`
            ).join('\n');
            throw new ValidationError(`Validation failed:\n${errorMessages}`);
        }

        return doc;
    }

    #normalizePlugins(plugins: (PluginMap | string)[]): PluginMap {
        return plugins.reduce((pluginMap: PluginMap, plugin: PluginMap | string) => {
            if (typeof plugin === 'string') {
                pluginMap[plugin] = {} as Plugin;
            } else {
                const pluginName = Object.keys(plugin)[0];
                pluginMap[pluginName] = plugin[pluginName];
            }
            return pluginMap;
        }, {} as PluginMap);        
    }

    #denormalizePlugins(pluginMap: PluginMap): (PluginMap | string)[] {
        return Object.entries(pluginMap).map(([pluginName, plugin]) => {
            if (this.#hasDefinition(plugin)) {
                return { [pluginName]: plugin } as PluginMap;
            } else {
                return pluginName as string;
            }
        });
    }

    #hasDefinition(plugin: Plugin): boolean {
        return plugin !== undefined && Object.keys(plugin).length > 0;
    }

    #applyBaseConfiguration(doc: OpenMctConfigurationSchema): OpenMctConfigurationSchema {
        const baseConfigDoc = this.#loadDefaultConfigurationDocument();
        const mappedBasePlugins = this.#normalizePlugins(baseConfigDoc.openmct.plugins ?? []);
        const mappedDocPlugins = this.#normalizePlugins(doc.openmct?.plugins ?? []);
        const mergedPlugins = merge(mappedBasePlugins, mappedDocPlugins);
        const denormalizedPlugins = this.#denormalizePlugins(mergedPlugins);
        doc.openmct.plugins = denormalizedPlugins;

        return doc;
    }


}