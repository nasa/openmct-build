import { describe, it, expect, beforeEach } from '@jest/globals';
import MctYamlConfigurator from '../yaml/MctYamlConfigurator';
import IndexFileCreator from './IndexFileCreator';
import OpenMctConfiguration from '../openmct/OpenMctConfiguration';
import { DEFAULT_INSTANCE } from '../constants';
import NpmPackageManager from '../npm/NpmPackageManager';

describe('YamlConfigurator', () => {
    let configurator: MctYamlConfigurator;
    let configuration: OpenMctConfiguration;

    beforeEach(() => {
        configurator = new MctYamlConfigurator();
        const yamlString = `
        openmct:
            plugins:
            - openmct.plugins.LocalClock
            - openmct.plugins.example.Generator
            - openmct.plugins.PlanLayout:
                options:
                    creatable: true
        `;

        configuration = configurator.#loadExistingConfiguration(yamlString);
    });

    describe('IndexFileCreator', () => {
        it('should generate a basic HTML page from the template', () => {
            const npmPackageManager:NpmPackageManager = NpmPackageManager.getNodePackageManagerForInstance({instance: DEFAULT_INSTANCE, config: configuration});
            const indexFileCreator = new IndexFileCreator(configuration, npmPackageManager);
            const document = indexFileCreator.generateDocument();
            expect(document).toBeDefined();
        });

        it('Should produce a JavaScript code block installing the configured plugins from a YAML document', () => {
            const npmPackageManager:NpmPackageManager = NpmPackageManager.getNodePackageManagerForInstance({instance: DEFAULT_INSTANCE, config: configuration});
            const indexFileCreator = new IndexFileCreator(configuration, npmPackageManager);
            const document = indexFileCreator.generateDocument();

            const htmlText = document.documentElement.innerHTML;
            expect(htmlText).toContain('openmct.install(openmct.plugins.LocalClock());');
            expect(htmlText).toContain('openmct.install(openmct.plugins.example.Generator());');
            expect(htmlText).toContain('openmct.install(openmct.plugins.PlanLayout({"creatable":true}));');
        });
    });
});