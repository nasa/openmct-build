#!/usr/bin/env npx tsx

import { parseArgs } from "util";
import Api from "../src/api/api";
import { DEFAULT_OPEN_MCT_VERSION } from "../src/constants";

const DEFAULT_INSTANCE = 'default';

/**
    mct-cli plugins list
    mct-cli plugins install @openmct/openmct-yamcs
    mct-cli plugins install @openmct/openmct-mcws
    mct-cli plugins install @openmct/openmct-yamcs --instance something-other-than-default
    mct-cli plugins install @openmct/openmct-yamcs --instance something-other-than-default --configPath ./path/to/config.yaml
 */

function main() {
    const api = new Api();
    const args = parseArgs({
        options: {
            instance: {
                type: 'string',
                short: 'i',
                default: DEFAULT_INSTANCE,
            },
            recipe: {
                type: 'string',
                short: 'r',
                default: undefined,
            },
            pluginOptions: {
                type: 'string',
                short: 'o',
                default: undefined,
            },
            version: {
                type: 'string',
                short: 'v',
                default: undefined,
            }
        },
        allowPositionals: true
    });
    const [noun, verb, name] = args.positionals;
    console.log(`noun: ${noun}, verb: ${verb}, name: ${name}, instance: ${args.values.instance}, recipe: ${args.values.recipe}, pluginOptions: ${args.values.pluginOptions}, version: ${args.values.version}`);
    const command = api.getCommandForNoun(noun);
    command.execute(verb, name, args.values);
}

main();
