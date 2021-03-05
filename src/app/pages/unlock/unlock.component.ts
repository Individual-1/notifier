import { ApplicationRef, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { CryptoService } from '@core/crypto/crypto.service';

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
    private c: CryptoService
  ) { }

  ngOnInit(): void {
    document.addEventListener('click', () => this.a.tick());
    document.addEventListener('mousedown', () => this.a.tick());
    document.addEventListener('focus', () => this.a.tick());
    document.addEventListener('blur', () => this.a.tick());
    document.addEventListener('keydown', () => this.a.tick());
    document.addEventListener('keyup', () => this.a.tick());
    document.addEventListener('keypress', () => this.a.tick());

    if (this.c.isUnlocked()) {
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
      try {
      let success: boolean = await this.c.unlockKey(pw);
        if (success) this.redirectHome();
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
