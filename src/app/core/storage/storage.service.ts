import { Injectable } from '@angular/core';
import { StorageKeys as sk, DatabaseParams as dp, ConfigArray, ConfigString, User, KeyCache } from "@models";

import { Dexie } from "dexie";

@Injectable({
  providedIn: 'root'
})

export class StorageService {
  private db: any;
  private ready: boolean = false;

  constructor() { this.init(); }

  private init() {
    this.createDB();
    this.connectDB();
    this.persistDB().then(
      r => { },
      (e: Error) => { console.log("persistDB error - " + e.name + ": " + e.message) }
    );
  }

  private createDB(): void {
    this.db = new Dexie(dp.dbName);
    this.db.version(1).stores(dp.schema);
  }

  private connectDB(): void {
    this.db?.open().then(
      () => { this.ready = true; },
      (e: Error) => { console.log("connectDB error - " + e.name + ": " + e.message) }
    );
  }

  private async persistDB(): Promise<boolean> {
    return navigator.storage.persist();
  }

  public getConfigArray(key: string): Promise<ConfigArray | undefined> {
    return this.db[dp.configTable].get(key);
  }

  public getConfigString(key: string): Promise<ConfigString | undefined> {
    return this.db[dp.configTable].get(key);
  }

  public getAllConfig(): Promise<Array<ConfigArray | ConfigString | undefined>> {
    return this.db[dp.configTable].bulkGet(
      [
        sk.salt,
        sk.saltCrypt,
        sk.oauthClientId,
        sk.oauthClientSecret,
        sk.authorizeURL,
        sk.accessToken,
        sk.refreshToken,
      ]
    );
  }

  public putConfig(entry: ConfigArray | ConfigString): Promise<string> {
    return this.db[dp.configTable].put(entry);
  }

  public deleteEncryptedConfig(): Promise<undefined> {
    return this.db[dp.configTable].bulkDelete(
      [
        sk.saltCrypt,
        sk.oauthClientSecret,
        sk.accessToken,
        sk.refreshToken,
      ]
    );
  }

  public getUser(userName: string): Promise<User | undefined> {
    return this.db[dp.userTable].get(userName);
  }

  public getAllUsers(): Promise<Array<User>> {
    return this.db[dp.userTable].toArray();
  }

  public putUser(entry: User): Promise<string> {
    return this.db[dp.userTable].put(entry);
  }

  public getKey(): Promise<KeyCache | undefined> {
    return this.db[dp.keyCache].get(1);
  }

  public putKey(keyValue: Uint8Array): Promise<number> {
    return this.db[dp.keyCache].put({ id: 1, key: keyValue });
  }

  public clearKey(): Promise<undefined> {
    return this.db[dp.keyCache].delete(1);
  }

}
