import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { CryptoService } from '@core/crypto/crypto.service';
import { StorageService } from '@core/storage/storage.service';
import { TokenService } from '@core/token/token.service';

import { User, serializeUser, deserializeUser, RedditParams as rp, ConfigAction, StorageKeys as sk, AboutResponse } from '@models';

export class UserService {
  private users: Map<string, User>;

  constructor(private s: StorageService, private c: CryptoService, private t: TokenService, private http: HttpClient) {
    this.users = new Map<string, User>();
  }

  resetUsers() {
    this.users.clear();
    this.users.set('friends', { lastPost: '', submitted: true, comments: true } as User);
  }

  async loadUsers() {
    this.resetUsers();
    let userArray: User[] = await this.s.getAllUsers();

    userArray.forEach((user) => {
      this.users.set(user.userName, user);
    });
  }

  public async serializeAllUsers(): Promise<string> {
    let jsonUsers: string[] = new Array<string>();

    this.users.forEach((user) => {
      let t: string | null = serializeUser(user);
      if (t !== null) {
        jsonUsers.push(t);
      }
    });

    return JSON.stringify(jsonUsers);
  }

  getUserPosts(user: User) {
    let queryURL: URL = new URL(rp.baseURL);

    if (user.comments && user.submitted) {
      queryURL.pathname = rp.userBase + user.userName + rp.overview;
    } else if (user.comments && !user.submitted) {
      queryURL.pathname = rp.userBase + user.userName + rp.comments;
    } else if (!user.comments && user.submitted) {
      queryURL.pathname = rp.userBase + user.userName + rp.submitted;
    } else {
      return;
    }

    if (user.lastPost != "") {
      queryURL.searchParams.set("after", user.lastPost);
    }
  }

  public async removeUser(userName: string): Promise<boolean> {
    if (!this.users.has(userName)) {
      return false;
    }

    try {
      await this.s.deleteUser(userName);
      this.users.delete(userName);
      return true;
    } catch (err) {
      return false;
    }
  }

  public async addUser(user: User): Promise<boolean> {
    if (this.users.has(user.userName)) {
      return false;
    }

    let userExtra: User | null = await this.getUserInfo(user.userName);
    if (userExtra === null) {
      return false;
    }

    user.fullName = userExtra.fullName;

    try {
      await this.s.putUser(user);
      this.users.set(user.userName, user);
    } catch (err) {
      return false;
    }

    return true;
  }

  public async getUserInfo(userName: string): Promise<User | null> {
    let queryURL: URL = new URL(rp.baseURL);
    queryURL.pathname = rp.userBase + userName + rp.about;

    let resp: Object | null = await this.getWithRefresh(queryURL);
    if (resp === null) {
      return null;
    }

    let respAbout: AboutResponse = resp as AboutResponse;

    return {  
      userName: userName,
      fullName: respAbout.kind + "_" + respAbout.data.id,
      lastPost: "",
      submitted: false,
      comments: false, } as User;
  }

  private async getAuthParams(): Promise<Object | null> {
    let cfg: ConfigAction | undefined = await this.s.getConfig(sk.accessToken);

    if (cfg === null || cfg === undefined || !cfg.isArray || !cfg.isEnc) {
      return null;
    }

    let aToken: Uint8Array | null = await this.c.decrypt(cfg.value as Uint8Array);
    if (aToken === null) {
      return null;
    }

    return {
      headers: new HttpHeaders({
        'Authorization': 'Bearer ' + this.c.decodeArray(aToken),
        'User-Agent': rp.userAgent,
      })
    };
  }

  private async getWithRefresh(url: URL) {
    let httpOptions: Object | null = await this.getAuthParams();
    if (httpOptions === null) {
      return null;
    }

    let resp: Object;
    try{
      resp = await (this.http.get(url.toString(), httpOptions)).toPromise();
      return resp;
    } catch (err) {
      // Check if this isn't an expired token issue
      if ((err as HttpErrorResponse).status !== 401) {
        return null;
      }
    }

    // if this call fails because of an invalid token, do a refresh and then retry
    await this.t.doRefresh();

    httpOptions = await this.getAuthParams();
    if (httpOptions === null) {
      return null;
    }

    return this.http.get(url.toString(), httpOptions).toPromise();
  }
}
