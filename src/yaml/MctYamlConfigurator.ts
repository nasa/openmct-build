import OpenMctConfiguration, { CONFIGURATION_YAML, INSTANCE_PATH } from "../openmct/OpenMctConfiguration";
import * as yamllib from 'js-yaml';
import { Validator, ValidationError, Schema } from 'jsonschema';
import { OpenMctConfigurationSchema, Plugin, PluginMap } from "../openmct/OpenMctConfigurationDocument";
import * as path from 'path';
import * as fs from 'fs';
import merge from 'lodash.merge';
import OpenMctPlugin from "../openmct/OpenMctPlugin";

const BASE_CONFIG_LOCATION = path.join(__dirname, '../', 'openmct-base.yaml');
const CONFIG_SCHEMA_LOCATION = path.join(__dirname, '../', 'assets/openmct-configuration-schema.json');
const RELATIVE_PATH_REGEX = /(file:)?(\.{1,2}.*)/;

export default class MctYamlConfigurator {
    #validator: Validator;
    #schema: Schema;

    constructor() {
        this.#validator = new Validator();
        this.#schema = JSON.parse(fs.readFileSync(CONFIG_SCHEMA_LOCATION, 'utf-8'));
    }

    loadRecipe(recipe: string): OpenMctConfiguration {
        let doc: OpenMctConfigurationSchema = this.#loadYaml(recipe);

        return new OpenMctConfiguration(doc);
    }

    #loadExistingConfiguration(yaml: string): OpenMctConfiguration {
        let doc: OpenMctConfigurationSchema = this.#loadYaml(yaml);

        return new OpenMctConfiguration(doc);
    }

    loadForInstance(instance: string): OpenMctConfiguration {
        const configString = fs.readFileSync(path.join(INSTANCE_PATH, instance, CONFIGURATION_YAML), 'utf-8');
        const config = this.#loadExistingConfiguration(configString);

        return config;
    }

    saveForInstance(instance: string, config: OpenMctConfiguration) {
        let configString = this.serializeToYaml(config);
        configString = '# yaml-language-server: $schema=assets/openmct-configuration-schema.json\n' + configString;
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

    exists(instance: string): boolean {
        return fs.existsSync(path.join(INSTANCE_PATH, instance, CONFIGURATION_YAML));
    }

    async resolveConfiguration({recipe, instance}: {recipe?: string, instance: string}): Promise<OpenMctConfiguration> {
        let config:OpenMctConfiguration;
        const configurator:MctYamlConfigurator = new MctYamlConfigurator();

        if (recipe !== undefined) {
            const recipeYaml = fs.readFileSync(recipe, 'utf-8');
            config = configurator.loadRecipe(recipeYaml);
            config = this.#convertNpmPackagesToAbsolutePaths(config, path.dirname(recipe));
            const baseConfiguration = configurator.loadDefaultConfiguration();
            config = this.#applyBaseConfiguration(config, baseConfiguration);
        } else {
            if (configurator.instanceConfigExists(instance)) {
                config = configurator.loadForInstance(instance);
            } else {
                config = configurator.loadDefaultConfiguration();
            }
        }

        return config;
    }

    #convertNpmPackagesToAbsolutePaths(config: OpenMctConfiguration, relativePathBase: string) {
        const nodePlugins = config.getNodePlugins();
        nodePlugins.forEach((nodePlugin: OpenMctPlugin) => {
            const packageName = nodePlugin.getNpmPackageName();
            const relativePathRegexResult = packageName.match(RELATIVE_PATH_REGEX);
            if (relativePathRegexResult && relativePathRegexResult.length > 0) {
                const resolvedPath = path.resolve(relativePathBase, relativePathRegexResult[2]);
                nodePlugin.setNpmPackageName(`file:${resolvedPath}`);
            }
        });

        return config;
    }

    #loadDefaultConfigurationDocument(): OpenMctConfigurationSchema {
        const baseConfigText = fs.readFileSync(BASE_CONFIG_LOCATION, 'utf-8');
        return this.#loadYaml(baseConfigText);
    }

    #loadYaml(yaml: string): OpenMctConfigurationSchema {
        let doc = yamllib.load(yaml) as OpenMctConfigurationSchema;

        const result = this.#validator.validate(doc, this.#schema);
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

    #applyBaseConfiguration(instanceConfiguration: OpenMctConfiguration, baseConfiguration: OpenMctConfiguration): OpenMctConfiguration {
        const baseConfigDoc = baseConfiguration.getConfigurationDocument();
        const instanceConfigDoc = instanceConfiguration.getConfigurationDocument();
        const mappedBasePlugins = this.#normalizePlugins(baseConfigDoc.openmct.plugins ?? []);
        const mappedDocPlugins = this.#normalizePlugins(instanceConfigDoc.openmct?.plugins ?? []);
        const mergedPlugins = merge(mappedBasePlugins, mappedDocPlugins);
        const denormalizedPlugins = this.#denormalizePlugins(mergedPlugins);
        instanceConfigDoc.openmct.plugins = denormalizedPlugins;

        return new OpenMctConfiguration(instanceConfigDoc);
    }


}