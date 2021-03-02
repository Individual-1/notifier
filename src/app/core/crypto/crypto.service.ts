import { Injectable } from '@angular/core';

import { StorageService } from '@core/storage/storage.service'
import { ScryptParams as sp } from "@models";

import { aead, aeadSubtle } from "tink-crypto";
import { syncScrypt } from "scrypt-js";

@Injectable({
  providedIn: 'root'
})
export class CryptoService {

  private aeadKey: aead.Aead | null = null;
  private initialized: boolean = false;

  constructor(private s: StorageService) { }

  public async isInitialized(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    let saltCrypt: Uint8Array | null;
    try {
      saltCrypt = await this.s.getSaltCrypt();
    } catch (e) {
      throw e;
    }

    if (saltCrypt !== null) {
      this.initialized = true;
      return true;
    }

    return false;
  }

  public isUnlocked(): boolean {
    return this.aeadKey !== null;
  }

  public async unlockKey(pw: Uint8Array): Promise<boolean> {
    let aKey: aead.Aead;
    let valid: boolean;

    if (this.isUnlocked()) {
      return true;
    }

    try {
      aKey = await this.deriveKey(pw);
      valid = await this.testKey(aKey);
    } catch (e) {
      throw e;
    }

    if (valid) {
      this.aeadKey = aKey;
    }

    return valid;
  }

  public async encrypt(data: Uint8Array): Promise<Uint8Array | null> {
    if (this.aeadKey) {
      return this.aeadKey.encrypt(data);
    } else {
      return null;
    }
  }

  public async decrypt(data: Uint8Array): Promise<Uint8Array | null> {
    if (this.aeadKey) {
      return this.aeadKey.decrypt(data);
    } else {
      return null;
    }
  }

  // TODO: generate random salt 
  private generateSalt(): Uint8Array {
    return Uint8Array.from([0x41]);
  }

  private async retrieveSalt(): Promise<Uint8Array> {
    let salt: Uint8Array | null;

    try {
      salt = await this.s.getSalt();
    } catch (e) {
      throw e;
    }

    if (salt === null) {
      salt = this.generateSalt();
      try {
        await this.s.clearEncrypted();
        await this.s.setSalt(salt);
      } catch (e) {
        throw e;
      }
    }

    return salt;
  }

  private async deriveKey(pw: Uint8Array): Promise<aead.Aead> {
    let salt: Uint8Array;

    try {
      salt = await this.retrieveSalt();
    } catch (e) {
      throw e;
    }

    let rawKey: Uint8Array = syncScrypt(pw, salt, sp.scryptN, sp.scryptR, sp.scryptP, 32)

    return aeadSubtle.aesGcmFromRawKey(rawKey);
  }

  private async testKey(key: aead.Aead): Promise<boolean> {
    let salt: Uint8Array | null;
    let saltCrypt: Uint8Array | null;

    try {
      salt = await this.s.getSalt();
      saltCrypt = await this.s.getSaltCrypt();
    } catch (e) {
      throw e;
    }

    if (saltCrypt == null && salt !== null) {
      // Check if first run with salt, salt will be set but not crypt
      try {
        saltCrypt = await key.encrypt(salt);
      } catch (e) {
        throw e;
      }

      this.s.setSaltCrypt(saltCrypt);
      return true;
    } else if (saltCrypt !== null && salt !== null) {
      // Not first run, both salt and crypt are set, check if they match
      let saltDecrypt: Uint8Array;
      try {
        saltDecrypt = await key.decrypt(saltCrypt);
      } catch (e) {
        throw e;
      }

      return this.compareArray(salt, saltDecrypt);
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
