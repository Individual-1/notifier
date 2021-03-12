import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { CryptoService } from '@core/crypto/crypto.service';
import { StorageService } from '@core/storage/storage.service';
import { TokenService } from '@core/token/token.service';

import { User, serializeUser, RedditParams as rp, ConfigAction, StorageKeys as sk, Friends, ListingReponse, ListingItem, AboutResponse, buildItemID } from '@models';

export class UserService {
  private users: Map<string, User>;
  private enabledUsers: Set<string>;
  private friends: Friends | null = null;

  constructor(private s: StorageService, private c: CryptoService, private t: TokenService, private http: HttpClient) {
    this.users = new Map<string, User>();
    this.enabledUsers = new Set<string>();
  }

  resetUsers() {
    this.users.clear();
    this.enabledUsers.clear();
    this.friends = null;
  }

  async loadUsers() {
    this.resetUsers();
    let userArray: User[] = await this.s.getAllUsers();

    userArray.forEach((user) => {
      this.users.set(user.userName, user);
    });

    let friends: Friends | undefined = await this.s.getFriends();
    if (friends !== undefined) {
      this.friends = friends;
    }
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

  public async getFriendsEnabled(): Promise<boolean> {
    return this.friends !== null;
  }

  async getUserPosts(user: User): Promise<ListingItem[] | null> {
    let queryURL: URL = new URL(rp.baseURL);

    if (user.comments && user.submitted) {
      queryURL.pathname = rp.userBase + user.userName + rp.overview;
    } else if (user.comments && !user.submitted) {
      queryURL.pathname = rp.userBase + user.userName + rp.comments;
    } else if (!user.comments && user.submitted) {
      queryURL.pathname = rp.userBase + user.userName + rp.submitted;
    } else {
      return null;
    }

    if (user.lastPost != "") {
      queryURL.searchParams.set("after", user.lastPost);
    }

    let resp: Object | null = await this.getWithRefresh(queryURL);
    if (resp !== null) {
      let respListing: ListingReponse = resp as ListingReponse;
      try {
        if (respListing.data.children.length > 0) {
          return respListing.data.children;
        }
      } catch (err) { }
    }

    return null;
  }

  async getFriendsPosts(): Promise<ListingItem[] | null> {
    if (this.friends === null) {
      return null;
    }

    let queryURL: URL = new URL(rp.baseURL);
    queryURL.pathname = rp.friendsBase;

    if (this.friends.lastSubmission != "") {
      queryURL.searchParams.set("after", this.friends.lastSubmission);
    }

    let resp: Object | null = await this.getWithRefresh(queryURL);
    if (resp !== null) {
      let respListing: ListingReponse = resp as ListingReponse;
      try {
        if (respListing.data.children.length > 0) {
          return respListing.data.children;
        }
      } catch (err) { }
    }

    return null;
  }

  async getFriendsComments(): Promise<ListingItem[] | null> {
    if (this.friends === null) {
      return null;
    }

    let queryURL: URL = new URL(rp.baseURL);
    queryURL.pathname = rp.friendsBase + rp.comments;

    if (this.friends.lastComment != "") {
      queryURL.searchParams.set("after", this.friends.lastComment);
    }

    let resp: Object | null = await this.getWithRefresh(queryURL);
    if (resp !== null) {
      let respListing: ListingReponse = resp as ListingReponse;
      try {
        if (respListing.data.children.length > 0) {
          return respListing.data.children;
        }
      } catch (err) { }
    }

    return null;
  }

  async setLastPost(user: User): Promise<User> {
    let queryURL: URL = new URL(rp.baseURL);

    if (user.comments && user.submitted) {
      queryURL.pathname = rp.userBase + user.userName + rp.overview;
    } else if (user.comments && !user.submitted) {
      queryURL.pathname = rp.userBase + user.userName + rp.comments;
    } else if (!user.comments && user.submitted) {
      queryURL.pathname = rp.userBase + user.userName + rp.submitted;
    } else {
      return user;
    }

    queryURL.searchParams.set("limit", "1");

    let resp: Object | null = await this.getWithRefresh(queryURL);
    if (resp !== null) {
      let respListing: ListingReponse = resp as ListingReponse;
      try {
        if (respListing.data.children.length > 0) {
          user.lastPost = buildItemID(respListing.data.children[0]);
        }
      } catch (err) {
      }
    }

    return user;
  }
  async setLastPostFriends(friends: Friends): Promise<Friends> {
    let queryURL: URL = new URL(rp.baseURL);

    // Submissions case
    queryURL.pathname = rp.friendsBase;
    queryURL.searchParams.set("limit", "1");

    let resp: Object | null = await this.getWithRefresh(queryURL);

    if (resp !== null) {
      let respListing: ListingReponse = resp as ListingReponse;
      try {
        if (respListing.data.children.length > 0) {
          friends.lastSubmission = buildItemID(respListing.data.children[0]);
        }
      } catch (err) { }
    }

    // Comments case
    queryURL = new URL(rp.baseURL);

    queryURL.pathname = rp.friendsBase + rp.comments;
    queryURL.searchParams.set("limit", "1");

    resp = await this.getWithRefresh(queryURL);
    if (resp !== null) {
      let respListing: ListingReponse = resp as ListingReponse;
      try {
        if (respListing.data.children.length > 0) {
          friends.lastComment = buildItemID(respListing.data.children[0]);
        }
      } catch (err) { }
    }

    return friends;
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

  public async disableFriends(): Promise<boolean> {
    if (this.friends == null) {
      return false;
    }

    this.friends = null;
    await this.s.deleteFriends();
    return true;
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

  public async enableFriends(): Promise<boolean> {
    if (this.friends !== null) {
      return false;
    }

    let friends: Friends = await this.setLastPostFriends({ key: sk.friendsKey, lastSubmission: "", lastComment: "" } as Friends);
    await this.s.putFriends(friends);
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
      comments: false,
    } as User;
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
    try {
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
