import Command from "./Command";
import path from "path";
import * as fs from 'fs';
import MctYamlConfigurator from "../../yaml/MctYamlConfigurator";
import IndexFileCreator from "../../html/IndexFileCreator";
import OpenMctConfiguration, { INSTANCE_PATH, CONFIGURATION_YAML } from "../../openmct/OpenMctConfiguration";
import NpmPackageManager from "../../npm/NpmPackageManager";
import OpenMctPlugin from "../../openmct/OpenMctPlugin";

export default class BuildCommand extends Command {
    execute(verb: undefined, name: undefined, {instance}: {instance: string}) {
        const fullInstancePath = path.join(INSTANCE_PATH, instance);
        const configPath = path.join(fullInstancePath, CONFIGURATION_YAML);
        const configurator = new MctYamlConfigurator();

        let config: OpenMctConfiguration = this.#getConfiguration({configPath, fullInstancePath, configurator});
        const npmPackage = NpmPackageManager.getNodePackageManagerForInstance({fullInstancePath, config});
        
        this.#installNpmPackages({config, npmPackage});
        this.#generateHtmlDocument({config, fullInstancePath, npmPackage});
    }

    #getConfiguration({configPath, fullInstancePath, configurator}: {configPath: string, fullInstancePath: string, configurator: MctYamlConfigurator}):OpenMctConfiguration {
        let config: OpenMctConfiguration;

        if (fs.existsSync(configPath)) {
            const configString = fs.readFileSync(configPath, 'utf-8');
            config = configurator.loadFromYaml(configString);
        } else {
            fs.mkdirSync(fullInstancePath, { recursive: true });
            config = new OpenMctConfiguration(configurator.loadDefaultConfiguration());
        }

        return config;

    }

    #generateHtmlDocument({config, fullInstancePath, npmPackage}: {config: OpenMctConfiguration, fullInstancePath: string, npmPackage: NpmPackageManager}) {
        const indexFileCreator = new IndexFileCreator(config, npmPackage);
        const indexFile = indexFileCreator.generateDocument();

        fs.writeFileSync(path.join(fullInstancePath, 'index.html'), indexFile.documentElement.outerHTML);
    }

    #installNpmPackages({config, npmPackage}: {config: OpenMctConfiguration, npmPackage: NpmPackageManager}) {
        const nodePackages = config.getNodePlugins();
        nodePackages.forEach((nodePackage: OpenMctPlugin) => {
            npmPackage.installPackage(nodePackage.getInstallFunctionName());
        });
    }
}