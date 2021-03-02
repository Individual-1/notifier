import { Injectable } from '@angular/core';
import { StorageKeys as sk } from "@models";
import { browser } from "webextension-polyfill-ts";
import { toBase64, fromBase64 } from "@aws-sdk/util-base64-browser";

@Injectable({
  providedIn: 'root'
})

export class StorageService {

  constructor() { }

  async getSalt(): Promise<Uint8Array | null> {
    let resultObj: { [s: string]: string; };
    let result = browser.storage.local.get(
      sk.salt
    );

    try {
      resultObj = await result;
    } catch (e) {
      throw e;
    }

    if (resultObj[sk.salt]) {
      return fromBase64(resultObj[sk.salt]);
    } else {
      return null;
    }
  }

  setSalt(salt: Uint8Array): Promise<void> {
    return browser.storage.local.set({
      [sk.salt]: toBase64(salt)
    });
  }

  removeSalt(): Promise<void> {
    return browser.storage.local.remove(
      sk.salt
    );
  }

  async getSaltCrypt(): Promise<Uint8Array | null> {
    let resultObj: { [s: string]: string; };
    let result = browser.storage.local.get(
      sk.saltCrypt
    );

    try {
      resultObj = await result;
    } catch (e) {
      throw e;
    }

    if (resultObj[sk.saltCrypt]) {
      return fromBase64(resultObj[sk.saltCrypt]);
    } else {
      return null;
    }
  }

  setSaltCrypt(saltCrypt: Uint8Array): Promise<void> {
    return browser.storage.local.set({
      [sk.saltCrypt]: toBase64(saltCrypt)
    });
  }

  removeSaltCrypt(): Promise<void> {
    return browser.storage.local.remove(
      sk.saltCrypt
    );
  }

  async getClientId(): Promise<string | null> {
    let resultObj: { [s: string]: any; };
    let result = browser.storage.local.get(
      sk.oauthClientId
    );

    try {
      resultObj = await result;
    } catch (e) {
      throw e;
    }

    if (resultObj[sk.oauthClientId]) {
      return resultObj[sk.oauthClientId];
    } else {
      return null;
    }
  }

  setClientId(clientId: string): Promise<void> {
    return browser.storage.local.set({
      [sk.oauthClientId]: clientId
    });
  }

  removeClientId(): Promise<void> {
    return browser.storage.local.remove(
      sk.oauthClientId
    );
  }

  async getClientSecret(): Promise<Uint8Array | null> {
    let resultObj: { [s: string]: string; };
    let result = browser.storage.local.get(
      sk.oauthClientSecret
    );

    try {
      resultObj = await result;
    } catch (e) {
      throw e;
    }

    if (resultObj[sk.oauthClientSecret]) {
      return fromBase64(resultObj[sk.oauthClientSecret]);
    } else {
      return null;
    }
  }

  setClientSecret(ClientSecret: Uint8Array): Promise<void> {
    return browser.storage.local.set({
      [sk.oauthClientSecret]: toBase64(ClientSecret)
    });
  }

  removeClientSecret(): Promise<void> {
    return browser.storage.local.remove(
      sk.oauthClientSecret
    );
  }

  async getAuthorizeURL(): Promise<string | null> {
    let resultObj: { [s: string]: any; };
    let result = browser.storage.local.get(
      sk.authorizeURL
    );

    try {
      resultObj = await result;
    } catch (e) {
      throw e;
    }

    if (resultObj[sk.authorizeURL]) {
      return resultObj[sk.authorizeURL];
    } else {
      return null;
    }
  }

  setAuthorizeURL(authorizeURL: string): Promise<void> {
    return browser.storage.local.set({
      [sk.authorizeURL]: authorizeURL
    });
  }

  removeAuthorizeURL(): Promise<void> {
    return browser.storage.local.remove(
      sk.authorizeURL
    );
  }

  async getAccessToken(): Promise<Uint8Array | null> {
    let resultObj: { [s: string]: string; };
    let result = browser.storage.local.get(
      sk.accessToken
    );

    try {
      resultObj = await result;
    } catch (e) {
      throw e;
    }

    if (resultObj[sk.accessToken]) {
      return fromBase64(resultObj[sk.accessToken]);
    } else {
      return null;
    }
  }

  setAccessToken(accessToken: Uint8Array): Promise<void> {
    return browser.storage.local.set({
      [sk.accessToken]: toBase64(accessToken)
    });
  }

  removeAccessToken(): Promise<void> {
    return browser.storage.local.remove(
      sk.accessToken
    );
  }

  async getRefreshToken(): Promise<Uint8Array | null> {
    let resultObj: { [s: string]: string; };
    let result = browser.storage.local.get(
      sk.refreshToken
    );

    try {
      resultObj = await result;
    } catch (e) {
      throw e;
    }

    if (resultObj[sk.refreshToken]) {
      return fromBase64(resultObj[sk.refreshToken]);
    } else {
      return null;
    }
  }

  setRefreshToken(refreshToken: Uint8Array): Promise<void> {
    return browser.storage.local.set({
      [sk.refreshToken]: toBase64(refreshToken)
    });
  }

  removeRefreshToken(): Promise<void> {
    return browser.storage.local.remove(
      sk.refreshToken
    );
  }

  clearEncrypted(): Promise<void> {
    return browser.storage.local.remove(
      [
        sk.saltCrypt,
        sk.oauthClientSecret,
        sk.refreshToken,
        sk.accessToken
      ]
    )
  }

}
