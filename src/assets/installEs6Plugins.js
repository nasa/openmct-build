export default async function installEs6Plugins({openmct, importPath, installFunctionNames, installFunctionOptions}) {
    const imports = await import(importPath);
    if (installFunctionNames.length === 1) {
        const installFunctionName = Object.keys(imports)[0];
        const installFunctionOption = installFunctionOptions[0];
        const installFunction = imports[installFunctionName];
        openmct.install(installFunction(installFunctionOption));
    } else {
        const exportedFunctionMap = Object.keys(imports).reduce((map, key) => {
            map.set(key.toLowerCase(), imports[key]);
            return map;
        }, new Map());
        installFunctionNames.forEach((installFunctionName, index) => {
            const installFunction = exportedFunctionMap.get(installFunctionName.toLowerCase());
            const installFunctionOption = installFunctionOptions[index];
            openmct.install(installFunction(installFunctionOption));
        });
    }
}