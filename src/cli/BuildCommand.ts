import Command from "./Command";
import { ParseArgsConfig } from "util";
import Build from "../api/Build";

export default class BuildCommand extends Command {
    #buildApi:Build;

    constructor() {
        super();
        this.#buildApi = new Build();
    }

    getArgsForVerb(verb: string): ParseArgsConfig {
        const additionalArgs:ParseArgsConfig = {
            options: {
                npmPackage: {
                        type: 'string',
                        short: 'p',
                        default: undefined,
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
                }
            }
        };

        return {
            options: {
                ...super.getArgsForVerb(verb).options,
                ...additionalArgs.options
        }};
    }

    getUsageForVerb(): string {
        return 'Usage: mct build [--instance <instance-name>] [--recipe <recipe-name>] [--version <version>] [--npm-package <npm-package-name>]';
    }

    async execute(verb: undefined, name: undefined, {instance, recipe, version, npmPackage}: {instance: string, recipe?: string, version?: string, npmPackage?: string}) {
        let buildMessage = `Build ${instance}`;
        if (recipe !== undefined) {
            buildMessage += ` with recipe ${recipe}`;
        }
        if (version !== undefined) {
            buildMessage += ` and Open MCT version ${version}`;
        }
        if (npmPackage !== undefined) {
            buildMessage += ` and Open MCT npm package ${npmPackage}`;
        }
        console.log(buildMessage);
        return this.#buildApi.execute(verb, name, {instance, recipe, version, npmPackage});
    }
}