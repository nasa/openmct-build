import OpenMctConfiguration from "../openmct/OpenMctConfiguration";
import OpenMctPlugin from "../openmct/OpenMctPlugin";
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';
import NpmPackageManager from "../npm/NpmPackageManager";

export default class IndexFileCreator {
    #configuration: OpenMctConfiguration;
    #npmPackageManager: NpmPackageManager;

    constructor(configuration: OpenMctConfiguration, npmPackage: NpmPackageManager) {
        this.#configuration = configuration;
        this.#npmPackageManager = npmPackage;
    }
    #buildIncludeOpenMctBlock(document: Document): HTMLScriptElement[] {
        const scriptElement = document.createElement('script');
        scriptElement.src = 'node_modules/openmct/dist/openmct.js';

        const includeScriptElements = [scriptElement];

        return includeScriptElements;
    }
    #buildES6LoadBlock(document: Document): HTMLScriptElement {
        const scriptElement = document.createElement('script');
        scriptElement.type = 'module';
        scriptElement.async = true;
        scriptElement.blocking = 'render';
        this.#configuration.getNodePlugins().map((plugin: OpenMctPlugin) => {
            const npmPackage = this.#npmPackageManager.getPackage(plugin.getNpmPackageName());
            if (npmPackage.getPackageType() === 'module') {
                const src = npmPackage.getResolvedEntryPoint(plugin);
                const installFunctionName = `install${(Math.random() * 10000000).toFixed(0)}`;
                scriptElement.textContent += `import { default as ${installFunctionName} } from './${src}';\r\n`;
                scriptElement.textContent += `openmct.install(${installFunctionName}(${JSON.stringify(plugin.getOptions())}));\r\n`;
            }
        });

        return scriptElement;
    }
    #buildCommonJsLoadBlock(document: Document): HTMLScriptElement {
        const scriptElement = document.createElement('script');
        scriptElement.type = 'module';
        scriptElement.async = true;
        scriptElement.blocking = 'render';
        scriptElement.textContent = `import loadUmd from './assets/load-umd.js';\r\n`;
        this.#configuration.getNodePlugins().map((plugin: OpenMctPlugin) => {
            const npmPackage = this.#npmPackageManager.getPackage(plugin.getNpmPackageName());
            if (npmPackage.getPackageType() === 'commonjs') {
                const src = npmPackage.getResolvedEntryPoint(plugin);
                scriptElement.textContent += `openmct.install((await loadUmd('../${src}'))(${JSON.stringify(plugin.getOptions())}));\r\n`;
            }
        });

        scriptElement.textContent += `document.dispatchEvent(new Event("OpenMCTPluginsInstalled"));`;

        return scriptElement;
    }
    
    #buildBuiltinsInstallBlock(document: Document): HTMLScriptElement {
        let pluginInstallFunctionBody = 'openmct.setAssetPath("node_modules/openmct/dist");\n';

        this.#configuration.getBuiltinPlugins().forEach(plugin => {
            pluginInstallFunctionBody += `openmct.install(${plugin.generateInstallFunctionCall()});\n`;
        });
        const pluginInstallFunction = `(() => {${pluginInstallFunctionBody}})();`;

        const scriptElement = document.createElement('script');
        scriptElement.textContent = pluginInstallFunction;
        return scriptElement;
    }

    #buildStartBlock(document: Document): HTMLScriptElement {
        const scriptElement = document.createElement('script');
        scriptElement.defer = true;
        scriptElement.textContent = `document.addEventListener("OpenMCTPluginsInstalled", function () {
            openmct.start();
        });`;
        return scriptElement;
    }
    generateDocument(): Document {
        const template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
        const dom = new JSDOM(template);
        const document = dom.window.document;
        const scripts = this.#buildIncludeOpenMctBlock(document);
        scripts.forEach(script => document.head.appendChild(script));
        const es6LoadBlock = this.#buildES6LoadBlock(document);
        const commonJsLoadBlock = this.#buildCommonJsLoadBlock(document);
        document.head.appendChild(this.#buildBuiltinsInstallBlock(document))
        document.head.appendChild(es6LoadBlock);
        document.head.appendChild(commonJsLoadBlock);
        document.head.appendChild(this.#buildStartBlock(document));

        return document;
    }
}
