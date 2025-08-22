import Command from "./Command";
import path from "path";
import * as fs from 'fs';
import MctYamlConfigurator from "../../yaml/MctYamlConfigurator";
import IndexFileCreator from "../../html/IndexFileCreator";
import OpenMctConfiguration, { INSTANCE_PATH, CONFIGURATION_YAML } from "../../openmct/OpenMctConfiguration";
import NpmPackageManager from "../../npm/NpmPackageManager";
import OpenMctPlugin from "../../openmct/OpenMctPlugin";
import readline from 'readline/promises';

export default class BuildCommand extends Command {
    async execute(verb: undefined, name: undefined, {instance, template: template}: {instance: string, template?: string}) {
        const fullInstancePath:string = path.join(INSTANCE_PATH, instance);
        const configurator:MctYamlConfigurator = new MctYamlConfigurator();
        let configPath: string = path.join(fullInstancePath, CONFIGURATION_YAML);

        if (template !== undefined) {
            if (fs.existsSync(configPath)) {
                const rl = readline.createInterface({
                    input: process.stdin, //or fileStream 
                    output: process.stdout
                  });
                const answer = await rl.question('You have specified a template. This will override any existing configuration for this instance. Are you sure? (y/n) ');
                rl.close();
                if (answer !== 'y') {
                    return;
                }
            }
            configPath = template;
        }

        const config:OpenMctConfiguration = this.#getConfiguration({configPath, configurator});
        this.#createDirectoryStructureIfNeeded(fullInstancePath);
        this.#copyAssets({fullInstancePath});

        const npmPackage:NpmPackageManager = NpmPackageManager.getNodePackageManagerForInstance({fullInstancePath, config});
        this.#installNpmPackages({config, npmPackage});
        this.#generateHtmlDocument({config, fullInstancePath, npmPackage});
    }

    #createDirectoryStructureIfNeeded(fullInstancePath:string) {
        if (!fs.existsSync(fullInstancePath)) {
            fs.mkdirSync(fullInstancePath, { recursive: true });
        }
    }

    #getConfiguration({configPath, configurator}: {configPath?: string, configurator: MctYamlConfigurator}):OpenMctConfiguration {
        let config: OpenMctConfiguration;

        if (configPath !== undefined) {
            const configString = fs.readFileSync(configPath, 'utf-8');
            config = configurator.loadFromYaml(configString);
        } else {
            config = new OpenMctConfiguration(configurator.loadDefaultConfiguration());
        }

        return config;

    }

    #generateHtmlDocument({config, fullInstancePath, npmPackage}: {config: OpenMctConfiguration, fullInstancePath: string, npmPackage: NpmPackageManager}) {
        const indexFileCreator = new IndexFileCreator(config, npmPackage);
        const indexFile = indexFileCreator.generateDocument();

        fs.writeFileSync(path.join(fullInstancePath, 'index.html'), indexFile.documentElement.outerHTML);
    }

    #copyAssets({fullInstancePath}: {fullInstancePath: string}) {
        fs.cpSync(path.join(__dirname, '..', '..', 'assets'), path.join(fullInstancePath, 'assets'), { recursive: true });
    }

    #installNpmPackages({config, npmPackage}: {config: OpenMctConfiguration, npmPackage: NpmPackageManager}) {
        const nodePackages = config.getNodePlugins();
        npmPackage.install();
        nodePackages.forEach((nodePackage: OpenMctPlugin) => {
            npmPackage.installPackage(nodePackage.getInstallFunctionName());
        });
    }
}