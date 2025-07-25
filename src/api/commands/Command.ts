export default class Command {
    execute(verb: string, ...args: any[]) {
        const inherited = this.constructor;
        if (!inherited.hasOwnProperty(verb)) {
            throw new Error(`Unknown verb: ${verb}`);
        }
        return (inherited[verb as keyof typeof inherited] as Function)(...args);
    }
}