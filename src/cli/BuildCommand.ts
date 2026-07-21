import Command from "./Command";
import { ParseArgsConfig } from "util";
import Build from "../api/Build";
import OpenMctInstance from "../openmct/OpenMctInstance";

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
                },
                legacyPeerDeps: {
                    type: 'boolean',
                    default: undefined,
                },
            }
        };

        return {
            options: {
                ...super.getArgsForVerb(verb).options,
                ...additionalArgs.options
        }};
    }

    getUsageForVerb(): string {
        return 'Usage: mct build [--instance <instance-name>] [--recipe <recipe-name>] [--version <version>] [--npm-package <npm-package-name>] [--legacy-peer-deps]';
    }

    async execute(verb: undefined, name: undefined, {instance, recipe, version, npmPackage, legacyPeerDeps}: {instance: string, recipe?: string, version?: string, npmPackage?: string, legacyPeerDeps?: boolean}) {
        let buildMessage = `Building ${instance} instance`;
        if (recipe !== undefined) {
            buildMessage += ` with recipe ${recipe}`;
        }
        if (version !== undefined) {
            buildMessage += ` and Open MCT version ${version}`;
        }
        if (npmPackage !== undefined) {
            buildMessage += ` and Open MCT npm package ${npmPackage}`;
        }
        if (legacyPeerDeps) {
            buildMessage += ' with legacy peer deps';
        }
        console.log(buildMessage);
        const result:OpenMctInstance = await this.#buildApi.execute(verb, name, {instance, recipe, version, npmPackage, legacyPeerDeps});
        console.log(result?.toStringDetailed());
        return result;
    }
}