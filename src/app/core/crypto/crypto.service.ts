import { StorageService } from '@core/storage/storage.service'
import { ScryptParams as sp, StorageKeys as sk, ConfigAction, KeyCache, BackgroundAction, BackgroundMessage } from "@models";

import { browser } from 'webextension-polyfill-ts';
import { aead, aeadSubtle } from "tink-crypto";
import { syncScrypt } from "scrypt-js";

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

    return false;
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
    }

    return valid;
  }

  public async encrypt(data: Uint8Array): Promise<Uint8Array | null> {
    if (this.aeadKey !== null && this.aeadKey !== undefined) {
      return this.aeadKey.encrypt(data);
    }

    return null;
  }

  public async decrypt(data: Uint8Array): Promise<Uint8Array | null> {
    if (this.aeadKey !== null && this.aeadKey !== undefined) {
      return this.aeadKey.decrypt(data);
    }

    return null;
  }

  // TODO: generate random salt 
  public generateRandomArray(len: number): Uint8Array {
    return Uint8Array.from([0x41]);
  }

  public isAead(obj: Object): boolean {
    return true;
  }

  private async retrieveSalt(): Promise<Uint8Array> {
    let saltEntry: ConfigAction | undefined;
    let salt: Uint8Array;

    saltEntry = await this.s.getConfig(sk.salt);

    if (saltEntry === undefined) {
      salt = this.generateRandomArray(32);
      let newEntry: ConfigAction = {
        key: sk.salt,
        isEnc: false,
        isArray: true,
        value: salt,
      };

      await this.s.deleteEncryptedConfig();
      await this.s.putConfig(newEntry);
    } else {
      salt = saltEntry.value as Uint8Array;
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
    let saltEntry: ConfigAction | undefined;
    let saltCryptEntry: ConfigAction | undefined;

    saltEntry = await this.s.getConfig(sk.salt);
    saltCryptEntry = await this.s.getConfig(sk.saltCrypt);

    if (saltCryptEntry === undefined && saltEntry !== undefined && saltEntry.isArray) {
      // Check if first run with salt, salt will be set but not crypt
      let saltCrypt: Uint8Array = await key.encrypt(saltEntry.value as Uint8Array);
      let newEntry: ConfigAction = {
        key: sk.saltCrypt,
        isEnc: true,
        isArray: true,
        value: saltCrypt
      }

      this.s.putConfig(newEntry);
      return true;
    } else if (saltCryptEntry !== undefined && saltEntry !== undefined && saltEntry.isArray) {
      // Not first run, both salt and crypt are set, check if they match
      let saltDecrypt: Uint8Array;
      try {
        saltDecrypt = await key.decrypt(saltCryptEntry.value as Uint8Array);
      } catch (err) {
        console.log(err.message);
        return false;
      }

      return saltEntry.isArray && this.compareArray(saltEntry.value as Uint8Array, saltDecrypt);
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
