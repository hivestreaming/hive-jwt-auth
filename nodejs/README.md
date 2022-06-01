# hive-jwt-auth

This package provides a reference implementation -- as well as a CLI tool using
said implementation -- to manage public keys on the Hive Public Key Service, as
well as create JWTs for authenticating to Hive Services for use within a Hive
plugin.

## Installation

For using the CLI tool, we recommend installing the package globally to add the
command line to your Node command line scripts:

`npm install -g --production @hivestreaming/hive-jwt-auth`

For using only the reference classes in your own infrastructure, do not globally
install:

`npm install --production @hivestreaming/hive-jwt-auth`

## Usage: Reference classes

This package provides reference classes for creating keys and JWTs, as well as
interacting with the Hive Public Key Service. Please see the generated TypeDoc
documentation for more information.

### Creating a new private key file

```ts
const file = 'path/private-key.pem'; // File to save PEM-encoded private key
const keyPair = await HiveKeyPair.create();
await keyPair.writePrivateKey(file);
```

### Creating a new JWT
```ts
const partnerId = '9001'; // Partner Id
const file = 'path/private-key.pem'; // File to read PEM-encoded private key
const keyId = 'key-id'; // Key Id
const customerId = 'customer-id'; // Customer Id
const videoId = 'video-id'; // Event/Video Id
const manifests = [ 'https://example.com/manifest.m3u8', 'https://www.example.com/manifest.mpd' ] // Manifests
const expiresIn = '15 minutes'; // Expires in. See documentation of `HiveJwtCreator#sign` for format details.
const eventName = 'event test name' // Event name
const jwtCreator = await HiveJwtCreator.create(partnerId, file);
const jwt = jwtCreator.sign(keyId, customerId, videoId, manifests, expiresIn, eventName)

console.log(jwt);
```

### Creating a Reporting URL to link to Video Monitor
```ts
const partnerId = '9001'; // Parnter Id
const file = 'path/private-key.pem'; // File to read PEM-encoded private key
const keyId = 'key-id'; // Key Id
const customerId = 'customer-id'; // Customer Id
const videoId = 'video-id'; // Event/Video Id
const endpoint = 'prod'; // Endpoint: 'test' or 'prod'. Default if none provided: 'prod'
const expiresIn = '15 minutes'; // Expires in. See documentation of `HiveJwtCreator#signReporting` for format details.
const jwtCreator = await HiveJwtCreator.create(partnerId, file);
const url = jwtCreator.signReporting(keyId, customerId, videoId, expiresIn, endpoint);

console.log(url);
```

### Publishing a new Public Key to Hive API
```ts
const partnerId = '9001'; // Partner Id
const partnerToken = 'foobar'; // Partner Token
const endpoint = 'prod'; // Endpoint: 'test' or 'prod'. Default if none provided: 'prod'
const expiration = '30 days'; // Expiration. See documentation of `HivePublicKeyServiceClient#create` for format details.

const keyPair = await HiveKeyPair.readFromFile(file);
const publicKey = keyPair.exportPublicKey();

const client = new HivePublicKeyServiceClient(partnerId, partnerToken, endpoint);

await client.create({
    partnerId,
    expiration,
    keyId,
    ...publicKey
})
```

### Deleting a Public Key from Hive API
```ts
const partnerId = '9001'; // Partner Id
const partnerToken = 'foobar'; // Partner Token
const endpoint = 'prod'; // Endpoint: 'test' or 'prod'. Default if none provided: 'prod'
const client = new HivePublicKeyServiceClient(partnerId, partnerToken, endpoint);

await client.delete(keyId);
```

### Listing Public Keys on Hive API
```ts
const partnerId = '9001'; // Partner Id
const partnerToken = 'foobar'; // Partner Token
const includeDeleted = false; // If `true`, return deleted keys
const endpoint = 'prod'; // Endpoint: 'test' or 'prod'. Default if none provided: 'prod'
const client = new HivePublicKeyServiceClient(partnerId, partnerToken, endpoint);

await client.list(includeDeleted);
```

### Retrieving a Public Key on Hive API
```ts
const partnerId = '9001'; // Partner Id
const partnerToken = 'foobar'; // Partner Token
const keyId = 'key-id'; // Key Id
const endpoint = 'prod'; // Endpoint: 'test' or 'prod'. Default if none provided: 'prod'
const client = new HivePublicKeyServiceClient(partnerId, partnerToken, endpoint);

await client.get(keyId);
```

## Usage: CLI Tool
This package provides a command-line tool to manage public keys on the Hive
Public Key Service. The tool also creates JWTs using these public keys.

```text
hive-jwt-util <command>

Commands:
  hive-jwt-util create-key     Create a new private key
  hive-jwt-util create-jwt     Create a new signed JWT
  hive-jwt-util reporting-url  Display a URL to Hive Video Monitor
  hive-jwt-util list-keys      List public keys on Hive API
  hive-jwt-util get-key        Get a public key on Hive API
  hive-jwt-util delete-key     Delete a public key on Hive API
  hive-jwt-util publish-key    Publish a public key to Hive API

Options:
  --version  Show version number                                       [boolean]
  --help     Show help
  ```

***IMPORTANT*** Commands that interact with the Hive API (`list-keys`,
`get-key`, `delete-key`, `publish-key`) require an environmental variable
`HIVE_PARTNER_TOKEN` that contains the Hive Partner Token used for
authenticating to Hive Services.

### `create-key`
Create a new PEM-encoded RSA private key on the filesystem in `<file>`.

```text
hive-jwt-util create-key

Options:
      --help  Show help                                                [boolean]
  -f, --file  File to save PEM-encoded private key           [string] [required]
```

#### Example

```text
hive-jwt-util create-key --file private-key.pem
```

### `create-jwt`
Create a new JWT signed with the private key in `<file>`.

```text
hive-jwt-util create-jwt

Options:
      --help        Show help                                          [boolean]
  -f, --file        File to read PEM-encoded private key     [string] [required]
  -p, --partnerId   Partner Id                               [string] [required]
  -c, --customerId  Customer Id                              [string] [required]
  -k, --keyId       Key Id                                   [string] [required]
  -v, --videoId     Video Id                                 [string] [required]
  -m, --manifest    Manifest                                  [array] [required]
  -x, --expiresIn   Expiration, as either (a) number of seconds or (b) a
                    duration string, eg. "3 days"            [string] [required]
  -n, --eventName   Event name                               [string] [optional]
```

#### Example

```text
hive-jwt-util create-jwt --file private-key.pem --partnerId 9001 --customerId 15 --videoId video-id --keyId key-id --manifest https://www.example.com/manifest.m3u8 --expiresIn "15 minutes" -n "event test name"
```

### `reporting-url`
Display a URL to Hive Video Monitor

```text
hive-jwt-util reporting-url

Options:
      --version     Show version number                                [boolean]
      --help        Show help                                          [boolean]
  -f, --file        File to read PEM-encoded private key     [string] [required]
  -p, --partnerId   Partner Id                               [string] [required]
  -c, --customerId  Customer Id                              [string] [required]
  -k, --keyId       Key Id                                   [string] [required]
  -v, --videoId     Video Id                                 [string] [required]
  -e, --endpoint    Endpoint where to publish key
                            [string] [choices: "test", "prod"] [default: "test"]
  -x, --expiresIn   Expiration, as either (a) number of seconds or (b) a
                    duration string, eg. "3 days"            [string] [required]
```

#### Example

```text
hive-jwt-util reporting-url --file private-key.pem --keyId key-id --partnerId 9001 --customerId 15 --videoId video-id --expiresIn "15 minutes"
```

### `list-keys`

List public keys on Hive API

```text
hive-jwt-util list-keys

Options:
      --help            Show help                                      [boolean]
  -p, --partnerId       Partner Id                           [string] [required]
  -e, --endpoint        Endpoint where to publish key
                            [string] [choices: "test", "prod"] [default: "test"]
  -d, --includeDeleted  Include deleted keys in list response
                                                      [boolean] [default: false]
```

#### Example

```text
hive-jwt-util list-keys --partnerId 9001
```

### `get-key`

Get a public key on Hive API and print details on the console.

```text
hive-jwt-util get-key

Options:
      --help       Show help                                           [boolean]
  -p, --partnerId  Partner Id                                [string] [required]
  -e, --endpoint   Endpoint where to publish key
                            [string] [choices: "test", "prod"] [default: "test"]
  -k, --keyId      Key Id                                    [string] [required]
```

#### Example:

```text
hive-jwt-util get-key --partnerId 9001 --keyId my-key
```

### `delete-key`

Delete a public key on Hive API.

```text
hive-jwt-util delete-key

Options:
      --help       Show help                                           [boolean]
  -p, --partnerId  Partner Id                                [string] [required]
  -e, --endpoint   Endpoint where to publish key
                            [string] [choices: "test", "prod"] [default: "test"]
  -k, --keyId      Key Id                                    [string] [required]
```

#### Example

```text
hive-jwt-util delete-key --partnerId 9001 --keyId my-key
```

### `publish-key`

Publish a public key to Hive API.

```text
hive-jwt-util publish-key

Options:
      --help        Show help                                          [boolean]
  -f, --file        File to read PEM-encoded private key     [string] [required]
  -p, --partnerId   Partner Id                               [string] [required]
  -k, --keyId       Key Id                                   [string] [required]
  -x, --expiration  Expiration, as either (a) a timestamp representing seconds
                    since 1 January 1970 00:00:00 UTC or (b) a duration string,
                    eg. "3 days"                             [string] [required]
  -e, --endpoint    Endpoint where to publish key
                            [string] [choices: "test", "prod"] [default: "test"]
```

#### Example:

```text
hive-jwt-util publish-key --file private-key.pem --partnerId 9001 --keyId my-key --expiration "1 day"
```
