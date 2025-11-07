export default class InvalidApiCallError extends Error {
    constructor(message: string) {
        super(message);
        this.name = 'InvalidApiCallError';
    }
}