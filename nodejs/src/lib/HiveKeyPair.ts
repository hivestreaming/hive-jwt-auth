import { generateKeyPair as _generateKeyPair, generateKeyPairSync, createPrivateKey, createPublicKey, KeyObject } from 'crypto';
import { promises as fsPromises, writeFileSync, readFileSync } from 'fs';
import { promisify } from 'util';

import writeFile = fsPromises.writeFile;
import readFile = fsPromises.readFile;

const generateKeyPair = promisify(_generateKeyPair);

/**
 * Helper class to generate and store RSA assymetric keys.
 */
export default class HiveKeyPair {
    /** Public key */
    private publicKey: KeyObject;

    /** Private key */
    private privateKey: KeyObject;

    /**
     * Create a new `HivePublicKeyCreator`.
     * @param {KeyObject} privateKey A `KeyObject` representing the private key.
     * @param {KeyObject} publicKey A `KeyObject` representing the public key.
     */
    constructor(publicKey: KeyObject, privateKey: KeyObject) {
        this.publicKey = publicKey;
        this.privateKey = privateKey;
    }

    /**
     * Create a new `HivePublicKeyCreator` with a newly generated asymmetric key
     * pair.
     */
    static async create(): Promise<HiveKeyPair> {
        const { publicKey, privateKey } = await generateKeyPair('rsa', {
            modulusLength: 4096
        });

        return new HiveKeyPair(publicKey, privateKey);
    }

    /**
     * Synchronously create a new `HivePublicKeyCreator` with a newly generated
     * asymmetric key pair.
     */
    static createSync(): HiveKeyPair {
        const { publicKey, privateKey } = generateKeyPairSync('rsa', {
            modulusLength: 4096
        });

        return new HiveKeyPair(publicKey, privateKey);
    }


    /**
     * Create a new `HivePublicKeyCreator` from a file that contains a private
     * key in PEM-encoded format.
     *
     * @param {string} file File to read private key from
     */
    static async readFromFile(file: string): Promise<HiveKeyPair> {

        const privateKeyBuffer = await readFile(file)

        const privateKey = createPrivateKey(privateKeyBuffer);

        const publicKey = createPublicKey({
            key: privateKeyBuffer
        })

        return new HiveKeyPair(publicKey, privateKey);
    }

    /**
     * Synchronously create a new `HivePublicKeyCreator` from a file that
     * contains a private key in PEM-encoded format.
     *
     * @param {string} file Filename to read the private key from.
     */
    static readFromFileSync(file: string): HiveKeyPair {

        const privateKeyBuffer = readFileSync(file)

        const privateKey = createPrivateKey(privateKeyBuffer);

        const publicKey = createPublicKey({
            key: privateKeyBuffer
        })

        return new HiveKeyPair(publicKey, privateKey);
    }

    /**
     * Write the private key to file in PEM-encoded format.
     *
     * @param {string} filename Filename to store the private key to.
     * @return {Promise<void>} The `Promise` representing the filesystem write,
     * fulfills with `undefined` upon success.
     */
    writePrivateKey(filename: string): Promise<void> {
        return writeFile(filename, this.privateKey.export({
            format: 'pem',
            type: 'pkcs8'
        }));
    }

    /**
     * Synchronously write the private key to file in PEM-encoded format.
     *
     * @param {string} filename Filename to store the private key to.
     */
    writePrivateKeySync(filename: string): void {
        writeFileSync(filename, this.privateKey.export({
            format: 'pem',
            type: 'pkcs8'
        }));
    }

    /**
     * Return the public key in a format used by the Hive Public Key Service.
     */
    exportPublicKey(): { modulus: string, exponent: string } {
        const exported = this.publicKey.export({ format: 'jwk' });
        return {
            modulus: exported.n!,
            exponent: exported.e!
        };
    }
}
