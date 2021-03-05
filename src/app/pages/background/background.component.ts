import { Component, OnInit } from '@angular/core';
import { CryptoService } from '@core/crypto/crypto.service';
import { TokenService } from '@core/token/token.service';
import { browser } from 'webextension-polyfill-ts';

import { BackgroundAction, BackgroundMessage } from '@models';

import { aead } from 'tink-crypto';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent implements OnInit {
  cachedAEAD: aead.Aead | null = null;

  constructor(private c: CryptoService, private t: TokenService) {
  }

  ngOnInit(): void {
    browser.runtime.onMessage.addListener((msg) => {
      return this.handleMessage(msg);
    });
  }

  private async handleMessage(msg: BackgroundMessage): Promise<any> {
    switch (msg.type) {
      case BackgroundAction.startOAuthAuthorization:
        this.t.doAuthorize();
        break;
      case BackgroundAction.setEncKey:
        if (msg.data !== null) {
          this.cachedAEAD = msg.data as aead.Aead;
        }
        break;
      case BackgroundAction.getEncKey:
        if (this.cachedAEAD !== null) {
          return this.cachedAEAD;
        }
        break;
    }
    return null;
  }

}
