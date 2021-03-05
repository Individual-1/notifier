import { Injectable } from '@angular/core';

import { StorageService } from '@core/storage/storage.service'
import { ScryptParams as sp, StorageKeys as sk, ConfigArray, ConfigString, KeyCache, BackgroundAction, BackgroundMessage } from "@models";

import { browser } from 'webextension-polyfill-ts';
import { aead, aeadSubtle } from "tink-crypto";
import { syncScrypt } from "scrypt-js";
import { Console } from 'console';

@Injectable({
  providedIn: 'root'
})
export class CryptoService {
  private aeadKey: aead.Aead | null = null;
  private encoder: TextEncoder = new TextEncoder();
  private decoder: TextDecoder = new TextDecoder();

  constructor(private s: StorageService) {}

  public decodeArray(v: Uint8Array): string {
    return this.decoder.decode(v);
  }

  public encodeString(v: string): Uint8Array {
    return this.encoder.encode(v);
  }

  public async isUnlocked(): Promise<boolean> {
    if (this.aeadKey !== null) {
      return true;
    }

    return this.loadAead();
  }

  public async unlockKey(pw: Uint8Array): Promise<boolean> {
    if (await this.isUnlocked()) {
      return true;
    }

    let rKey: Uint8Array = await this.deriveRawKey(pw);
    let aKey: aead.Aead = await this.createAEAD(rKey);
    let valid: boolean = await this.testKey(aKey);

    if (valid) {
      this.aeadKey = aKey;
      this.saveAead();
    }

    return valid;
  }

  public async encrypt(data: Uint8Array): Promise<Uint8Array | null> {
    if (this.aeadKey !== null) {
      return this.aeadKey.encrypt(data);
    } else {
      return null;
    }
  }

  public async decrypt(data: Uint8Array): Promise<Uint8Array | null> {
    if (this.aeadKey !== null) {
      return this.aeadKey.decrypt(data);
    } else {
      return null;
    }
  }

  // TODO: generate random salt 
  public generateRandomArray(len: number): Uint8Array {
    return Uint8Array.from([0x41]);
  }

  public isAead(obj: Object): boolean {
    return true;
  }

  private saveAead() {
    let msg: BackgroundMessage = { action: BackgroundAction.setEncKey, data: this.aeadKey } as BackgroundMessage;
    browser.runtime.sendMessage(msg)
  }

  private async loadAead(): Promise<boolean> {
    let msg: BackgroundMessage = { action: BackgroundAction.getEncKey, data: null } as BackgroundMessage;
    let resp: BackgroundMessage;
    
    try {
      let test = browser.runtime.lastError;
      resp = await browser.runtime.sendMessage(msg);
    } catch (err) {
      console.log("bg response: " + err.message);
      return false;
    }

    if (resp !== undefined && resp.action == BackgroundAction.success && 
      resp.data !== null) {
      this.aeadKey = resp.data as aead.Aead;
      return true;
    }

    return false;
  }

  private async retrieveSalt(): Promise<Uint8Array> {
    let saltEntry: ConfigArray | undefined;
    let salt: Uint8Array;

    saltEntry = await this.s.getConfigArray(sk.salt);

    if (saltEntry === undefined) {
      salt = this.generateRandomArray(32);
      let newEntry: ConfigArray = {
        key: sk.salt,
        isEnc: false,
        value: salt,
      };

      await this.s.deleteEncryptedConfig();
      await this.s.putConfig(newEntry);
    } else {
      salt = saltEntry.value;
    }

    return salt;
  }

  private async deriveRawKey(pw: Uint8Array): Promise<Uint8Array> {
    let salt: Uint8Array = await this.retrieveSalt();
    return syncScrypt(pw, salt, sp.scryptN, sp.scryptR, sp.scryptP, 32)
  }


  private async createAEAD(key: Uint8Array): Promise<aead.Aead> {
    return aeadSubtle.aesGcmFromRawKey(key);
  }

  private async testKey(key: aead.Aead): Promise<boolean> {
    let saltEntry: ConfigArray | undefined;
    let saltCryptEntry: ConfigArray | undefined;

    saltEntry = await this.s.getConfigArray(sk.salt);
    saltCryptEntry = await this.s.getConfigArray(sk.saltCrypt);

    if (saltCryptEntry === undefined && saltEntry !== undefined) {
      // Check if first run with salt, salt will be set but not crypt
      let saltCrypt: Uint8Array = await key.encrypt(saltEntry.value);
      let newEntry: ConfigArray = {
        key: sk.saltCrypt,
        isEnc: true,
        value: saltCrypt
      }

      this.s.putConfig(newEntry);
      return true;
    } else if (saltCryptEntry !== undefined && saltEntry !== undefined) {
      // Not first run, both salt and crypt are set, check if they match
      let saltDecrypt: Uint8Array;
      saltDecrypt = await key.decrypt(saltCryptEntry.value);

      return this.compareArray(saltEntry.value, saltDecrypt);
    }

    return false;
  }

  private compareArray(a: Uint8Array, b: Uint8Array): boolean {
    if (a == b) return true;
    if (a == null || b == null) return false;
    if (a.length !== b.length) return false;

    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }

    return true;
  }
}
