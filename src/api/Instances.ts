import fs from 'fs';
import { INSTANCE_PATH } from "../openmct/OpenMctConfiguration";
import path from 'path';
import OpenMctInstance from '../openmct/OpenMctInstance';
import MctYamlConfigurator from '../yaml/MctYamlConfigurator';
import InvalidApiCallError from './InvalidApiCallError';

export default class Instances {
    async list() {
        const instances = fs.readdirSync(INSTANCE_PATH);
        return Promise.all(instances.map(async (dir:string) => {
            const configurator = new MctYamlConfigurator();
            const config = await configurator.resolveConfiguration({instance: dir});
            const instance = new OpenMctInstance({name: dir, path: path.join(INSTANCE_PATH, dir), config});
            return instance;
        }));

    }

    async info(instanceName:string) {
        const configurator = new MctYamlConfigurator();
        if (!configurator.exists(instanceName)) {
            throw new InvalidApiCallError(`Instance ${instanceName} does not exist`);
        }
        const config = await configurator.resolveConfiguration({instance: instanceName});
        const instance = new OpenMctInstance({name: instanceName, path: path.join(INSTANCE_PATH, instanceName), config});
        return instance;
    }
}