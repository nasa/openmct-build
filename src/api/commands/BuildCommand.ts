import Command from "./Command";
import path from "path";
import * as fs from 'fs';
import MctYamlConfigurator from "../../yaml/MctYamlConfigurator";
import IndexFileCreator from "../../html/IndexFileCreator";
import OpenMctConfiguration, { INSTANCE_PATH, CONFIGURATION_YAML } from "../../openmct/OpenMctConfiguration";

export default class BuildCommand extends Command {
    execute(verb: undefined, name: undefined, {instance}: {instance: string}) {
        const fullInstancePath = path.join(__dirname, INSTANCE_PATH, instance);
        const configPath = path.join(fullInstancePath, CONFIGURATION_YAML);
        const configurator = new MctYamlConfigurator();
        let config: OpenMctConfiguration;

        if (fs.existsSync(configPath)) {
            const configString = fs.readFileSync(configPath, 'utf-8');
            config = configurator.loadFromYaml(configString);
        } else {
            fs.mkdirSync(fullInstancePath, { recursive: true });
            config = new OpenMctConfiguration(configurator.loadDefaultConfiguration());
        }

        const indexFileCreator = new IndexFileCreator(config);
        const indexFile = indexFileCreator.generateDocument();

        fs.writeFileSync(path.join(fullInstancePath, 'index.html'), indexFile.documentElement.innerHTML);
    }
}