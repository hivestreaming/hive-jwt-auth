#!/usr/bin/env node

import { inspect } from 'util';
import Yargs, { ArgumentsCamelCase } from 'yargs';
import {
    checkPartnerToken,
    checkExpiration,
    checkExpiresIn,
    checkEndpoint
} from '../utils/validation';
import HiveKeyPair from '../lib/HiveKeyPair';
import HiveJwtCreator from '../lib/HiveJwtCreator';
import HivePublicKeyServiceClient from '../lib/HivePublicKeyServiceClient';

const { HIVE_PARTNER_TOKEN } = process.env;

const createHandler = <U>(handler: (args: ArgumentsCamelCase<U>) => void | Promise<void>): typeof handler => {
    return async (args: ArgumentsCamelCase<U>) => {
        try {
            await handler(args);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    };
}

type NewKeyArguments = {
    file: string;
}

type PublishKeyArguments = {
    file: string;
    partnerId: string;
    keyId: string;
    expiration: string;
    endpoint: string;
}

type ListKeysArguments = {
    partnerId: string;
    endpoint: string;
    includeDeleted: boolean;
}

type GetKeyArguments = {
    partnerId: string;
    keyId: string;
    endpoint: string;
}

type DeleteKeyArguments = {
    partnerId: string;
    keyId: string;
    endpoint: string;
}

type CreateJwtArguments = {
    file: string;
    partnerId: string;
    customerId: string;
    keyId: string;
    expiresIn: string;
    videoId: string;
    manifest: string[];
    eventName?: string;
    regexes?: string[];
}

type ReportingUrlArguments = {
    file: string;
    partnerId: string;
    customerId: string;
    keyId: string;
    expiresIn: string;
    videoId: string;
    endpoint: string;
}

const cli = Yargs(process.argv.slice(2))
    .command({
        command: 'create-key',
        describe: 'Create a new private key',
        builder: (yargs) => {
            return yargs.option('file', {
                describe: 'File to save PEM-encoded private key',
                alias: 'f',
                type: 'string',
                required: true
            })
        },
        handler: createHandler(async (argv: ArgumentsCamelCase<NewKeyArguments>) => {
            const { file } = argv;
            const keyPair = await HiveKeyPair.create();
            await keyPair.writePrivateKey(file);
            console.log(`Saved private key to file: ${file}`);
        })
    })
    .command({
        command: 'create-jwt',
        describe: 'Create a new signed JWT',
        builder: (yargs) => {
            return yargs
            .option('file', {
                describe: 'File to read PEM-encoded private key',
                alias: 'f',
                type: 'string',
                required: true
            }).option('partnerId', {
                describe: 'Partner Id',
                alias: 'p',
                type: 'string',
                required: true
            }).option('customerId', {
                describe: 'Customer Id',
                alias: 'c',
                type: 'string',
                required: true
            }).option('keyId', {
                describe: 'Key Id',
                alias: 'k',
                type: 'string',
                required: true
            })
            .option('videoId', {
                describe: 'Video Id',
                alias: 'v',
                type: 'string',
                required: true
            })
            .option('manifest', {
                describe: 'Manifest',
                type: 'string',
                alias: 'm',
                array: true,
                required: true,
                default: []
            }).option('expiresIn', {
                describe: 'Expiration, as either (a) number of seconds or (b) a duration string, eg. "3 days"',
                alias: 'x',
                type: 'string',
                required: true
            }).option('eventName', {
                describe: 'Event name',
                alias: 'n',
                type: 'string',
                required: false
            }).option('regexes', {
                describe: 'Array of regexes',
                alias: 'r',
                type: 'string',
                array: true,
                required: false
            }).check((argv) => {
                checkExpiresIn(argv.expiresIn);
                return argv;
            });
        },
        handler: createHandler(async (argv: ArgumentsCamelCase<CreateJwtArguments>) => {
            const { partnerId, file, keyId, customerId, videoId, manifest, expiresIn, eventName, regexes } = argv;
            const jwtCreator = await HiveJwtCreator.create(partnerId, file);
            const jwt = jwtCreator.sign(keyId, customerId, videoId, manifest, expiresIn, eventName, regexes)
            console.log(jwt);
        })
    })
    .command({
        command: 'reporting-url',
        describe: 'Display a URL to Hive Video Monitor',
        builder: (yargs) => {
            return yargs
            .option('file', {
                describe: 'File to read PEM-encoded private key',
                alias: 'f',
                type: 'string',
                required: true
            }).option('partnerId', {
                describe: 'Partner Id',
                alias: 'p',
                type: 'string',
                required: true
            }).option('customerId', {
                describe: 'Customer Id',
                alias: 'c',
                type: 'string',
                required: true
            }).option('keyId', {
                describe: 'Key Id',
                alias: 'k',
                type: 'string',
                required: true
            })
            .option('videoId', {
                describe: 'Video Id',
                alias: 'v',
                type: 'string',
                required: true
            })
            .option('endpoint', {
                describe: 'Endpoint where to publish key',
                alias: 'e',
                type: 'string',
                choices: ['test', 'prod'],
                default: 'test'
            }).option('expiresIn', {
                describe: 'Expiration, as either (a) number of seconds or (b) a duration string, eg. "3 days"',
                alias: 'x',
                type: 'string',
                required: true
            }).check((argv) => {
                checkExpiresIn(argv.expiresIn);
                checkEndpoint(argv.endpoint);
                return argv;
            });
        },
        handler: createHandler(async (argv: ArgumentsCamelCase<ReportingUrlArguments>) => {
            const { partnerId, file, keyId, customerId, videoId, endpoint, expiresIn } = argv;
            const exp = checkExpiresIn(expiresIn);
            const jwtCreator = await HiveJwtCreator.create(partnerId, file);
            const url = jwtCreator.signReporting(keyId, customerId, videoId, exp, checkEndpoint(endpoint))
            console.log(url);
        })
    });

cli.command({
        command: 'list-keys',
        describe: 'List public keys on Hive API',
        builder: (yargs) => {
            return yargs.option('partnerId', {
                describe: 'Partner Id',
                alias: 'p',
                type: 'string',
                required: true
            }).option('endpoint', {
                describe: 'Endpoint where to publish key',
                alias: 'e',
                type: 'string',
                choices: ['test', 'prod'],
                default: 'test'
            }).option('includeDeleted', {
                describe: 'Include deleted keys in list response',
                alias: 'd',
                type: 'boolean',
                default: false
            }).check((argv) => {
                const { endpoint } = argv;
                checkEndpoint(endpoint);
                checkPartnerToken(HIVE_PARTNER_TOKEN);
                return argv;
            });
        },
        handler: createHandler(async (argv: ArgumentsCamelCase<ListKeysArguments>) => {
            const { endpoint, partnerId, includeDeleted } = argv;
            const client = new HivePublicKeyServiceClient(partnerId, HIVE_PARTNER_TOKEN!, checkEndpoint(endpoint));
            const keys = await client.list(includeDeleted);
            console.log(inspect(keys, undefined, undefined, true));
        })
    })
    .command({
        command: 'get-key',
        describe: 'Get a public key on Hive API',
        builder: (yargs) => {
            return yargs.option('partnerId', {
                describe: 'Partner Id',
                alias: 'p',
                type: 'string',
                required: true
            }).option('endpoint', {
                describe: 'Endpoint where to publish key',
                alias: 'e',
                type: 'string',
                choices: ['test', 'prod'],
                default: 'test'
            }).option('keyId', {
                describe: 'Key Id',
                alias: 'k',
                type: 'string',
                required: true
            }).check((argv) => {
                const { endpoint } = argv;
                checkEndpoint(endpoint);
                checkPartnerToken(HIVE_PARTNER_TOKEN);
                return argv;
            });
        },
        handler: createHandler(async (argv: ArgumentsCamelCase<GetKeyArguments>) => {
            const { endpoint, partnerId, keyId } = argv;
            const client = new HivePublicKeyServiceClient(partnerId, HIVE_PARTNER_TOKEN!, checkEndpoint(endpoint));
            const key = await client.get(keyId);
            console.log(inspect(key, undefined, undefined, true));
        })
    })
    .command({
        command: 'delete-key',
        describe: 'Delete a public key on Hive API',
        builder: (yargs) => {
            return yargs.option('partnerId', {
                describe: 'Partner Id',
                alias: 'p',
                type: 'string',
                required: true
            }).option('endpoint', {
                describe: 'Endpoint where to publish key',
                alias: 'e',
                type: 'string',
                choices: ['test', 'prod'],
                default: 'test'
            }).option('keyId', {
                describe: 'Key Id',
                alias: 'k',
                type: 'string',
                required: true
            }).check((argv) => {
                const { endpoint } = argv;
                checkEndpoint(endpoint);
                checkPartnerToken(HIVE_PARTNER_TOKEN);
                return argv;
            });
        },
        handler: createHandler(async (argv: ArgumentsCamelCase<DeleteKeyArguments>) => {
            const { endpoint, partnerId, keyId } = argv;
            const client = new HivePublicKeyServiceClient(partnerId, HIVE_PARTNER_TOKEN!, checkEndpoint(endpoint));
            await client.delete(keyId);
            console.log(`Deleted key: ${partnerId}/${keyId}`);
        })
    });

cli.command({
        command: 'publish-key',
        describe: 'Publish a public key to Hive API',
        builder: (yargs) => {
            return yargs.option('file', {
                describe: 'File to read PEM-encoded private key',
                alias: 'f',
                type: 'string',
                required: true
            }).option('partnerId', {
                describe: 'Partner Id',
                alias: 'p',
                type: 'string',
                required: true
            }).option('keyId', {
                describe: 'Key Id',
                alias: 'k',
                type: 'string',
                required: true
            }).option('expiration', {
                describe: 'Expiration, as either (a) a timestamp representing seconds since 1 January 1970 00:00:00 UTC or (b) a duration string, eg. "3 days"',
                alias: 'x',
                type: 'string',
                required: true
            }).option('endpoint', {
                describe: 'Endpoint where to publish key',
                alias: 'e',
                type: 'string',
                choices: ['test', 'prod'],
                default: 'test'
            }).check((argv) => {
                const { endpoint } = argv;
                checkEndpoint(endpoint);
                checkPartnerToken(HIVE_PARTNER_TOKEN);
                checkExpiration(argv.expiration);
                return argv;
            });
        },
        handler: createHandler(async (argv: ArgumentsCamelCase<PublishKeyArguments>) => {
            const { partnerId, keyId, endpoint, expiration, file } = argv;
            const client = new HivePublicKeyServiceClient(partnerId, HIVE_PARTNER_TOKEN!, checkEndpoint(endpoint));
            const keyPair = await HiveKeyPair.readFromFile(file);
            const publicKey = keyPair.exportPublicKey();
            await client.create(
                partnerId,
                keyId,
                publicKey.exponent,
                publicKey.modulus,
                expiration
            )
            console.log(`Created key: ${partnerId}/${keyId}`);
        })
    });

cli.help()
    .demandCommand()
    .argv;
