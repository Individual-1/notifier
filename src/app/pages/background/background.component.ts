import { Component, OnInit } from '@angular/core';
import { CryptoService } from '@core/crypto/crypto.service';
import { TokenService } from '@core/token/token.service';
import { browser, Runtime } from 'webextension-polyfill-ts';

import { BackgroundAction, BackgroundMessage } from '@models';

import { aead } from 'tink-crypto';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent implements OnInit {
  cachedAEAD: aead.Aead | null = null;

  constructor(private c: CryptoService, private t: TokenService) { }

  ngOnInit(): void {
    browser.runtime.onMessage.addListener((msg) => {
      return this.handleMessage(msg);
    });
  }

  private async handleMessage(msg: BackgroundMessage): Promise<BackgroundMessage> {
    let resp: BackgroundMessage = { action: BackgroundAction.error, data: null } as BackgroundMessage;
    switch (msg.action) {
      case BackgroundAction.startOAuthAuthorization:
        this.t.doAuthorize();
        resp.action = BackgroundAction.success;
        break;
      case BackgroundAction.setEncKey:
        if (msg.data !== null) {
          this.cachedAEAD = msg.data as aead.Aead;
        }
        resp.action = BackgroundAction.success;
        break;
      case BackgroundAction.getEncKey:
        resp.action = BackgroundAction.success;
        if (this.cachedAEAD !== null) {
          resp.data = this.cachedAEAD;
        }
        break;
    }
    return resp;
  }

}
