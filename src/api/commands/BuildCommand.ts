import Command from "./Command";
import path from "path";
import * as fs from 'fs';
import MctYamlConfigurator from "../../yaml/MctYamlConfigurator";
import IndexFileCreator from "../../html/IndexFileCreator";
import OpenMctConfiguration, { INSTANCE_PATH } from "../../openmct/OpenMctConfiguration";
import NpmPackageManager from "../../npm/NpmPackageManager";
import OpenMctPlugin from "../../openmct/OpenMctPlugin";
import { ParseArgsConfig } from "util";

export default class BuildCommand extends Command {

    getArgsForVerb(verb: string): ParseArgsConfig {
        const additionalArgs:ParseArgsConfig = {
            options: {
                npmPackage: {
                        type: 'string',
                        short: 'p',
                        default: undefined,
                },
                recipe: {
                    type: 'string',
                    short: 'r',
                    default: undefined,
                },
                version: {
                    type: 'string',
                    short: 'v',
                    default: undefined,
                }
            }
        };

        return {
            options: {
                ...super.getArgsForVerb(verb).options,
                ...additionalArgs.options
        }};
    }

    getUsageForVerb(verb: string): string {
        return 'Usage: mct build [--instance <instance-name>] [--recipe <recipe-name>] [--version <version>] [--npm-package <npm-package-name>]';
    }

    async execute(verb: undefined, name: undefined, {instance, recipe, version, npmPackage}: {instance: string, recipe?: string, version?: string, npmPackage?: string}) {
        const fullInstancePath:string = path.join(INSTANCE_PATH, instance);
        const configurator:MctYamlConfigurator = new MctYamlConfigurator();
        const config:OpenMctConfiguration = await configurator.resolveConfiguration({recipe, instance});

        this.#createDirectoryStructureIfNeeded(fullInstancePath);
        this.#copyAssets({fullInstancePath});
        
        if (version !== undefined) {    
            config.setOpenMctVersion(version);
        }
        if (npmPackage !== undefined) {
            config.setNpmPackage(npmPackage);
        }
        configurator.saveForInstance(instance, config);

        const npmPackageManager:NpmPackageManager = NpmPackageManager.getNodePackageManagerForInstance({instance, config});
        this.#installNpmPackages({config, npmPackageManager});
        this.#generateHtmlDocument({config, fullInstancePath, npmPackageManager});
    }

    #createDirectoryStructureIfNeeded(fullInstancePath:string) {
        if (!fs.existsSync(fullInstancePath)) {
            fs.mkdirSync(fullInstancePath, { recursive: true });
        }
    }

    #generateHtmlDocument({config, fullInstancePath, npmPackageManager}: {config: OpenMctConfiguration, fullInstancePath: string, npmPackageManager: NpmPackageManager}) {
        const indexFileCreator = new IndexFileCreator(config, npmPackageManager);
        const indexFile = indexFileCreator.generateDocument();

        fs.writeFileSync(path.join(fullInstancePath, 'index.html'), indexFile.documentElement.outerHTML);
    }

    #copyAssets({fullInstancePath}: {fullInstancePath: string}) {
        fs.cpSync(path.join(__dirname, '..', '..', 'assets'), path.join(fullInstancePath, 'assets'), { recursive: true });
    }

    #installNpmPackages({config, npmPackageManager}: {config: OpenMctConfiguration, npmPackageManager: NpmPackageManager}) {
        const nodePackages = config.getNodePlugins();
        npmPackageManager.install();
        nodePackages.forEach((nodePackage: OpenMctPlugin) => {
            npmPackageManager.installPackage(nodePackage.getNpmPackageName());
        });
    }
}