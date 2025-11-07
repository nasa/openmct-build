import fs from 'fs';
import Command from "./Command";
import { INSTANCE_PATH } from "../openmct/OpenMctConfiguration";
import path from 'path';
import OpenMctInstance from '../openmct/OpenMctInstance';
import MctYamlConfigurator from '../yaml/MctYamlConfigurator';
import InvalidApiCallError from '../api/InvalidApiCallError';
import Instances from '../api/Instances';

export default class InstancesCommand extends Command {
    #instancesApi:Instances;
    constructor() {
        super();
        this.#instancesApi = new Instances();
    }
    getUsageForVerb(verb:string): string {
        switch (verb) {
            case 'list':
                return 'Usage: mct instances list';
            case 'info':
                return 'Usage: mct instances info <instance name>';
            default:
                return 'Usage: mct instances <list|info>';
        }
    }
    async list() {
        return this.#instancesApi.list();
    }

    async info(instanceName:string) {
        const instance = await this.#instancesApi.info(instanceName);
        console.log(instance.toStringDetailed());
    }
}