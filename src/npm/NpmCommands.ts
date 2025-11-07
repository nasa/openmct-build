import * as child_process from 'child_process';

export function view(packageName: string, field: string, cwd: string = './'): string {
    const resolvedPackageDetails: child_process.SpawnSyncReturns<string> = child_process.spawnSync('npm', ['view', packageName, field], { cwd, encoding: 'utf-8' });
    return resolvedPackageDetails.stdout?.trim();
}