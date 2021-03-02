/*
    Scrypt default parameters
*/

export class ScryptParams {
    static scryptN: number = 16384;
    static scryptR: number = 8;
    static scryptP: number = 1;
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
