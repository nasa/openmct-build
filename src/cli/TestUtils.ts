/**
 * Captures everything written to this process's stdout (console.log, console.info,
 * direct process.stdout.write calls) while `during` runs. Output still reaches the
 * real stdout; this just tees it into the returned string.
 */
export async function captureStdOut(during: () => Promise<unknown>): Promise<string> {
    const chunks: string[] = [];
    const originalWrite = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string | Uint8Array, ...args: any[]) => {
        chunks.push(chunk.toString());
        return originalWrite(chunk, ...args);
    }) as typeof process.stdout.write;

    try {
        await during();
    } finally {
        process.stdout.write = originalWrite;
    }

    return chunks.join('');
}