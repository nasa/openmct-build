#!/usr/bin/env npx tsx

import { parseArgs } from "util";
import Api from "../src/api/api";
import { DEFAULT_INSTANCE } from "../src/constants";
import Command from "../src/cli/Command";
import InvalidApiCallError from "../src/api/InvalidApiCallError";

async function main() {
    const api = new Api();

    let args = parseArgs({
        allowPositionals: true,
        strict: false,
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
            version: {
                type: 'string',
                short: 'v',
                default: undefined,
            },
            enabled: {
                type: 'boolean',
                short: 'e',
                default: undefined,
            },
            npmPackage: {
                type: 'string',
                short: 'p',
                default: undefined,
            },
            options: {
                type: 'string',
                short: 'o',
                default: undefined,
            },
            available: {
                type: 'boolean',
                short: 'a',
                default: false,
            }
        }
    });
    const [noun, verb, name] = args.positionals;
    let command: Command;
    try {
        command = api.getCommandForNoun(noun);
    } catch (e: any) {
        console.error(e.message);
        process.exit(1);
    }

    const argsForVerb = command.getArgsForVerb(verb);


    try {
        args = parseArgs({
            allowPositionals: true,
            strict: true,
            ...argsForVerb
        });
        await command.execute(verb, name, args.values);
        process.exit(0);
    } catch (e: any) {
        if (e instanceof InvalidApiCallError) {
            console.error(e.message);
            console.info(command.getUsageForVerb(verb));
        } else {
            if (Reflect.has(e, 'code') && e.code === 'ERR_PARSE_ARGS_INVALID_OPTION_VALUE') {
                console.error(e.message);
                console.info(command.getUsageForVerb(verb));
            } else {
                console.error(`An error occurred while executing this command: ${e.message}`);
            }
        }
        process.exit(1);
    }
}

main();
