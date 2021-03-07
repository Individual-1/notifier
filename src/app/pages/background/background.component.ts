import { Component, OnInit } from '@angular/core';
import { CryptoService } from '@core/crypto/crypto.service';
import { TokenService } from '@core/token/token.service';
import { browser } from 'webextension-polyfill-ts';

import { BackgroundAction, BackgroundMessage, ConfigAction, deserializeMessage } from '@models';

import { StorageService } from '@core/storage/storage.service';
import { HttpClient } from '@angular/common/http';
import { UserService } from '@core/user/user.service';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent implements OnInit {
  s: StorageService;
  c: CryptoService;
  t: TokenService;
  u: UserService;

  constructor(private http: HttpClient) {
    this.s = new StorageService();
    this.c = new CryptoService(this.s);
    this.t = new TokenService(this.s, this.c, this.http);
    this.u = new UserService(this.s, this.c, this.t, this.http);
  }

  ngOnInit(): void {
    browser.runtime.onMessage.addListener((msg) => {
      return this.handleMessage(msg);
    });
  }

  // TODO: we can't pass complex objects or non-string, we need to convert everything to string
  private async handleMessage(jsonMsg: string): Promise<any> {
    let msg: BackgroundMessage | null = deserializeMessage(jsonMsg);

    if (msg === null) {
      return null;
    }

    switch (msg.action) {
      case BackgroundAction.startOAuthAuthorization:
        this.t.doAuthorize();
        break;
      case BackgroundAction.encrypt:
        if (msg.data !== null) {
          return this.c.encrypt(msg.data as Uint8Array);
        }
        break;
      case BackgroundAction.decrypt:
        if (msg.data !== null) {
          return this.c.decrypt(msg.data as Uint8Array);
        }
        break;
      case BackgroundAction.getConfigString:
        if (msg.data !== null) {
          let cfg: ConfigAction | undefined = await this.s.getConfig(msg.data as string);
          if (this.s.checkValid(msg.data as string, cfg) && !cfg!.isArray) {
            return cfg!.value as string;
          }
        }
        break;
      case BackgroundAction.getConfigArray:
        if (msg.data !== null) {
          let cfg: ConfigAction | undefined = await this.s.getConfig(msg.data as string);
          if (this.s.checkValid(msg.data as string, cfg) && cfg!.isArray) {
            return cfg!.value as Uint8Array;
          }
        }
        break;
      case BackgroundAction.putConfig:
        if (msg.data !== null) {
          return this.s.putConfig(msg.data as ConfigAction);
        }
        break;
      case BackgroundAction.unlockKey:
        if (msg.data !== null) {
          return this.c.unlockKey(msg.data as Uint8Array);
        }
        break;
      case BackgroundAction.isUnlocked:
        return this.c.isUnlocked();
      case BackgroundAction.getAllUsers:
        return this.u.serializeAllUsers();
      case BackgroundAction.removeUser:
        if (msg.data !== null) {
          this.u.removeUser(msg.data as string);
        }
    }

    return null;
  }

}
