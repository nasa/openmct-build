import { substituteVariables, runtimeSubstitutions, getUserDefinedSubstitutions } from "./mct-builder-core.js";

export default async function installBuiltinPlugin({openmct, installFunction, installFunctionOptions, buildTimeSubstitutions}) {
    const userDefinedSubstitutions = getUserDefinedSubstitutions();
    const optionsWithSubstitutions = substituteVariables(installFunctionOptions, {
        ...buildTimeSubstitutions,
        ...userDefinedSubstitutions,
        ...runtimeSubstitutions
    });
    openmct.install(installFunction(optionsWithSubstitutions));
}