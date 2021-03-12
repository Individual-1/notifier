import { browser } from "webextension-polyfill-ts";

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
  static accessToken: string = "accessToken";
  static refreshToken: string = "refreshToken";
  static friendsKey: string = "friends";
  static plaintextSettings: Array<string> = [
    StorageKeys.oauthClientId,
  ];
  static encryptedSettings: Array<string> = [
    StorageKeys.oauthClientSecret,
  ];
  static descriptions = {
    [StorageKeys.salt]: "Salt value used in key generation",
    [StorageKeys.saltCrypt]: "Encrypted salt used to test decryption",
    [StorageKeys.oauthClientId]: "Reddit OAuth client ID",
    [StorageKeys.oauthClientSecret]: "Reddit OAuth client secret",
    [StorageKeys.accessToken]: "Reddit access token",
    [StorageKeys.refreshToken]: "Reddit refresh token",
  };
  static isArray = {
    [StorageKeys.salt]: true,
    [StorageKeys.saltCrypt]: true,
    [StorageKeys.oauthClientId]: false,
    [StorageKeys.oauthClientSecret]: true,
    [StorageKeys.accessToken]: true,
    [StorageKeys.refreshToken]: true,
  };
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
*/

export class DatabaseParams {
  static dbName: string = "rdb";
  static configTable: string = "config";
  static userTable: string = "users";
  static friendsTable: string = "friends";
  static schema: { [tableName: string]: string | null; } = {
    [DatabaseParams.configTable]: '&key', // Unique index on name of the key
    [DatabaseParams.userTable]: '&userName, &fullName', // Unique index on username and fullname
    [DatabaseParams.friendsTable]: '&key',
  };
}

/*
  Interface for config entries in IndexedDB and how we will represent them elsewhere
*/
export interface ConfigAction {
  key: string,
  isEnc: boolean, // Whether this config entry is encrypted or not
  isArray: boolean, // true for Uint8Array, false for string
  value: Uint8Array | string,
}

function serializeConfig(action: ConfigAction): string {
  if (action.isArray) {
    return JSON.stringify(action, stringifyTypedArray);
  } else {
    return JSON.stringify(action);
  }
}

function deserializeConfig(jsonAction: string): ConfigAction | null {
  if (jsonAction === undefined || jsonAction === null) {
    return null;
  }

  let parsed: Object = JSON.parse(jsonAction);

  if (!parsed.hasOwnProperty('key') || !parsed.hasOwnProperty('isEnc') ||
    !parsed.hasOwnProperty('isArray') || !parsed.hasOwnProperty('value')) {
    return null;
  }

  let parsedCfg: ConfigAction = parsed as ConfigAction;
  if (parsedCfg.isArray) {
    parsedCfg.value = Uint8Array.from(parsedCfg.value as any);
  }

  return parsedCfg;
}

/*
  Interface for user entries in IndexedDB as well as wider program representation
*/
export interface User {
  userName: string,
  fullName: string,
  lastPost: string,
  submitted: boolean,
  comments: boolean,
}

export function serializeUser(user: User): string {
  return JSON.stringify(user);
}

export function deserializeUser(jsonStr: string): User | null {
  if (jsonStr === null || jsonStr === undefined) {
    return null;
  }

  let obj: Object = JSON.parse(jsonStr);

  if (!obj.hasOwnProperty('userName') || !obj.hasOwnProperty('fullName') || !obj.hasOwnProperty('lastPost')) {
    return null;
  }

  return obj as User;
}

/* 
  Friends entry in IndexedDB
*/
export interface Friends {
  key: string,
  lastSubmission: string,
  lastComment: string,
}

export function serializeFriends(entry: Friends): string {
  return JSON.stringify(entry);
}

export function deserializeFriends(jsonStr: string): Friends | null {
  if (jsonStr === null || jsonStr === undefined) {
    return null;
  }

  let obj: Object = JSON.parse(jsonStr);

  if (!obj.hasOwnProperty('key') || !obj.hasOwnProperty('lastSubmission') || !obj.hasOwnProperty('lastComment')) {
    return null;
  }

  return obj as Friends;
}

/*
  Actions we want our background script to take

  Responses are raw primitives because we can't effectively pass data around 
  between contexts without browser-specific copy methods
*/
export enum BackgroundAction {
  startOAuthAuthorization, // data: null - returns void
  encrypt, // Crypto - data: Uint8Array - returns Uint8Array
  decrypt, // Crypto - data: Uint8Array - returns Uint8Array
  getConfigString, // Storage - data: string - returns string
  getConfigArray, // Storage - data: string - returns Uint8Array
  putConfig, // Storage - data: ConfigAction - returns string
  unlockKey, // Crypto - data: Uint8Array - returns boolean
  isUnlocked, // Crypto - data: null - returns boolean
  getAllUsers, // Users - data: null - returns User[]
  removeUser, // Users - data: string - returns boolean
  addUser, // Users - data: User - returns boolean
  getFriendsEnabled, // Users - data: null - returns boolean
  enableFriends, // Users - data: null - returns boolean
  disableFriends, // Users - data: null - returns boolean
}

export enum BackgroundDataType {
  null, // null
  string, // string
  Uint8Array, // Uint8Array
  ConfigAction, // ConfigAction
  User, // User
}

interface NumberMap {
  [key: number]: number;
}

let BackgroundActionType: NumberMap = {
  [BackgroundAction.startOAuthAuthorization]: BackgroundDataType.null,
  [BackgroundAction.encrypt]: BackgroundDataType.Uint8Array,
  [BackgroundAction.decrypt]: BackgroundDataType.Uint8Array,
  [BackgroundAction.getConfigString]: BackgroundDataType.string,
  [BackgroundAction.getConfigArray]: BackgroundDataType.string,
  [BackgroundAction.putConfig]: BackgroundDataType.ConfigAction,
  [BackgroundAction.unlockKey]: BackgroundDataType.Uint8Array,
  [BackgroundAction.isUnlocked]: BackgroundDataType.null,
  [BackgroundAction.getAllUsers]: BackgroundDataType.null,
  [BackgroundAction.removeUser]: BackgroundDataType.string,
  [BackgroundAction.addUser]: BackgroundDataType.User,
  [BackgroundAction.getFriendsEnabled]: BackgroundDataType.null,
  [BackgroundAction.enableFriends]: BackgroundDataType.null,
  [BackgroundAction.disableFriends]: BackgroundDataType.null,
}

export interface BackgroundMessage {
  action: BackgroundAction,
  type: BackgroundDataType,
  data: any | null,
}

export async function sendBackgroundMessage(msg: BackgroundMessage): Promise<any> {
  let sMsg: string | null = serializeMessage(msg);

  if (sMsg === null) {
    return null;
  }

  return browser.runtime.sendMessage(sMsg);
}

// Serialize a BackgroundMessage type into a JSON string
function serializeMessage(msg: BackgroundMessage): string | null {
  if (!BackgroundActionType.hasOwnProperty(msg.action) ||
    !(BackgroundActionType[msg.action] === msg.type)) {
    return null;
  }

  switch (msg.type) {
    case BackgroundDataType.null:
      return JSON.stringify(msg);
    case BackgroundDataType.string:
      return JSON.stringify(msg);
    case BackgroundDataType.Uint8Array:
      return JSON.stringify(msg, stringifyTypedArray);
    case BackgroundDataType.ConfigAction:
      let cfgStr: string = serializeConfig(msg.data as ConfigAction);
      msg.data = cfgStr;
      return JSON.stringify(msg);
    case BackgroundDataType.User:
      let userStr: string = serializeUser(msg.data as User);
      msg.data = userStr;
      return JSON.stringify(msg);
  }
}

// Deserialize a BackgroundMessage type from JSON string
export function deserializeMessage(jsonMsg: string): BackgroundMessage | null {
  if (jsonMsg === undefined || jsonMsg === null) {
    return null;
  }

  let parsed: Object = JSON.parse(jsonMsg);

  if (!parsed.hasOwnProperty('action') || !parsed.hasOwnProperty('type') || !parsed.hasOwnProperty('data')) {
    return null;
  }

  let parsedMsg: BackgroundMessage = parsed as BackgroundMessage;

  if (!BackgroundActionType.hasOwnProperty(parsedMsg.action) ||
    !(BackgroundActionType[parsedMsg.action] == parsedMsg.type)) {
    return null;
  }

  switch (parsedMsg.type) {
    case BackgroundDataType.null:
      parsedMsg.data = null;
      break;
    case BackgroundDataType.string:
      break;
    case BackgroundDataType.Uint8Array:
      parsedMsg.data = Uint8Array.from(parsedMsg.data);
      break;
    case BackgroundDataType.ConfigAction:
      let cfg: ConfigAction | null = deserializeConfig(parsedMsg.data as string);
      if (cfg === null) {
        return null;
      }

      parsedMsg.data = cfg;
      break;
    case BackgroundDataType.User:
      let user: User | null = deserializeUser(parsedMsg.data as string);
      if (user === null) {
        return null;
      }

      parsedMsg.data = user;
      break;
  }

  return parsedMsg;
}

function stringifyTypedArray(key: any, value: any) {
  if (ArrayBuffer.isView(value)) {
    return Array.from(value as Uint8Array);
  } else {
    return value;
  }
}