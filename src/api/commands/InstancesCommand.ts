import fs from 'fs';
import Command from "./Command";
import { INSTANCE_PATH } from "../../openmct/OpenMctConfiguration";
import path from 'path';
import OpenMctInstance from '../../openmct/OpenMctInstance';
import MctYamlConfigurator from '../../yaml/MctYamlConfigurator';

export default class InstancesCommand extends Command {
    getUsageForVerb(): string {
        return 'Usage: mct instances';
    }
    async list() {
        const instances = fs.readdirSync(INSTANCE_PATH);
        return Promise.all(instances.map(async (dir:string) => {
            const configurator = new MctYamlConfigurator();
            const config = await configurator.resolveConfiguration({instance: dir});
            const instance = new OpenMctInstance({name: dir, path: path.join(INSTANCE_PATH, dir), config});
            return instance;
        }));

    }
}