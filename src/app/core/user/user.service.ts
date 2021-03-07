import { HttpClient } from '@angular/common/http';
import { CryptoService } from '@core/crypto/crypto.service';
import { StorageService } from '@core/storage/storage.service';

import { User, serializeUser, deserializeUser, RedditParams as rp } from '@models';

export class UserService {
  private users: Map<string, User>;

  constructor(private s: StorageService, private c: CryptoService, private http: HttpClient) {
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
}
