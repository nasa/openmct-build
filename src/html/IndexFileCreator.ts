import OpenMctConfiguration from "../openmct/OpenMctConfiguration";
import OpenMctPlugin from "../openmct/OpenMctPlugin";
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';
import NpmPackageManager from "../npm/NpmPackageManager";
import NpmPackage from "../npm/NpmPackage";

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
        scriptElement.textContent += `import installEs6Plugins from './assets/installEs6Plugins.js';\r\n`;
        const pluginsByEntryPoint:Map<string, OpenMctPlugin[]> = this.#configuration.getNodePlugins()
            .filter(plugin => plugin.isEnabled())
            .reduce((acc, plugin) => {
                const npmPackage = this.#npmPackageManager.getPackage(plugin.getNpmPackageName());
                if (npmPackage.getPackageType() !== 'module') {
                    return acc;
                }
                const entryPoint = npmPackage.getResolvedEntryPoint(plugin);
                if (!acc.has(entryPoint)) {
                    acc.set(entryPoint, []);
                }
                acc.get(entryPoint)?.push(plugin);

                return acc;
        }, new Map<string, OpenMctPlugin[]>());

        pluginsByEntryPoint.forEach((plugins, entryPoint) => {
            const installFunctionNames:string[] = [];
            const installFunctionOptions:(object | undefined)[] = [];
            plugins.forEach((plugin: OpenMctPlugin) => {
                installFunctionNames.push(plugin.getName());
                installFunctionOptions.push(plugin.getOptions());
            });
            scriptElement.textContent += `await installEs6Plugins({openmct: window.openmct, importPath: '../${entryPoint}', installFunctionNames: ${JSON.stringify(installFunctionNames)}, installFunctionOptions: ${JSON.stringify(installFunctionOptions)}});\r\n`;
        });

        scriptElement.textContent += `document.dispatchEvent(new Event("Es6PluginsInstalled"));`;

        return scriptElement;
    }
    #buildCommonJsLoadBlock(document: Document): HTMLScriptElement {
        const scriptElement = document.createElement('script');
        scriptElement.type = 'module';
        scriptElement.async = true;
        scriptElement.blocking = 'render';
        scriptElement.textContent += `import installCommonJsPlugins from './assets/installCommonJsPlugins.js';\r\n`;
        const pluginsByEntryPoint:Map<string, OpenMctPlugin[]> = this.#configuration.getNodePlugins()
            .filter(plugin => plugin.isEnabled())
            .reduce((acc, plugin) => {
                const npmPackage = this.#npmPackageManager.getPackage(plugin.getNpmPackageName());
                if (npmPackage.getPackageType() === 'module') {
                    return acc;
                }
                const entryPoint = npmPackage.getResolvedEntryPoint(plugin);
                if (!acc.has(entryPoint)) {
                    acc.set(entryPoint, []);
                }
                acc.get(entryPoint)?.push(plugin);

                return acc;
        }, new Map<string, OpenMctPlugin[]>());

        pluginsByEntryPoint.forEach((plugins, entryPoint) => {
            const installFunctionNames:string[] = [];
            const installFunctionOptions:(object | undefined)[] = [];
            plugins.forEach((plugin: OpenMctPlugin) => {
                installFunctionNames.push(plugin.getName());
                installFunctionOptions.push(plugin.getOptions());
            });
            scriptElement.textContent += `await installCommonJsPlugins({openmct: window.openmct, importPath: '../${entryPoint}', installFunctionNames: ${JSON.stringify(installFunctionNames)}, installFunctionOptions: ${JSON.stringify(installFunctionOptions)}});\r\n`;
        });

        scriptElement.textContent += `document.dispatchEvent(new Event("CommonJsPluginsInstalled"));`;

        return scriptElement;
    }
    
    #buildBuiltinsInstallBlock(document: Document): HTMLScriptElement {
        let pluginInstallFunctionBody = 'openmct.setAssetPath("node_modules/openmct/dist");\n';

        this.#configuration.getBuiltinPlugins().forEach(plugin => {
            if (plugin.isEnabled()) {
                pluginInstallFunctionBody += `openmct.install(${plugin.generateBuiltinInstallFunctionCall()});\n`;
            }
        });
        const pluginInstallFunction = `(() => {${pluginInstallFunctionBody}})();`;

        const scriptElement = document.createElement('script');
        scriptElement.textContent = pluginInstallFunction;
        scriptElement.textContent += `document.dispatchEvent(new Event("BuiltinPluginsInstalled"));`;
        return scriptElement;
    }

    #buildAsyncInitializationBlock(document: Document): HTMLScriptElement {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = `(() => {
            let builtinPluginsInstalled = false;
            let commonJsPluginsInstalled = false;
            let es6PluginsInstalled = false;

            document.addEventListener("BuiltinPluginsInstalled", function () {
                builtinPluginsInstalled = true;
                checkIfAllPluginsInstalled();
            });
            document.addEventListener("CommonJsPluginsInstalled", function () {
                commonJsPluginsInstalled = true;
                checkIfAllPluginsInstalled();
            });
            document.addEventListener("Es6PluginsInstalled", function () {
                es6PluginsInstalled = true;
                checkIfAllPluginsInstalled();
            });
            function checkIfAllPluginsInstalled() {
                if (builtinPluginsInstalled && commonJsPluginsInstalled && es6PluginsInstalled) {
                    openmct.start();
                }
            }
        })();`;

        return scriptElement;
    }
        

    generateDocument(): Document {
        const template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
        const dom = new JSDOM(template);
        const document = dom.window.document;
        const scripts = this.#buildIncludeOpenMctBlock(document);
        scripts.forEach(script => document.head.appendChild(script));
        const asyncInitializationBlock = this.#buildAsyncInitializationBlock(document);
        const builtinInstallBlock = this.#buildBuiltinsInstallBlock(document);
        const es6LoadBlock = this.#buildES6LoadBlock(document);
        const commonJsLoadBlock = this.#buildCommonJsLoadBlock(document);
        document.head.appendChild(asyncInitializationBlock);
        document.head.appendChild(builtinInstallBlock);
        document.head.appendChild(es6LoadBlock);
        document.head.appendChild(commonJsLoadBlock);

        return document;
    }
}
