import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';

import { CryptoService } from '@core/crypto/crypto.service';
import { StorageService } from '@core/storage/storage.service';
import { StorageKeys as sk, OAuthParams as op, ConfigArray, ConfigString, OAuthCodeResponse, OAuthCodeRequest } from '@models';

import { browser } from "webextension-polyfill-ts";
import { toBase64 } from "@aws-sdk/util-base64-browser";
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private redirectURL: string = browser.identity.getRedirectURL();

  constructor(private s: StorageService, private c: CryptoService, private http: HttpClient) { }

  private genBasicAuth(user: string, pass: string): string {
    let authString: string = user + ":" + pass;
    return toBase64(this.c.encodeString(authString));
  }

  public getRedirectURL(): string {
    return browser.identity.getRedirectURL();
  }

  public async doAuthorize() {
    let clientIdEntry: ConfigString | undefined;
    let clientSecretEntry: ConfigArray | undefined;

    clientIdEntry = await this.s.getConfigString(sk.oauthClientId);
    clientSecretEntry = await this.s.getConfigArray(sk.oauthClientSecret);

    if (clientIdEntry === undefined || clientSecretEntry === undefined) {
      // TODO: error out because of unset parameters
      return;
    }

    let clientSecretArray: Uint8Array | null = await this.c.decrypt(clientSecretEntry.value);
    if (clientSecretArray === null) {
      // TODO: failed to decrypt client secret
      return;
    }

    let clientSecret: string = this.c.decodeArray(clientSecretArray);
    let state: string = toBase64(this.c.generateRandomArray(32));

    let returnURL: string = await this.authorize(clientIdEntry.value, state);
    let parsedURL: URL = new URL(returnURL);

    if (parsedURL.searchParams.has("error")) {
      // TODO handle the error
      return;
    }

    let retState: string | null = parsedURL.searchParams.get("state");
    if (retState === null || state != retState) {
      // TODO handle error
      return;
    }

    let code: string | null = parsedURL.searchParams.get("code");
    if (code === null) {
      // TODO handle error
      return;
    }

    this.retrieveToken(this.genBasicAuth(clientIdEntry.value, clientSecret), code)
    .subscribe(resp => this.saveTokens(resp));
  }

  public async doRefresh() {
    let clientIdEntry: ConfigString | undefined;
    let clientSecretEntry: ConfigArray | undefined;

    clientIdEntry = await this.s.getConfigString(sk.oauthClientId);
    clientSecretEntry = await this.s.getConfigArray(sk.oauthClientSecret);

    if (clientIdEntry === undefined || clientSecretEntry === undefined) {
      // TODO: error out because of unset parameters
      return;
    }

    let clientSecretArray: Uint8Array | null = await this.c.decrypt(clientSecretEntry.value);
    if (clientSecretArray === null) {
      // TODO: failed to decrypt client secret
      return;
    }

    let clientSecret: string = this.c.decodeArray(clientSecretArray);

    let refreshEntry: ConfigArray | undefined;

    refreshEntry = await this.s.getConfigArray(sk.refreshToken);

    if (refreshEntry === undefined) {
      // TODO: handle error for missing entry
      return;
    }

    let refreshArray: Uint8Array | null = await this.c.decrypt(refreshEntry.value);
    if (refreshArray === null) {
      // Handle decryption failure
      return;
    }

    this.refreshToken(this.genBasicAuth(clientIdEntry.value, clientSecret), this.c.decodeArray(refreshArray))
    .subscribe(resp => this.saveTokens(resp));
  }

  private authorize(clientId: string, state: string): Promise<string> {
    let oauthURL: URL = new URL(op.authURL);
    oauthURL.searchParams.set("client_id", clientId);
    oauthURL.searchParams.set("response_type", op.responseType);
    oauthURL.searchParams.set("state", state);
    oauthURL.searchParams.set("redirect_uri", encodeURIComponent(this.redirectURL));
    oauthURL.searchParams.set("duration", op.duration);
    oauthURL.searchParams.set("scope", encodeURIComponent(op.scopes.join(' ')));

    return browser.identity.launchWebAuthFlow({
      interactive: true,
      url: oauthURL.toString()
    });
  }

  private retrieveToken(authHeader: string, code: string): Observable<OAuthCodeResponse> {
    const payload: HttpParams = new HttpParams()
      .set('grant_type', 'authorization_code')
      .set('code', code)
      .set('redirect_uri', this.redirectURL);

    const httpOptions = {
      headers: new HttpHeaders({
        Authorization: authHeader
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
        Authorization: authHeader
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
        let newEntry: ConfigArray = {
          key: sk.accessToken,
          isEnc: true,
          value: encAccess
        };

        this.s.putConfig(newEntry);
      }
    }

    if (resp.refresh_token != "") {
      // Encrypt the token first then store it in database
      let encRefresh: Uint8Array | null = await this.c.encrypt(this.c.encodeString(resp.refresh_token));

      if (encRefresh !== null) {
        let newEntry: ConfigArray = {
          key: sk.refreshToken,
          isEnc: true,
          value: encRefresh
        };

        this.s.putConfig(newEntry);
      }
    }
  }
}