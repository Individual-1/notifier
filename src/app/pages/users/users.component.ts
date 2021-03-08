import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormGroup, Validators, FormBuilder, AbstractControl } from '@angular/forms';
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
  commentEnabled: boolean = false;
  submissionEnabled: boolean = false;
  friendsInput: boolean = false;

  constructor(private fb: FormBuilder, private ref: ChangeDetectorRef) {
    this.users = new Set<string>();
    this.usersForm = this.fb.group({
      usernameInput: ["", Validators.required],
      commentCheck: [false],
      submitCheck: [false],
      friendsToggle: [false],
    });
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

    this.friendsInput = this.friendsEnabled;
    this.ref.detectChanges();
  }

  async submitChanges() {
    // Update friends tracking status
    if (this.friendsEnabled != this.friendsInput) {
      let friendResp: boolean | null = null;
      if (this.friendsInput) {
        let userObj: User = { userName: 'friends', fullName: '', lastPost: '', submitted: true, comments: true } as User;
        let msg: BackgroundMessage = { action: BackgroundAction.addUser, type: BackgroundDataType.User, data: userObj } as BackgroundMessage;
        friendResp = await sendBackgroundMessage(msg)
      } else {
        let msg: BackgroundMessage = { action: BackgroundAction.removeUser, type: BackgroundDataType.string, data: 'friends' } as BackgroundMessage;
        friendResp = await sendBackgroundMessage(msg)
      }

      if (friendResp !== null && friendResp) {
      this.friendsEnabled = this.friendsInput;
      }
    }

    if (this.usersForm.valid) {
      let comments: AbstractControl | null = this.usersForm.get('commentCheck');
      let submitted: AbstractControl | null = this.usersForm.get('submitCheck');
      let userName: AbstractControl | null = this.usersForm.get('usernameInput');

      if (comments === null || submitted === null || userName === null) {
        this.setError("Failed to read form fields");
        return;
      }

      if (!(comments.value as boolean || submitted.value as boolean)) {
        this.setError("Both comments and submission cannot be disabled");
        return;
      }

      if (this.users.has(userName.value as string)) {
        this.setError("User already added");
        return;
      }

      let userObj: User = { userName: userName.value as string, fullName: '', lastPost: '', submitted: submitted.value as boolean, comments: comments.value as boolean } as User;
      let msg: BackgroundMessage = { action: BackgroundAction.addUser, type: BackgroundDataType.User, data: userObj } as BackgroundMessage;
      let resp: boolean | null = await sendBackgroundMessage(msg);

      if (resp === null || resp == false) {
        this.setError("Failed to add user");
        return;
      }

      this.users.add(userName.value as string);
      this.ref.detectChanges();
    }
  }

  setError(msg: string) {
    // TODO: implement
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

  enableEdit() {
    this.enableAdd = true;
    this.clearEdit();
    this.ref.detectChanges();
  }

  cancelEdit() {
    this.enableAdd = false;
    this.clearEdit();
    this.ref.detectChanges();
  }

  clearEdit() {
    this.commentEnabled = false;
    this.submissionEnabled = false;

    let userInput: AbstractControl | null = this.usersForm.get("usernameInput");
    if (userInput !== null) {
      userInput.setValue("");
    }
  }

  toggleFriends() {
    this.friendsInput = !this.friendsInput;
    this.ref.detectChanges();
  }

  toggleComment() {
    this.commentEnabled = !this.commentEnabled;
    this.ref.detectChanges();
  }

  toggleSubmission() {
    this.submissionEnabled = !this.submissionEnabled;
    this.ref.detectChanges();
  }
}
