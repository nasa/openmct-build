import OpenMctConfiguration from "../openmct/OpenMctConfiguration";
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';
import NpmPackageManager from "../npm/NpmPackageManager";
import InstalledNpmPackage from "../npm/InstalledNpmPackage";

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

    async #buildLoadBlockForAllPluginsPreservingOrder(document: Document): Promise<HTMLScriptElement> {
        const scriptElement = document.createElement('script');
        scriptElement.type = 'module';
        scriptElement.async = true;
        scriptElement.blocking = 'render';
        scriptElement.textContent += `import installBuiltinPlugin from './assets/installBuiltinPlugin.js';\r\n`;
        scriptElement.textContent += `import installEs6Plugin from './assets/installEs6Plugin.js';\r\n`;
        scriptElement.textContent += `import installCommonJsPlugin from './assets/installCommonJsPlugin.js';\r\n`;
        scriptElement.textContent += `const openmct = window.openmct;\r\n`;
        scriptElement.textContent += `openmct.setAssetPath("node_modules/openmct/dist");\n`;

        for (const plugin of this.#configuration.getPlugins()) {
            if (!plugin.isEnabled()) {
                continue;
            }
            const installFunctionName = plugin.getInstallFunction() || plugin.getName();
            if (plugin.isBuiltin()) {
                scriptElement.textContent += `installBuiltinPlugin({openmct, installFunction: ${installFunctionName}, installFunctionOptions: ${JSON.stringify(plugin.getOptions())}, buildTimeSubstitutions: {}});\n`;
            } else {
                const npmPackage = await this.#npmPackageManager.getInstalledPackage(plugin.getNpmPackageName()) as InstalledNpmPackage;
                const variableSubstitutions = {
                    '${pluginContextPath}': npmPackage.getRelativeInstalledPath()
                };

                if (npmPackage.getPackageType() === 'module') {
                    scriptElement.textContent += `await installEs6Plugin({openmct, importPath: '../${npmPackage.getPathToEntryPoint(plugin)}', installFunctionName: '${installFunctionName}', installFunctionOptions: ${JSON.stringify(plugin.getOptions())}, buildTimeSubstitutions: ${JSON.stringify(variableSubstitutions)}});\n`;
                } else {
                    scriptElement.textContent += `await installCommonJsPlugin({openmct, importPath: '../${npmPackage.getPathToEntryPoint(plugin)}', installFunctionName: '${installFunctionName}', installFunctionOptions: ${JSON.stringify(plugin.getOptions())}, buildTimeSubstitutions: ${JSON.stringify(variableSubstitutions)}});\n`;
                }
            }
        }
        scriptElement.textContent += `openmct.start();\n`;

        return scriptElement;
    }
        
    async generateHtml(): Promise<string> {
        const template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
        const dom = new JSDOM(template);
        const document = dom.window.document;
        const scripts = this.#buildIncludeOpenMctBlock(document);
        scripts.forEach(script => document.head.appendChild(script));
        const scriptBlockForAllPlugins = await this.#buildLoadBlockForAllPluginsPreservingOrder(document);
        document.head.appendChild(scriptBlockForAllPlugins);

        return dom.serialize(); // previously returned document, which excluded <!DOCTYPE html>
    }
}
