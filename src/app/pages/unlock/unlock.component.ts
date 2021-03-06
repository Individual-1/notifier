import { ApplicationRef, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { BackgroundAction, BackgroundMessage } from '@models';
import { browser } from 'webextension-polyfill-ts';

@Component({
  selector: 'app-unlock',
  templateUrl: './unlock.component.html',
  styleUrls: ['./unlock.component.scss'],
})
export class UnlockComponent implements OnInit {
  private defaultMsg: string = "Enter your existing passphrase, or choose a new passphrase if you haven't";
  hintMsg: string = this.defaultMsg;

  constructor(
    private router: Router,
    private ref: ChangeDetectorRef,
    private a: ApplicationRef,
  ) { }

  async ngOnInit(): Promise<void> {
    document.addEventListener('click', () => this.a.tick());
    document.addEventListener('mousedown', () => this.a.tick());
    document.addEventListener('focus', () => this.a.tick());
    document.addEventListener('blur', () => this.a.tick());
    document.addEventListener('keydown', () => this.a.tick());
    document.addEventListener('keyup', () => this.a.tick());
    document.addEventListener('keypress', () => this.a.tick());

    let msg: BackgroundMessage = { type: BackgroundAction.isUnlocked, data: null } as BackgroundMessage;
    let resp: boolean | null = await browser.runtime.sendMessage(msg);

    if (resp !== undefined && resp !== null && resp) {
      this.router.navigate(['/']);
      this.ref.detectChanges();
    }
  }

  async submitPass() {
    this.hintMsg = this.defaultMsg;
    let rawControl: HTMLElement | null = document.getElementById("passphrase");
    let pwControl: HTMLInputElement | null = null;
    if (rawControl !== null) {
      pwControl = rawControl as HTMLInputElement;
    }
    if (pwControl !== null) {
      let enc: TextEncoder = new TextEncoder();
      let pw: Uint8Array = enc.encode(pwControl.value);
      let msg: BackgroundMessage = { type: BackgroundAction.unlockKey, data: pw } as BackgroundMessage;
      try {
      let success: boolean | null = await browser.runtime.sendMessage(msg);
        if (success !== undefined && success !== null && success) this.redirectHome();
      } catch (e) {
        this.hintMsg = e.name + ": " + e.message;
      }
    }
  }

  private redirectHome() {
    this.router.navigateByUrl('/home');
    this.ref.detectChanges();
  }

}
