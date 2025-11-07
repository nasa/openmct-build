import { DEFAULT_INSTANCE } from "../constants";
import { ParseArgsConfig } from "util";

export default class Command {
    getArgsForVerb(verb: string): ParseArgsConfig {
        return Command.getDefaultArgs();
    }
    getUsageForVerb(verb: string): string {
        throw new Error(`Usage for verb ${verb} not implemented`);
    }

    async execute(verb: string | undefined, ...args: any[]) {
        if (this[verb as keyof typeof this] === undefined) {
            throw new Error(`Unknown verb: ${verb}`);
        }
        return (this[verb as keyof typeof this] as Function)(...args);
    }

    static getDefaultArgs(): ParseArgsConfig {
        return {
            options: {
                instance: {
                    type: 'string',
                    short: 'i',
                    default: DEFAULT_INSTANCE,
                }
            }
        };
    }
}