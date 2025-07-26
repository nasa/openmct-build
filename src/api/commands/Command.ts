export default class Command {
    execute(verb: string, ...args: any[]) {
        if (this[verb as keyof typeof this] === undefined) {
            throw new Error(`Unknown verb: ${verb}`);
        }
        return (this[verb as keyof typeof this] as Function)(...args);
    }
}