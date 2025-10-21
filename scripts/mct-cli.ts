#!/usr/bin/env npx tsx

import { parseArgs } from "util";
import Api from "../src/api/api";
import Command from "../src/api/commands/Command";

function main() {
    const api = new Api();

    let args = parseArgs({
        args: process.argv.slice(2),
        allowPositionals: true,
        strict: false,
        ...Command.getDefaultArgs()
    });
    const [noun, verb, name] = args.positionals;
    const command = api.getCommandForNoun(noun);
    const argsForVerb = command.getArgsForVerb(verb);
    args = parseArgs({
        args: process.argv.slice(2),
        allowPositionals: true,
        strict: true,
        ...argsForVerb
    });
    command.execute(verb, name, args.values);
}

main();
