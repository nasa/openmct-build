import MctYamlConfigurator from './MctYamlConfigurator';
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('MctYamlConfigurator', () => {
    let configurator: MctYamlConfigurator;

    beforeEach(() => {
        configurator = new MctYamlConfigurator();
    });

    describe('loadFromYaml', () => {
        it('should load valid YAML and return the document', () => {
            const yamlString = `
                openmct:
                    plugins:
                    - openmct.Plugins.LocalClock
                    - openmct.plugins.example.Generator
                    - openmct.plugins.PlanLayout:
                        options:
                            creatable: true
            `;

            const configDoc = configurator.#loadExistingConfiguration(yamlString);

            expect(configDoc).toBeDefined();
        });

        it('should throw an error on invalid YAML', () => {
            const yamlString = `
                name: Test Configuration
                version
                settings:
                  theme: dark
                  autoSave: true
            `;

            expect(() => configurator.#loadExistingConfiguration(yamlString)).toThrow();
        });

        it('Should reject YAML that does not conform to the Open MCT configuration schema', () => {
            const yamlString = `
                name: Test Configuration
                version: 1.0.0
                settings:
                  theme: dark
                  autoSave: true
            `;

            expect(() => configurator.#loadExistingConfiguration(yamlString)).toThrow();
        });
    });
});