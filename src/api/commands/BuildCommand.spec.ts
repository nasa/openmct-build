import path from "path";
import fs from "fs";
import Api from "../api";
import BuildCommand from "./BuildCommand";
import { randomUUID } from "crypto";

const MCT_BUILD_API_INSTANCE_PATH = process.env.MCT_BUILD_API_INSTANCE_PATH!;

describe('BuildCommand', () => {
    let api:Api;
    let buildCommand:BuildCommand;

    beforeEach(() => {
        if (!fs.existsSync(MCT_BUILD_API_INSTANCE_PATH)) {
            fs.mkdirSync(MCT_BUILD_API_INSTANCE_PATH, { recursive: true });
        }

        api = new Api();
        buildCommand = api.getCommandForNoun('build') as BuildCommand;
    });

    afterEach(() => {
        fs.rmSync(MCT_BUILD_API_INSTANCE_PATH, {recursive: true});
    });

    it('Does not throw', () => {
        expect(() => buildCommand.execute(undefined, undefined, {instance: 'default'})).not.toThrow();
    });

    it('builds entirely new instance if it does not already exist', async () => {
        const instanceName:string = randomUUID();
        const fullInstancePath = path.join(MCT_BUILD_API_INSTANCE_PATH, instanceName);
        expect(fs.existsSync(fullInstancePath)).toBe(false);
        await buildCommand.execute(undefined, undefined, {instance: instanceName});
        expect(fs.existsSync(fullInstancePath)).toBe(true);
        expect(fs.existsSync(path.join(fullInstancePath, 'index.html'))).toBe(true);
        
        fs.rmSync(fullInstancePath, {recursive: true});
    });
});