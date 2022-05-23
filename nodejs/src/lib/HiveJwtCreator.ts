import { promises, readFileSync } from 'fs';
import { sign } from 'jsonwebtoken';

/**
 * Helper class to create JWTs for authenticating with Hive services using the
 * Hive plugin.
 */
export default class HiveJwtCreator {
    /** Partner Id */
    private partnerId: string;
    /** Private key */
    private privateKey: Buffer;

    /**
     * Constructor for `HiveJwtCreator`
     * @param {string} partnerId Partner Id
     * @param {Buffer} privateKey Private key contents
     */
    constructor(partnerId: string, privateKey: Buffer) {
        this.partnerId = partnerId;
        this.privateKey = privateKey;
    }

    /**
     * Construct a new `HiveJwtCreator` given a private key filename. An error
     * reading the file will bubble to caller.
     * @param {string} partnerId Partner Id
     * @param {string} privateKeyFilename Private key filename
     */
    static async create(partnerId: string, privateKeyFilename: string) {
        try {
            const privateKey = await promises.readFile(privateKeyFilename);
            return new HiveJwtCreator(partnerId, privateKey);
        } catch (ex) {
            throw new AggregateError([ex], `Could not read file ${privateKeyFilename}`)
        }
    }

    /**
     * Synchronously onstruct a new `HiveJwtCreator` given a private key
     * filename. An error reading the file will bubble to caller.
     * @param {string} partnerId Partner Id
     * @param {string} privateKeyFilename Private key filename
     */
    static createSync(partnerId: string, privateKeyFilename: string) {
        try {
            const privateKey = readFileSync(privateKeyFilename);
            return new HiveJwtCreator(partnerId, privateKey);
        } catch (ex) {
            throw new AggregateError([ex], `Could not read file ${privateKeyFilename}`)
        }
    }

    /**
     * Create a new JWT.
     * @param {string} keyId Key Id
     * @param {string} customerId Customer Id
     * @param {string} videoId Video Id (also known as Content Id).
     * @param {string[]} manifests List of manifests
     * @param {string | number} expiresIn Expires in, expressed in seconds or a
     * string describing a time span [zeit/ms](https://github.com/zeit/ms.js).
     * Eg: 60, "2 days", "10h", "7d"
     */
    sign(keyId: string, customerId: string, videoId: string, manifests: string[], expiresIn: string | number) {
        const data = {
            "iss": this.partnerId,
            "sub": videoId,
            "ver": "1.0",
            "aud": "https://hivestreaming.com",
            "cid": customerId,
            "man": manifests
        };

        const token = sign(data, this.privateKey, {
            algorithm: 'RS256',
            keyid: keyId,
            expiresIn
        });

        return token;
    }

    /**
     * Create a new JWT.
     * @param {string} keyId Key Id
     * @param {string} customerId Customer Id
     * @param {string} videoId Video Id (also known as Content Id).
     * @param {string | number} expiresIn Expires in, expressed in seconds or a
     * string describing a time span [zeit/ms](https://github.com/zeit/ms.js).
     * Eg: 60, "2 days", "10h", "7d"
     * @param {'test' | 'prod'} endpoint Endpoint in URL.
     */
     signReporting(keyId: string, customerId: string, videoId: string, expiresIn: string | number, endpoint: 'test' | 'prod' = 'prod') {
        const data = {
            "iss": this.partnerId,
            "sub": videoId,
            "ver": "1.0",
            "aud": "https://hivestreaming.com",
            "cid": customerId,
            "act": "reporting"
        };

        const token = sign(data, this.privateKey, {
            algorithm: 'RS256',
            keyid: keyId,
            expiresIn
        });

        return `https://api${endpoint === 'prod' ? '' : '-' + endpoint}.hivestreaming.com/v1/url-redirect/adminportal-jwt/${token}`;
    }
}
