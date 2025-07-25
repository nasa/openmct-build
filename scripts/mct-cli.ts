#!/usr/bin/env npx tsx

import path from "path";
import MctYamlConfigurator from "../src/yaml/MctYamlConfigurator";
import IndexFileCreator from "../src/html/IndexFileCreator";
import * as fs from 'fs';
import { parseArgs } from "util";
import Api from "../src/api/api";

const INSTANCE_PATH = '../instances';
const DEAULT_INSTANCE = 'default';
const DEFAULT_CONFIG_FILE = 'example.yaml';

/**
    mct-cli plugins list
    mct-cli plugins install @openmct/openmct-yamcs
    mct-cli plugins install @openmct/openmct-mcws
    mct-cli plugins install @openmct/openmct-yamcs --instance something-other-than-default
 */

function build(instance: string) {
    const fullInstancePath = path.join(__dirname, INSTANCE_PATH, instance);
    const configPath = path.join(fullInstancePath, DEFAULT_CONFIG_FILE);
    const configString = fs.readFileSync(configPath, 'utf-8');
    const configurator = new MctYamlConfigurator();
    const config = configurator.loadFromYaml(configString);
    const indexFileCreator = new IndexFileCreator(config);
    const indexFile = indexFileCreator.generateDocument();
    fs.writeFileSync(path.join(fullInstancePath, 'index.html'), indexFile.documentElement.innerHTML);
}

function main() {
    const args = parseArgs({
        options: {
            instance: {
                type: 'string',
                default: DEAULT_INSTANCE,
            },
        },
        allowPositionals: true
    });
    const [noun, verb, name] = args.positionals;
    console.log(`noun: ${noun}, verb: ${verb}, name: ${name}, instance: ${args.values.instance}`);
    const command = Api.getCommandForNoun(noun);
    command.execute(verb, name, args.values);
    build(args.values.instance);
}

main();
