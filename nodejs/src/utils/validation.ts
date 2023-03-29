import ms from 'ms';

const checkPartnerToken = (partnerToken: string | undefined) => {
    if (partnerToken === undefined || partnerToken == '') {
        throw new Error("No HIVE_PARTNER_TOKEN environmental variable set")
    }
}

const isNumeric = (value: string) => /^\d+$/.test(value);

const checkExpiration = (expiration: string) => {
    let exp: number;

    if (isNumeric(expiration)) {
        exp = parseInt(expiration, 10);
    } else {
        exp = Math.floor((Date.now() + ms(expiration)) / 1000)
    }

    if (isNaN(exp)) {
        throw new Error(`Invalid expiration: ${expiration}`)
    }

    return exp;
}

const checkExpiresIn = (expiration: string) => {
    let exp: number;

    if (isNumeric(expiration)) {
        exp = parseInt(expiration, 10);
    } else {
        exp = Math.floor(ms(expiration) / 1000);
    }

    if (isNaN(exp)) {
        throw new Error(`Invalid expiresIn: ${expiration}`)
    }

    return exp;
}

const checkManifestOrArray = (manifest: string[], regexes?: string[]) => {
    if(manifest.length === 0 && regexes && regexes.length > 0) return { "man": manifest, "regexes": regexes };
    if(manifest.length > 0 && !regexes) return { "man": manifest };
    throw new Error("Only one of manifest or regex list can be defined.")

}

const checkEndpoint = (endpoint: string): 'prod'|'test' => {
    if (endpoint === 'prod' || endpoint === 'test') {
        return endpoint;
    }
    throw new Error(`Invalid endpoint: ${endpoint}`);
}

export {
    checkPartnerToken,
    checkExpiration,
    checkExpiresIn,
    checkManifestOrArray,
    checkEndpoint
}