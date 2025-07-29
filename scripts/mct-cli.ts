#!/usr/bin/env npx tsx

import { parseArgs } from "util";
import Api from "../src/api/api";

const DEFAULT_INSTANCE = 'default';

/**
    mct-cli plugins list
    mct-cli plugins install @openmct/openmct-yamcs
    mct-cli plugins install @openmct/openmct-mcws
    mct-cli plugins install @openmct/openmct-yamcs --instance something-other-than-default
 */

function main() {
    const api = new Api();
    const args = parseArgs({
        options: {
            instance: {
                type: 'string',
                default: DEFAULT_INSTANCE,
            },
        },
        allowPositionals: true
    });
    const [noun, verb, name] = args.positionals;
    console.log(`noun: ${noun}, verb: ${verb}, name: ${name}, instance: ${args.values.instance}`);
    const command = api.getCommandForNoun(noun);
    command.execute(verb, name, args.values);
}

main();
