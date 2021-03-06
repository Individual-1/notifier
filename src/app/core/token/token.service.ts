import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

import { CryptoService } from '@core/crypto/crypto.service';
import { StorageService } from '@core/storage/storage.service';
import { StorageKeys as sk, OAuthParams as op, ConfigAction, OAuthCodeResponse, OAuthCodeRequest } from '@models';

import { browser } from "webextension-polyfill-ts";
import { toBase64 } from "@aws-sdk/util-base64-browser";
import { Observable } from 'rxjs';

export class TokenService {
  constructor(private s: StorageService, private c: CryptoService, private http: HttpClient) { }

  private genBasicAuth(user: string, pass: string): string {
    let authString: string = user + ":" + pass;
    return toBase64(this.c.encodeString(authString));
  }

  public getRedirectURL(): string {
    return browser.identity.getRedirectURL();
  }

  public async doAuthorize() {
    let clientIdEntry: ConfigAction | undefined;

    clientIdEntry = await this.s.getConfig(sk.oauthClientId);

    if (clientIdEntry === undefined || clientIdEntry.isArray) {
      // TODO: error out because of unset parameters or incorrect format
      return;
    }

    let state: string = toBase64(this.c.generateRandomArray(32));

    let returnURL: string = "";
    try {
      returnURL = await this.authorize(clientIdEntry.value as string, state);
    } catch (err) {
      console.log(err.message);
      return;
    }

    let parsedURL: URL = new URL(returnURL);
    let clientSecretEntry: ConfigAction | undefined;

    clientSecretEntry = await this.s.getConfig(sk.oauthClientSecret);

    if (clientSecretEntry === undefined || !clientSecretEntry.isArray) {
      // TODO: error out because of unset parameters or wrong type
      return;
    }

    let clientSecretArray: Uint8Array | null = await this.c.decrypt(clientSecretEntry.value as Uint8Array);
    if (clientSecretArray === null) {
      // TODO: failed to decrypt client secret
      return;
    }

    let clientSecret: string = this.c.decodeArray(clientSecretArray);

    if (parsedURL.searchParams.has("error")) {
      // TODO handle the error
      return;
    }

    let retState: string | null = parsedURL.searchParams.get("state");
    if (retState === null || state !== retState) {
      // TODO handle error
      return;
    }


    let code: string | null = parsedURL.searchParams.get("code");
    if (code === null) {
      // TODO handle error
      return;
    }

    this.retrieveToken(this.genBasicAuth(clientIdEntry.value as string, clientSecret), code)
    .subscribe(resp => this.saveTokens(resp));
  }

  public async doRefresh() {
    let clientIdEntry: ConfigAction | undefined;
    let clientSecretEntry: ConfigAction | undefined;

    clientIdEntry = await this.s.getConfig(sk.oauthClientId);
    clientSecretEntry = await this.s.getConfig(sk.oauthClientSecret);

    if (!this.s.checkValid(sk.oauthClientId, clientIdEntry) || !this.s.checkValid(sk.oauthClientSecret, clientSecretEntry)) {
      // TODO: error out because of unset parameters or wrong types
      return;
    }

    let clientSecretArray: Uint8Array | null = await this.c.decrypt(clientSecretEntry!.value as Uint8Array);
    if (clientSecretArray === null) {
      // TODO: failed to decrypt client secret
      return;
    }

    let clientSecret: string = this.c.decodeArray(clientSecretArray);

    let refreshEntry: ConfigAction | undefined;

    refreshEntry = await this.s.getConfig(sk.refreshToken);

    if (!this.s.checkValid(sk.refreshToken, refreshEntry)) {
      // TODO: handle error for missing entry
      return;
    }

    let refreshArray: Uint8Array | null = await this.c.decrypt(refreshEntry!.value as Uint8Array);
    if (refreshArray === null) {
      // Handle decryption failure
      return;
    }

    this.refreshToken(this.genBasicAuth(clientIdEntry!.value as string, clientSecret), this.c.decodeArray(refreshArray))
    .subscribe(resp => this.saveTokens(resp));
  }

  private authorize(clientId: string, state: string): Promise<string> {
    let oauthURL: URL = new URL(op.authURL);
    oauthURL.searchParams.set("client_id", clientId);
    oauthURL.searchParams.set("response_type", op.responseType);
    oauthURL.searchParams.set("state", state);
    oauthURL.searchParams.set("redirect_uri", this.getRedirectURL());
    oauthURL.searchParams.set("duration", op.duration);
    oauthURL.searchParams.set("scope", op.scopes.join(' '));

    return browser.identity.launchWebAuthFlow({
      interactive: true,
      url: oauthURL.toString()
    });
  }

  private retrieveToken(authHeader: string, code: string): Observable<OAuthCodeResponse> {
    const payload: HttpParams = new HttpParams()
      .set('grant_type', 'authorization_code')
      .set('code', code)
      .set('redirect_uri', this.getRedirectURL());

    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': 'Basic ' + authHeader
      })
    };

    return this.http.post<OAuthCodeResponse>(op.tokenURL, payload, httpOptions);
  }

  private refreshToken(authHeader: string, refreshToken: string): Observable<OAuthCodeResponse> {
    const payload: HttpParams = new HttpParams()
      .set('grant_type', 'refresh_token')
      .set('refresh_token', refreshToken);

    const httpOptions = {
      headers: new HttpHeaders({
        'Authorization': 'Basic ' + authHeader
      })
    };

    return this.http.post<OAuthCodeResponse>(op.tokenURL, payload, httpOptions);
  }

  private async saveTokens(resp: OAuthCodeResponse) {
    // Save access token
    if (resp.access_token != "") {
      // Encrypt the token first then store it in database
      let encAccess: Uint8Array | null = await this.c.encrypt(this.c.encodeString(resp.access_token));

      if (encAccess !== null) {
        let newEntry: ConfigAction = {
          key: sk.accessToken,
          isEnc: true,
          isArray: true,
          value: encAccess
        };

        this.s.putConfig(newEntry);
      }
    }

    if (resp.refresh_token != "") {
      // Encrypt the token first then store it in database
      let encRefresh: Uint8Array | null = await this.c.encrypt(this.c.encodeString(resp.refresh_token));

      if (encRefresh !== null) {
        let newEntry: ConfigAction = {
          key: sk.refreshToken,
          isEnc: true,
          isArray: true,
          value: encRefresh
        };

        this.s.putConfig(newEntry);
      }
    }
  }
}