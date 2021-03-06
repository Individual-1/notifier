import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Router } from '@angular/router';
import { browser } from 'webextension-polyfill-ts';

import { BackgroundAction, BackgroundDataType, BackgroundMessage, sendBackgroundMessage } from '@models';

@Component({
  selector: 'app-oauth',
  templateUrl: './oauth.component.html',
  styleUrls: ['./oauth.component.scss']
})
export class OauthComponent implements OnInit {
  authForm: FormGroup = this.formBuilder.group({
  });
  constructor(
    private router: Router,
    private formBuilder: FormBuilder,
  ) { }

  ngOnInit(): void {
  }

  startAuth() {
    let msg: BackgroundMessage = { action: BackgroundAction.startOAuthAuthorization, type: BackgroundDataType.null, data: null } as BackgroundMessage;

    sendBackgroundMessage(msg);
  }

  getRedirectURL(): string {
    return browser.identity.getRedirectURL();
  }

}
