import { Component, OnInit } from '@angular/core';
import { CryptoService } from '@core/crypto/crypto.service';
import { TokenService } from '@core/token/token.service';
import { browser } from 'webextension-polyfill-ts';

import { BackgroundAction, BackgroundMessage } from '@models';

@Component({
  selector: 'app-background',
  templateUrl: './background.component.html',
  styleUrls: ['./background.component.scss']
})
export class BackgroundComponent implements OnInit {

  constructor(private c: CryptoService, private t: TokenService) { }

  ngOnInit(): void {
    browser.runtime.onMessage.addListener((msg) => {
      this.handleMessage(msg); 
    });
  }

   private handleMessage(msg: BackgroundMessage) {
    if (msg.action == BackgroundAction.startOAuthAuthorization) {
      this.t.doAuthorize();
    }
  } 

}
