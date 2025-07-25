import { describe, it, expect, beforeEach } from '@jest/globals';
import MctYamlConfigurator from '../yaml/MctYamlConfigurator';
import IndexFileCreator from './IndexFileCreator';
import OpenMctConfiguration from '../openmct/OpenMctConfiguration';

describe('YamlConfigurator', () => {
    let configurator: MctYamlConfigurator;
    let configuration: OpenMctConfiguration;

    beforeEach(() => {
        configurator = new MctYamlConfigurator();
        const yamlString = `
        openmct:
            plugins:
            - openmct.Plugins.LocalClock
            - openmct.Plugins.example.Generator
            - openmct.Plugins.PlanLayout:
                options:
                    creatable: true
        `;

        configuration = configurator.loadFromYaml(yamlString);
    });

    describe('IndexFileCreator', () => {
        it('should generate a basic HTML page from the template', () => {
            const indexFileCreator = new IndexFileCreator(configuration);
            const document = indexFileCreator.generateDocument();
            expect(document).toBeDefined();
        });

        it('Should produce a JavaScript code block installing the configured plugins from a YAML document', () => {
            const indexFileCreator = new IndexFileCreator(configuration);
            const document = indexFileCreator.generateDocument();

            const htmlText = document.documentElement.innerHTML;
            expect(htmlText).toContain('openmct.install(openmct.Plugins.LocalClock());');
            expect(htmlText).toContain('openmct.install(openmct.Plugins.example.Generator());');
            expect(htmlText).toContain('openmct.install(openmct.Plugins.PlanLayout({"creatable":true}));');
        });
    });
});