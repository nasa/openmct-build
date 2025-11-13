export default async function installEs6Plugins({openmct, importPath, installFunctionNames, installFunctionOptions}) {
    const imports = await import(importPath);
    const exportedNames = Object.keys(imports);
    // If only one export, assume it is the install function. This simplifies things for the 90% case of a single default export
    if (exportedNames.length === 1) {
        const installFunctionName = exportedNames[0];
        const installFunctionOption = installFunctionOptions[0];
        const installFunction = imports[installFunctionName];
        openmct.install(installFunction(installFunctionOption));
    } else {
        const exportedFunctionMap = Object.keys(imports).reduce((map, key) => {
            map.set(key.toLowerCase().replaceAll(/[^a-z0-9]/g, ''), imports[key]);
            return map;
        }, new Map());
        installFunctionNames.forEach((installFunctionName, index) => {
            const installFunction = exportedFunctionMap.get(installFunctionName.toLowerCase().replaceAll(/[^a-z0-9]/g, ''));
            const installFunctionOption = installFunctionOptions[index];
            openmct.install(installFunction(installFunctionOption));
        });
    }
}