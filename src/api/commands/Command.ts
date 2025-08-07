export default class Command {
    execute(verb: string | undefined, ...args: any[]) {
        console.log(`Executing ${verb} with args ${JSON.stringify(args)}`);
        if (this[verb as keyof typeof this] === undefined) {
            throw new Error(`Unknown verb: ${verb}`);
        }
        return (this[verb as keyof typeof this] as Function)(...args);
    }
}