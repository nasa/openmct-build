import { test, expect } from '@playwright/test';
import InstancesCommand from "./InstancesCommand";

test.describe('InstancesCommand', () => {
    ['list', 'info'].forEach((verb) => {
        test(`returns correct args for the ${verb} verb`, () => {
            expect(new InstancesCommand().getArgsForVerb(verb)).toEqual({
                options: {
                    instance: {
                        type: 'string',
                        short: 'i',
                        default: 'default',
                    }
                }
            });
        });
    });
});
