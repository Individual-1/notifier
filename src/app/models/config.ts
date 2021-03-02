/*
    Scrypt default parameters
*/

export class ScryptParams {
    static scryptN: number = 16384;
    static scryptR: number = 8;
    static scryptP: number = 1;
}

/*
    OAuth parameters for reddit

    Per: https://github.com/reddit-archive/reddit/wiki/oauth2#authorization
    "client_id": oauth client id
    "response_type": "code"
    "state": generated state string
    "redirect_uri": extension's redirect URI
    "duration": "permanent"
    "scope": list of oauth scopes we want
*/

export class OAuthParams {
    static authURL: string = "https://www.reddit.com/api/v1/authorize.compact";
    static tokenURL: string = "https://www.reddit.com/api/v1/access_token";
    static scopes: Array<string> = [""];
    static responseType: string = "code";
    static duration: string = "permanent";
}

export interface OAuthCodeRequest {
    grant_type: string,
    code: string,
    redirect_uri: string,
}

// Used for both code and refresh token responses
export interface OAuthCodeResponse {
    access_token: string,
    token_type: string,
    expires_in: number,
    scope: string,
    refresh_token: string,
}

export interface OAuthRefreshRequest {
    grant_type: string,
    refresh_token: string,
}

/*
    We store Options as individual key:values in local.storage. Here we define the key names and data types
    as well as some meta-information about each

    salt - unencrypted 
    Description: Salt value for use with scrypt, not exposed in Options menu
    [salt]: Uint8Array (base64 encoded)

    saltCrypt - encrypted
    Description: Encrypted salt value to determine if generated AEAD works
    [saltCrypt]: Uint8Array (base64 encoded)

    OAuthClientId - unencrypted
    Description: OAuth client id for Reddit app
    [oauthClientId]: string

    OauthClientSecret - encrypted
    Decription: Oauth client secret for Reddit app, writeonly in options
    [oauthClientSecret]: Uint8Array (base64 encoded)

    authorizeURL - unencrypted
    Description: Authorization URL to redirect user to 
    [authorizeURL]: string

    accessToken - encrypted
    Description: Reddit access token, not exposed in options
    [accessToken]: Uint8Array (base64 encoded)

    refreshToken - encrypted
    Description: Reddit refresh token, not exposed in options
    [refreshToken]: Uint8Array (base64 encoded)
*/

export class StorageKeys {
    static salt: string = "salt";
    static saltCrypt: string = "saltCrypt";
    static oauthClientId: string = "oauthClientId";
    static oauthClientSecret: string = "oauthClientSecret";
    static authorizeURL: string = "authorizeURL";
    static accessToken: string = "accessToken";
    static refreshToken: string = "refreshToken";
}

/*
    With IndexedDB we want three primary object stores within our database.
    
    The first is a straightforward name: value setup for configuration data including encrypted blobs.
    We'll be using the same values and types (sans base64 encoding) as defined in the StorageKeys class.
    
    schema: key (primary key) | isEnc (boolean) | value (string or Uint8Array)

    The second is a user object store containing javascript objects for our user data. These will be keyed on
    the user's username, with secondary fields being fullName (reddit unique id) and lastPost read. We will not be
    storing historical messages (yet) and will instead just point to the profile link.

    schema: userName (primary key) | fullName (string) | lastPost (string)

    The third is grudgingly a cache of the encryption key due to extensions constantly being loaded and unloaded.
    We need to keep the key cached until the window is closed (or expiry? TBD)

    schema: id (1) | key (Uint8Array) | expiry (Unused)
*/

export class DatabaseParams {
    static dbName: string = "rdb";
    static configTable: string = "config";
    static userTable: string = "users";
    static keyCache: string = "enc";
    static schema: { [tableName: string]: string | null; } = {
        [DatabaseParams.configTable]: '&key', // Unique index on name of the key
        [DatabaseParams.userTable]: '&userName, &fullName', // Unique index on username and fullname
        [DatabaseParams.keyCache]: '&id',
    };
}

/*
    Interface for config entries in IndexedDB and how we will represent them elsewhere
*/
export interface ConfigArray {
    key: string,
    isEnc: boolean, // Whether this config entry is encrypted or not
    value: Uint8Array,
}

export interface ConfigString {
    key: string,
    isEnc: boolean, // Whether this config entry is encrypted or not
    value: string,
}

/*
    Interface for user entries in IndexedDB as well as wider program representation
*/
export interface User {
    userName: string,
    fullName: string,
    lastPost: string,
}

export interface KeyCache {
    id: number,
    key: Uint8Array,
}