import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';

// The asset is browser ESM inside a CommonJS package, so node cannot import
// it directly. Load the exact shipped bytes with only the module syntax
// adapted (the same transform a bundler performs) and execute them.
const EXPECTED_CORE_EXPORTS = [
    'substituteVariables',
    'callInstallFunction',
    'loadUmd',
    'runtimeSubstitutions',
    'timeMathSubstitutions',
    'getEpochTime'
];

function loadCoreAsset(): {
    substituteVariables: (input: any, variables: any) => any;
    runtimeSubstitutions: Record<string, any>;
    getEpochTime: (expr: string) => number;
} {
    const assetPath = path.join(__dirname, 'mct-builder-core.js');
    const source = fs.readFileSync(assetPath, 'utf-8');

    const declaredExports = [...source.matchAll(/^export (?:async )?function (\w+)|^export const (\w+) ?=/gm)].map(
        (match) => match[1] ?? match[2]
    );
    expect(declaredExports.sort()).toEqual([...EXPECTED_CORE_EXPORTS].sort());

    const adapted = source.replace(/^export /gm, '');
    const factory = new Function(
        'window',
        `${adapted}\nreturn { ${EXPECTED_CORE_EXPORTS.join(', ')} };`
    );
    return factory({});
}

// Copy of substituteVariables as it existed before the recursive-walk
// rewrite (JSON round-trip). Used only to prove the rewrite preserves
// behavior on every input the old code could handle.
function legacySubstituteVariables(input: any, variables: any): any {
    if (input === undefined || variables === undefined) {
        return undefined;
    }
    return JSON.parse(JSON.stringify(input, (_key: string, value: any) => {
        let result = value;

        if (typeof value === 'string') {
            for (const [replacementVariableKey, replacementVariableValue] of Object.entries(variables) as Array<[string, any]>) {
                if (replacementVariableKey.startsWith('/')) {
                    const regex = new RegExp(replacementVariableKey.slice(1, replacementVariableKey.length - 1));
                    if (regex.test(result)) {
                        if (typeof replacementVariableValue === 'function') {
                            result = replacementVariableValue(result, regex.exec(result));
                        }
                    }
                } else if (result.includes(replacementVariableKey)) {
                    result = result.replaceAll(replacementVariableKey, replacementVariableValue);
                }
            }
        }

        return result;
    }));
}

test.describe('mct-builder-core substituteVariables', () => {
    let substituteVariables: (input: any, variables: any) => any;
    let runtimeSubstitutions: Record<string, any>;
    let getEpochTime: (expr: string) => number;

    test.beforeAll(async () => {
        const core = loadCoreAsset();
        substituteVariables = core.substituteVariables;
        runtimeSubstitutions = core.runtimeSubstitutions;
        getEpochTime = core.getEpochTime;
    });

    test('returns undefined for undefined input or variables', () => {
        expect(substituteVariables(undefined, {})).toBeUndefined();
        expect(substituteVariables({}, undefined)).toBeUndefined();
    });

    test('replaces literal variables in nested objects and arrays', () => {
        const input = {
            path: '${pluginContextPath}/icon.png',
            nested: { list: ['a-${pluginContextPath}', 42, true, null] }
        };
        const variables = { '${pluginContextPath}': 'node_modules/my-plugin' };

        expect(substituteVariables(input, variables)).toEqual({
            path: 'node_modules/my-plugin/icon.png',
            nested: { list: ['a-node_modules/my-plugin', 42, true, null] }
        });
    });

    test('resolves time-math expressions to epoch numbers', () => {
        const variables = { ...runtimeSubstitutions };
        const before = Date.now();
        const result = substituteVariables(
            {
                start: '-${thirty_minutes}',
                end: '${thirty_seconds}',
                hour: '-${one_hour}',
                since: '${now} - ${thirty_minutes}',
                now: '${now}'
            },
            variables
        );
        const after = Date.now();

        expect(result.start).toBe(-1800000);
        expect(result.end).toBe(30000);
        expect(result.hour).toBe(-3600000);
        expect(result.since).toBeGreaterThanOrEqual(before - 1800000);
        expect(result.since).toBeLessThanOrEqual(after - 1800000);
        expect(result.now).toBeGreaterThanOrEqual(before);
        expect(result.now).toBeLessThanOrEqual(after);
    });

    test('drops keys that resolve to undefined, like the JSON round-trip did', () => {
        const variables = {
            '/no-match-possible-xyz/': () => undefined as any
        };
        const result = substituteVariables({ keep: 'yes', drop: 'no-match-possible-xyz' }, variables);

        expect(result).toEqual({ keep: 'yes' });
    });

    test('matches the legacy implementation on representative inputs', () => {
        const variables = {
            '${pluginContextPath}': 'node_modules/my-plugin',
            ...runtimeSubstitutions
        };
        const inputs = [
            { a: 'plain' },
            { a: '${pluginContextPath}/x', b: ['y-${pluginContextPath}', 7, false, null] },
            { start: '-${thirty_minutes}', end: '${thirty_seconds}' },
            { deep: { deeper: [{ v: 'pre ${one_hour} post' }] } },
            '${now}',
            42,
            'no tokens here',
            { mixed: '-${five_minutes}', other: '${now} - ${one_day}' }
        ];

        for (const input of inputs) {
            // getEpochTime('${now}') advances between the two calls; compare
            // structurally by freezing Date.now for both.
            const frozenNow = 1790000000000;
            const realNow = Date.now;
            Date.now = () => frozenNow;
            try {
                expect(substituteVariables(input, variables)).toEqual(
                    legacySubstituteVariables(input, variables)
                );
            } finally {
                Date.now = realNow;
            }
        }
    });

    test('does not throw when a replacement yields a number mid-loop', () => {
        // The JSON implementation called .includes on the number result when a
        // literal key was enumerated after a number-producing regex, throwing
        // TypeError. The rewrite preserves the number instead.
        const variables = {
            '/^\\${num}/': () => 12345,
            '${other}': 'zzz'
        };

        expect(() => substituteVariables({ v: '${num}' }, variables)).not.toThrow();
        expect(substituteVariables({ v: '${num}' }, variables)).toEqual({ v: 12345 });
    });

    test.describe('dynamic markers', () => {
        test('whole-string marker resolves to a re-evaluated closure', () => {
            const result = substituteVariables(
                { start: '${dynamic:${now} - ${two_hours}}' },
                { ...runtimeSubstitutions }
            );

            expect(typeof result.start).toBe('function');

            const first = result.start();
            expect(first).toBeGreaterThan(Date.now() - 2 * 3600000 - 5000);
            expect(first).toBeLessThanOrEqual(Date.now() - 2 * 3600000 + 1000);
        });

        test('closure re-evaluates on every call', () => {
            const result = substituteVariables(
                { at: '${dynamic:${now}}' },
                { ...runtimeSubstitutions }
            );
            const frozenNow = 1790000000000;
            const realNow = Date.now;

            Date.now = () => frozenNow;
            const first = result.at();
            Date.now = () => frozenNow + 60000;
            const second = result.at();
            Date.now = realNow;

            expect(first).toBe(frozenNow);
            expect(second).toBe(frozenNow + 60000);
        });

        test('marker without time tokens resolves statically per call', () => {
            const result = substituteVariables(
                { offset: '${dynamic:-${one_hour}}' },
                { ...runtimeSubstitutions }
            );

            expect(typeof result.offset).toBe('function');
            expect(result.offset()).toBe(-3600000);
        });

        test('marker works with no other variables defined', () => {
            const result = substituteVariables({ v: '${dynamic:${thirty_seconds}}' }, {});

            expect(typeof result.v).toBe('function');
            expect(result.v()).toBe(30000);
        });

        test('partial embedding is not treated as a marker', () => {
            const result = substituteVariables(
                { v: 'prefix ${dynamic:${thirty_seconds}} suffix' },
                { ...runtimeSubstitutions }
            );

            // Falls back to eager substitution of the inner tokens.
            expect(typeof result.v).not.toBe('function');
        });

        test('invalid dynamic expressions resolve to undefined per call', () => {
            const result = substituteVariables({ v: '${dynamic:not a time}' }, {});

            expect(typeof result.v).toBe('function');
            expect(result.v()).toBeUndefined();
        });
    });
});
