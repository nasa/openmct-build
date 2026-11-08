
type SubstitutionFunction = (originalProperty: string, regexResult: RegExpExecArray) => string | number;

declare module '../assets/mct-builder-core.js' {
    /**
     * Substitutes variables in the input object based on the provided variables
     * @param pluginOptions The input object to process
     * @param variables Key-value pairs of variables to substitute. If a function is defined, the function will be called to generate the substituted value
     *
     * Whole-string dynamic markers such as "${dynamic:${now} - ${two_hours}}" resolve
     * to a closure that re-evaluates the time expression on every call, instead of a
     * value frozen at install time. Only useful where the receiving code invokes
     * function values (eg. Open MCT conductor preset bounds).
     *
     * @returns The input object with variables substituted
     */
    export function substituteVariables<T = any>(pluginOptions: object, variables: Record<string, string | SubstitutionFunction>): T;

    /**
     * Parses a time expression and returns the corresponding epoch time
     * @param timeExpression Time expression to parse (e.g., '${now}' or '${now}+1000')
     * 
     * @returns The time in the JavaScript epoch (in ms) corresponding to the time expression
     */
    export function getEpochTime(timeExpression: string): number;

    /**
     * Loads a UMD module
     * @param src Source URL or path of the module to load
     */
    export function loadUmd(src: string): Promise<any>;
}