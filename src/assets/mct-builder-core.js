const savedModule = window.module;
const savedExports = window.savedExports;

export function substituteVariables(input, variables) {
    if (input === undefined || variables === undefined) {
        return undefined;
    }
    return JSON.parse(JSON.stringify(input, (instanceConfigurationKey, instanceConfigurationValue) => {
        let result = instanceConfigurationValue;

        if (typeof instanceConfigurationValue === 'string') {
            for (const [replacementVariableKey, replacementVariableValue] of Object.entries(variables)) {
                if (replacementVariableKey.startsWith('/')) {
                    const regex = new RegExp(replacementVariableKey.slice(1, replacementVariableKey.length - 1));
                    if (regex.test(result)) {
                        if (typeof replacementVariableValue  === 'function') {
                            result = replacementVariableValue(result, regex.exec(result));
                        }
                    }
                } else if (result.includes(replacementVariableKey)){
                    result = result.replaceAll(replacementVariableKey, replacementVariableValue);
                }
            }
        }

        return result;
    }));
}

// gives plugins the ability to register runtime substitutions, 
// while protecting existing substitutions object from modification
function registerRuntimeSubstitution(key, value) {
    const token = `\${${key}}`;
    const escaped = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regexKey = `/${escaped}/`;

    runtimeSubstitutions[regexKey] = (original) => original.replaceAll(token, value);
}

// add install helper to allow plugins to optionally register runtime substitutions
// as well as support array syntax for install functions (ex: Notebooks, ClearData, etc)
export function callInstallFunction(installFunction, options, { enableRegistration = false } = {}) {
    if (Array.isArray(options)) {
        return installFunction(...options);
    }
    return enableRegistration
        ? installFunction(options, { registerRuntimeSubstitution })
        : installFunction(options);
  }

export async function loadUmd(src) {
    const mockExports = {};
    const mockModule = {exports: mockExports};

    window.module = mockModule;
    window.exports = mockExports;

    try {
        await import(src);
        const exports = window.module?.exports || window.exports;

        return exports;
    } finally {
        if (savedExports === undefined) {
            delete window.exports;
        } else {
            window.exports = savedExports;
        }
        
        if (savedModule === undefined) {
            delete window.module;
        } else {
            window.module = savedModule;
        }  
    }
}
const timeMathSubstitutionsInternal = {
    '\\d{4}[-/]\\d{2}[-/]\\d{2}.*': (input) => {
        //Does it look like a date? Try and parse it as one.
        const date = new Date(input);
        if (!isNaN(date.getTime())) {
            return date.getTime();
        }
        return input;
    },
    'now': () => {
        return Date.now();
    },
    'five_seconds': 5000,
    'ten_seconds': 10000,
    'fifteen_seconds': 15000,
    'thirty_seconds': 30000,
    'one_minute': 60000,
    'five_minutes': 300000,
    'ten_minutes': 600000,
    'fifteen_minutes': 900000,
    'thirty_minutes': 1800000,
    'one_hour': 3600000,
    'two_hours': 7200000,
    'one_day': 86400000,
    'one_week': 604800000,
    'one_month': 2592000000,
    'one_year': 31536000000,
    'two_years': 63072000000,
    'five_years': 157680000000,
    'ten_years': 315360000000
}
const timeMathSubstitutionsInternalKeys = Object.keys(timeMathSubstitutionsInternal);
const joined = timeMathSubstitutionsInternalKeys.join('|');
const regex = `/\\\${(${joined})}/`;
const compiledRegex = new RegExp(regex.slice(1, regex.length - 1), 'g');
const runtimeSubstitutionsInternal = {};
runtimeSubstitutionsInternal[regex] = (originalProperty) => {
    return getEpochTime(originalProperty);
};

export const runtimeSubstitutions = runtimeSubstitutionsInternal;
export const timeMathSubstitutions = timeMathSubstitutionsInternal;

export function getEpochTime(timeExpression) {
    timeExpression = timeExpression.replaceAll(compiledRegex, (match, p1) => {
        const matchingTimeSubstitutionKey = timeMathSubstitutionsInternalKeys.find(key => p1.match(key));
        if (matchingTimeSubstitutionKey === undefined) { 
            return match;
        }
            
        const timeSubstitution = timeMathSubstitutionsInternal[matchingTimeSubstitutionKey];
        if (typeof timeSubstitution === 'function') {
            return timeSubstitution(p1);
        } else {
            return timeSubstitution;
        }
    });
    return parseSimpleTimeMath(timeExpression);
}

const simpleTimeMathRegex = /^(\d+)?\s*([-+]?\s*\d+)?$/;
function parseSimpleTimeMath(timeExpression) {
    const match = simpleTimeMathRegex.exec(timeExpression);
    if (match) {
        return match.slice(1).reduce((acc, val) => { 
            if (val === undefined) {
                return acc;
            } else {
                return acc + parseInt(val.replaceAll(' ', '')) || 0;
            }
        }, 0);
    }
}