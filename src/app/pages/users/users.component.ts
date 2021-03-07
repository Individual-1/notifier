import { Component, OnInit } from '@angular/core';
import { User, serializeUser, deserializeUser, BackgroundMessage, BackgroundAction, BackgroundDataType, sendBackgroundMessage } from '@models';

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss']
})
export class UsersComponent implements OnInit {
  

  constructor() { }

  ngOnInit(): void {
  }

  async loadAllUsers() {
    let msg: BackgroundMessage = { action: BackgroundAction.getAllUsers, type: BackgroundDataType.null, data: null } as BackgroundMessage;
    let jsResp: string | null = await sendBackgroundMessage(msg);

    if (jsResp === null || jsResp === undefined) {
      return;
    }

    let userJsArray: string[] = JSON.parse(jsResp);
    let userArray: User[] = new Array<User>();

    userJsArray.forEach((jsUser) => {
      let user: User | null = deserializeUser(jsUser);

      if (user !== null) {
        userArray.push(user);
      }
    });


  }



}
