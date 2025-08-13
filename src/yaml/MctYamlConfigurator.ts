import OpenMctConfiguration from "../openmct/OpenMctConfiguration";
import * as yamllib from 'js-yaml';
import { Validator, ValidationError } from 'jsonschema';
import { OpenMctConfigurationSchema, Plugin, PluginMap } from "../openmct/OpenMctConfigurationDocument";
import * as path from 'path';
import * as fs from 'fs';
import merge from 'lodash.merge';

const SCHEMA_LOCATION = path.join(__dirname, 'openmct-configuration-schema.json');
const BASE_CONFIG_LOCATION = path.join(__dirname, 'openmct-base.yaml');

export default class MctYamlConfigurator {
    #jsonSchema: object;
    #validator: Validator;
    #openmctConfiguration: OpenMctConfiguration | undefined;

    constructor() {
        const jsonSchema = fs.readFileSync(SCHEMA_LOCATION, 'utf-8');
        this.#jsonSchema = JSON.parse(jsonSchema);
        this.#validator = new Validator();
    }

    loadFromYaml(yaml: string): OpenMctConfiguration {
        let doc: OpenMctConfigurationSchema;
        if (yaml === undefined || yaml.length === 0) {
            doc = this.loadDefaultConfiguration();
        } else {
            doc = this.#loadYaml(yaml);
            doc = this.#applyBaseConfiguration(doc);
        }

        this.#openmctConfiguration = new OpenMctConfiguration(doc);

        return this.#openmctConfiguration;
    }

    serializeToYaml() {
        return yamllib.dump(this.#openmctConfiguration);
    }

    loadDefaultConfiguration(): OpenMctConfigurationSchema {
        const baseConfigText = fs.readFileSync(BASE_CONFIG_LOCATION, 'utf-8');
        const baseConfigDoc = this.#loadYaml(baseConfigText);

        return baseConfigDoc;
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
                pluginMap[plugin] = {};
            } else {
                const pluginName = Object.keys(plugin)[0];
                pluginMap[pluginName] = plugin[pluginName];
            }
            return pluginMap;
        }, {} as PluginMap);        
    }

    #applyBaseConfiguration(doc: OpenMctConfigurationSchema): OpenMctConfigurationSchema {
        const baseConfigDoc = this.loadDefaultConfiguration();
        const mappedBasePlugins = this.#normalizePlugins(baseConfigDoc.openmct.plugins ?? []);
        const mappedDocPlugins = this.#normalizePlugins(doc.openmct?.plugins ?? []);
        const mergedPlugins = merge(mappedBasePlugins, mappedDocPlugins);

        const arrayedPlugins: (string | PluginMap)[] = Object.entries(mergedPlugins).map(([pluginName, plugin]) => {
            if (plugin !== undefined) {
                return { [pluginName]: plugin } as PluginMap;
            } else {
                return pluginName as string;
            }
        });
        doc.openmct.plugins = arrayedPlugins;

        return doc;
    }


}