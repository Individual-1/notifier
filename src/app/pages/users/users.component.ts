import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { User, serializeUser, deserializeUser, BackgroundMessage, BackgroundAction, BackgroundDataType, sendBackgroundMessage } from '@models';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  users: Set<string>;
  usersForm: FormGroup;
  enableAdd: boolean = false;
  friendsEnabled: boolean = false;

  constructor(private fb: FormBuilder, private ref: ChangeDetectorRef) {
    this.users = new Set<string>();
    this.usersForm = fb.group({});
   }

  ngOnInit(): void {
    this.loadAllUsers();
  }

  async loadAllUsers() {
    let msg: BackgroundMessage = { action: BackgroundAction.getAllUsers, type: BackgroundDataType.null, data: null } as BackgroundMessage;
    let jsResp: string | null = await sendBackgroundMessage(msg);

    if (jsResp === null || jsResp === undefined) {
      return;
    }

    let userJsArray: string[] = JSON.parse(jsResp);

    this.users.clear();

    userJsArray.forEach((jsUser) => {
      let user: User | null = deserializeUser(jsUser);

      if (user !== null) {
        if (user.userName == 'friends') {
          this.friendsEnabled = true;
        } else {
          this.users.add(user.userName);
        }
      }
    });

    this.ref.detectChanges();
  }

  removeUser(user: string) {
    if (!this.users.has(user)) {
      return;
    }

    let msg: BackgroundMessage = { action: BackgroundAction.removeUser, type: BackgroundDataType.string, data: user } as BackgroundMessage;
    sendBackgroundMessage(msg);
    this.users.delete(user);

    this.ref.detectChanges();
  }

  addUser(user:string, comments: boolean, submitted: boolean) {
    if (this.users.has(user)) {
      return;
    }

    let userObj: User = { userName: user, fullName: '', lastPost: '', submitted: submitted, comments: comments } as User;
    let msg: BackgroundMessage = { action: BackgroundAction.addUser, type: BackgroundDataType.User, data: userObj } as BackgroundMessage;
    sendBackgroundMessage(msg)
    this.users.add(user);

    this.ref.detectChanges();
  }

  toggleFriends() {
    if (this.friendsEnabled) {
      let msg: BackgroundMessage = { action: BackgroundAction.removeUser, type: BackgroundDataType.string, data: 'friends' } as BackgroundMessage;
      sendBackgroundMessage(msg)
    } else {
      let userObj: User = { userName: 'friends', fullName: '', lastPost: '', submitted: true, comments: true } as User;
      let msg: BackgroundMessage = { action: BackgroundAction.addUser, type: BackgroundDataType.User, data: userObj } as BackgroundMessage;
      sendBackgroundMessage(msg)
    }

    this.friendsEnabled = !this.friendsEnabled;
    this.ref.detectChanges();
  }
}
