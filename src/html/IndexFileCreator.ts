import OpenMctConfiguration from "../openmct/OpenMctConfiguration";
import OpenMctPlugin from "../openmct/OpenMctPlugin";
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
    #substituteVariables(input?: object, variables?: object): object | undefined {
        if (input === undefined || variables === undefined) {
            return undefined;
        }
        return JSON.parse(JSON.stringify(input).replace(/\${(\w+)}/g, (match, variable) => {
            if (variables[variable as keyof typeof variables] === undefined) {
                return match;
            } else {
                return variables[variable as keyof typeof variables];
            }
        }));
    }
    #buildLoadBlockForAllPluginsPreservingOrder(document: Document): HTMLScriptElement {
        const scriptElement = document.createElement('script');
        scriptElement.type = 'module';
        scriptElement.async = true;
        scriptElement.blocking = 'render';
        scriptElement.textContent += `import installEs6Plugin from './assets/installEs6Plugin.js';\r\n`;
        scriptElement.textContent += `import installCommonJsPlugin from './assets/installCommonJsPlugin.js';\r\n`;
        scriptElement.textContent += `openmct.setAssetPath("node_modules/openmct/dist");\n`;

        this.#configuration.getPlugins().forEach(plugin => {
            if (plugin.isEnabled()) {
                if (plugin.isBuiltin()) {
                    scriptElement.textContent += `openmct.install(${plugin.generateBuiltinInstallFunctionCall()});\n`;
                } else {
                    const npmPackage = this.#npmPackageManager.getPackage(plugin.getNpmPackageName()) as InstalledNpmPackage;
                    const optionsWithSubstitutions = this.#substituteVariables(plugin.getOptions(), {pluginContextPath: npmPackage.getRelativeInstalledPath()});
                    const installFunctionName = plugin.getInstallFunction() || plugin.getName();

                    if (npmPackage.getPackageType() === 'module') {
                        scriptElement.textContent += `await installEs6Plugin({openmct: window.openmct, importPath: '../${npmPackage.getResolvedEntryPoint(plugin)}', installFunctionName: '${installFunctionName}', installFunctionOptions: ${JSON.stringify(optionsWithSubstitutions)}});\n`;
                    } else {
                        scriptElement.textContent += `await installCommonJsPlugin({openmct: window.openmct, importPath: '../${npmPackage.getResolvedEntryPoint(plugin)}', installFunctionName: '${installFunctionName}', installFunctionOptions: ${JSON.stringify(optionsWithSubstitutions)}});\n`
                    }
                }
            }
        });

        scriptElement.textContent += `openmct.start();\n`;

        return scriptElement;
    }
        
    generateDocument(): Document {
        const template = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf-8');
        const dom = new JSDOM(template);
        const document = dom.window.document;
        const scripts = this.#buildIncludeOpenMctBlock(document);
        scripts.forEach(script => document.head.appendChild(script));
        const scriptBlockForAllPlugins = this.#buildLoadBlockForAllPluginsPreservingOrder(document);
        document.head.appendChild(scriptBlockForAllPlugins);
        return document;
    }
}
