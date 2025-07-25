import OpenMctConfiguration from "../openmct/OpenMctConfiguration";
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

export default class IndexFileCreator {
    #configuration: OpenMctConfiguration;

    constructor(configuration: OpenMctConfiguration) {
        this.#configuration = configuration;
    }
    #buildIncludeBlock(document: Document): HTMLScriptElement {
        const scriptElement = document.createElement('script');
        scriptElement.src = 'node_modules/openmct/dist/openmct.js';
        return scriptElement;
    }
    #buildPluginInstallBlock(document: Document): HTMLScriptElement {
        let pluginInstallFunctionBody = 'openmct.setAssetPath("node_modules/openmct/dist");\n';

        /**
         * TODO: Use a code generator like astring to generate the plugin install block
         */

        this.#configuration.getPlugins().forEach(plugin => {
            const options = plugin.getOptions();
            pluginInstallFunctionBody += `openmct.install(${plugin.getInstallFunctionName()}(${options ? JSON.stringify(options) : ''}));\n`;
        });
        const pluginInstallFunction = `(() => {${pluginInstallFunctionBody}})();`;

        const scriptElement = document.createElement('script');
        scriptElement.textContent = pluginInstallFunction;
        
        return scriptElement;
    }
    #buildStartBlock(document: Document): HTMLScriptElement {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = `document.addEventListener("DOMContentLoaded", function () {
            openmct.time.setTimeSystem('utc');
            openmct.time.setClock('local', {start: -900000, end: 0});
            openmct.start();
        });`;
        return scriptElement;
    }
    generateDocument(): Document {
        const template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
        const dom = new JSDOM(template);
        const document = dom.window.document;
        document.head.appendChild(this.#buildIncludeBlock(document))
        document.head.appendChild(this.#buildPluginInstallBlock(document))
        document.head.appendChild(this.#buildStartBlock(document));

        return document;
    }
}
