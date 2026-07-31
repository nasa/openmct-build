import Api from '../api/api';
import { test, expect } from '../test/fixtures';
import BuildCommand from './BuildCommand';
import InstancesCommand from "./InstancesCommand";
import { captureStdOut } from './TestUtils';

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
    test.describe('verb actions', () => {
        let api:Api;
        let buildCommand:BuildCommand;
        let instancesCommand:InstancesCommand;

        test.beforeEach(async () => {
            api = new Api();
            buildCommand = api.getCommandForNoun('build') as BuildCommand;
            instancesCommand = api.getCommandForNoun('instances') as InstancesCommand;

            await buildCommand.execute(undefined, undefined, {instance: 'first'});
            await buildCommand.execute(undefined, undefined, {instance: 'second'});
        });
        test(`Correctly lists the installed instances`, async () => {
            const outputOfListCommand = await captureStdOut(() =>
                 instancesCommand.execute('list')
            );
            expect(outputOfListCommand).toContain(`first (version 'latest') at`);
            expect(outputOfListCommand).toContain(`second (version 'latest') at`);
        });
        test(`correctly lists information about installed instance`, async () => {
            const outputOfInfoCommand = (await captureStdOut(() =>
                 instancesCommand.execute('info', 'first')
            )).replaceAll(/\s/g, '');
            expect(outputOfInfoCommand).toContain(`name:first`);
            expect(outputOfInfoCommand).toContain(`plugins: 
                - mct-bootstrap-plugin
                - openmct.plugins.Espresso
                - openmct.plugins.MyItems
                - openmct.plugins.LocalStorage
                - openmct.plugins.UTCTimeSystem
                - openmct.plugins.PlanLayout
                - openmct.plugins.DisplayLayout
                - openmct.plugins.Conductor
            `.replaceAll(/\s/g, ''));

        });
    });
});
