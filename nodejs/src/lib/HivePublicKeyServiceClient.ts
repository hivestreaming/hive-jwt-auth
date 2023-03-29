import axios, { Axios } from 'axios';
import { checkExpiration } from '../utils/validation';

/** A type representing the JSON payload to create a new public key on the Hive
 * Public Key Service. */
export type PublicKeyStorePayload = {
    /** Partner Id */
    partnerId: string;

    /** Key Id */
    keyId: string;

    /** Public key exponent */
    exponent: string;

    /** Public key modulus */
    modulus: string;

    /** Expiration as a timestamp representing seconds since 1 January 1970
     * 00:00:00 UTC */
    expiration: number;
}

/** A type representing a public key on the Hive Public Key Service. */
export type PublicKeyInfo = {
    /** Partner Id */
    partnerId: string;

    /** Key Id */
    keyId: string;

    /** Public key exponent */
    exponent: string;

    /** Public key modulus */
    modulus: string;

    /** Expiration as a timestamp representing seconds since 1 January 1970
     * 00:00:00 UTC */
    expiration: number;

    /** Creation date as a timestamp representing seconds since 1 January 1970
     * 00:00:00 UTC */
    createdAt: number;
}

/** A type representing a list of public keys on the Hive Public Key Service. */
export type PublicKeyInfoRedactedList = {
    /** Partner Id */
    partnerId: string;

    /** Key Id */
    keyId: string;

    /** Expiration as a timestamp representing seconds since 1 January 1970
     * 00:00:00 UTC */
    expiration: number;

    /** Creation date as a timestamp representing seconds since 1 January 1970
     * 00:00:00 UTC */
    createdAt: number;

    /** Deletion date as a timestamp representing seconds since 1 January 1970
     * 00:00:00 UTC */
    deletedAt?: number;
}[];

/** A class encapsulating authentication errors to the Hive Public Key Service.
 * */
export class HiveAuthorizationError extends Error {
    constructor() {
        super("Authorization required: missing or invalid partner token");
        this.name = "HiveAuthorizationError";
    }
}
/** A class encapsulating validation errors from the Hive Public Key Service. */
export class HivePublicKeyValidationError extends Error {
    constructor(errors: unknown) {
        super(`Public key validation error: ${Array.isArray(errors) ? errors.join('; ') : errors}`);
        this.name = "HiveValidationError";
    }
}

/** A class encapsulating an error from the Hive Public Key Service when
 * requesting a key that has not been published to the service. */
export class HivePublicKeyNotFoundError extends Error {
    constructor(partnerId: string, keyId?: string) {
        super(`Public key not found: ${partnerId}/${keyId}`);
        this.name = "HivePublicKeyNotFoundError";
    }
}

/** A class encapsulating an error from the Hive Public Key Service when
 * requesting a key that has been deleted on the service. */
export class HivePublicKeyDeletedError extends Error {
    constructor(partnerId: string, keyId?: string) {
        super(`Public key has been deleted: ${partnerId}/${keyId}`);
        this.name = "HivePublicKeyDeletedError";
    }
}

/** A helper class encapsulating the CRUD methods of the Hive Public Key
 * Service. */
export default class HivePublicKeyServiceClient {
    /** `Axios` client */
    private client: Axios;

    /** Partner Id */
    private partnerId: string;

    /**
     * Construct a new client to the Hive Public Key Service.
     *
     * @param partnerId Partner Id
     * @param partnerToken Partner Token
     * @param endpoint The endpoint (`test` or `prod`) to send requests to
     */
    constructor(partnerId: string, partnerToken: string, endpoint: 'prod' | 'test' = 'prod') {
        const baseURL = `https://api${endpoint === 'prod' ? '' : `-${endpoint}`}.hivestreaming.com/v1`;

        this.partnerId = partnerId;
        this.client = axios.create({
            baseURL,
            headers: {
                'X-Hive-Partner-Token': partnerToken,
                'Content-Type': 'application/json'
            }
        });
    }

    /**
     * Get an individual public key.
     *
     * @param keyId Key Id
     * @returns A `Promise` that resolves to object of type `PublicKeyInfo`
     * representing the public key on the Hive Public Key service.
     */
    async get(keyId: string): Promise<PublicKeyInfo> {
        try {
            const res = await this.client.get<PublicKeyInfo>(`/publickey/${this.partnerId}/${keyId}`);
            return res.data;
        } catch (error) {
            this.axiosErrorHandler(error, keyId);
        }
    }

    /**
     * Get a list of public keys.
     *
     * @param includeDeleted If `true`, include deleted keys in response.
     * @returns A `Promise` that resolves to object of type
     * `PublicKeyInfoRedactedList` representing the list of public keys on the
     * Hive Public Key service.
     */
    async list(includeDeleted: boolean = false): Promise<PublicKeyInfoRedactedList> {
        try {
            const res = await this.client.get<PublicKeyInfoRedactedList>(`/publickey/${this.partnerId}?includeDeleted=${includeDeleted}`);
            return res.data;
        } catch (error) {
            this.axiosErrorHandler(error);
        }
    }

    /**
     * Create a new public key.
     *
     * @param info The public key to store on the Hive Public Key Service.
     */
    async create(partnerId: string, keyId: string, exponent: string, modulus: string, expiration: string | number): Promise<void> {
        let a: PublicKeyStorePayload
        try {
            const exp = typeof expiration === "string" ? checkExpiration(expiration) : expiration;
            const payload: PublicKeyStorePayload = {
                partnerId,
                keyId,
                exponent,
                modulus,
                expiration: exp
            }
            await this.client.post('/publickey', payload);
        } catch (error) {
            this.axiosErrorHandler(error, keyId);
        }
    }

    /**
     * Delete a public key.
     *
     * @param keyId Key Id
     */
    async delete(keyId: string): Promise<void> {
        try {
            await this.client.delete(`/publickey/${this.partnerId}/${keyId}`);
        } catch (error) {
            this.axiosErrorHandler(error);
        }
    }

    private axiosErrorHandler(error: unknown, keyId?: string): never {
        if (axios.isAxiosError(error)) {
            if (error.response !== undefined) {
                const { data, status } = error.response;
                if (status == 400) {
                    throw new HivePublicKeyValidationError(data);
                }
                else if (status === 403) {
                    throw new HiveAuthorizationError();
                }
                else if (status == 404) {
                    throw new HivePublicKeyNotFoundError(this.partnerId, keyId);
                }
                else if (status == 410) {
                    throw new HivePublicKeyDeletedError(this.partnerId, keyId);
                }
            }
        }
        throw error;
    }
}
