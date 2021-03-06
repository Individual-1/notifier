import { Injectable } from '@angular/core';
import { StorageKeys as sk, DatabaseParams as dp, ConfigAction, User, KeyCache } from "@models";

import { Dexie } from "dexie";

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

  public checkValid(key: string, action: ConfigAction | undefined): boolean {
    return (action !== undefined && sk.isArray.hasOwnProperty(key) && sk.isArray[key] == action.isArray);
  }

  private async persistDB(): Promise<boolean> {
    return navigator.storage.persist();
  }

  public getConfig(key: string): Promise<ConfigAction | undefined> {
    return this.db[dp.configTable].get(key);
  }

  public getConfigBulk(keys: Array<string>): Promise<Array<ConfigAction | undefined>> {
    return this.db[dp.configTable].bulkGet(
      keys
    );
  }

  public putConfig(entry: ConfigAction): Promise<string> {
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

}
