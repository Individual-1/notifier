import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl } from '@angular/forms';

import { BackgroundAction, BackgroundMessage, ConfigAction, StorageKeys as sk } from '@models';
import { browser } from 'webextension-polyfill-ts';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})

export class SettingsComponent implements OnInit {
  elements: Map<string, SettingsEntry> = new Map<string, SettingsEntry>();
  settingsForm: FormGroup;
  encoder: TextEncoder = new TextEncoder();

  constructor(private fb: FormBuilder, private ref: ChangeDetectorRef) {
    this.settingsForm = fb.group({});
  }

  ngOnInit(): void {
    this.initialSettings();
  }

  async initialSettings() {
    let plainConfigs: Array<ConfigAction | undefined>;

    this.elements.clear();

    sk.plaintextSettings.forEach(v => {
      this.elements.set(v, { description: sk.descriptions[v], value: "No value set", enabled: false } as SettingsEntry);
    });

    for (const key in sk.plaintextSettings) {
      let msg: BackgroundMessage = { type: BackgroundAction.getConfigString, data: key } as BackgroundMessage;
      let v: string | null = await browser.runtime.sendMessage(msg);

      if (v !== undefined && v !== null) {
        let entry: SettingsEntry = { description: sk.descriptions[key], value: v, enabled: false } as SettingsEntry;
        this.elements.set(key, entry);
      }
    }

    sk.encryptedSettings.forEach(v => {
      this.elements.set(v, { description: sk.descriptions[v], value: 'Encrypted value', enabled: false } as SettingsEntry);
    });

    this.ref.detectChanges();
  }

  private async refreshSetting(key: string): Promise<boolean> {
    if (sk.encryptedSettings.includes(key)) {
      return false;
    }

    let msg: BackgroundMessage = { type: BackgroundAction.getConfigString, data: key } as BackgroundMessage;
    let configValue: string | undefined = await browser.runtime.sendMessage(msg);
    if (configValue !== undefined) {
      let entry: SettingsEntry = { description: sk.descriptions[key], value: configValue, enabled: false } as SettingsEntry;
      this.elements.set(key, entry);
    } else {
      return false;
    }

    return true;
  }

  public enableEdit(key: string, entry: SettingsEntry) {
    let exists: AbstractControl | null = this.settingsForm.get(key);

    if (exists === null) {
      this.settingsForm.addControl(key, this.fb.control(null));
    }

    exists = this.settingsForm.get(key);
    if (exists === null) {
      //TODO: something went wrong
      return;
    }

    exists.setValue(entry.value);

    entry.enabled = true;
  }

  async updateSetting(key: string, entry: SettingsEntry) {
    let form: AbstractControl | null = this.settingsForm.get(key);

    if (form === null) {
      // TODO: handle error or something
      return;
    }

    let newVal: string = form.value;

    if (newVal == "") {
      // TODO: handle error or something
      return;
    }

    let result: Promise<string | null>;
    if (sk.plaintextSettings.includes(key)) {
      result = this.updatePlaintext(key, newVal);
    } else {
      result = this.updateEncrypted(key, newVal);
    }

    await result;
    if (await this.refreshSetting(key)) {
      this.ref.detectChanges();
    }

    entry.enabled = false;
  }

  private updatePlaintext(key: string, value: string): Promise<string | null> {
    let entry: ConfigAction = { key: key, isEnc: false, isArray: false, value: value } as ConfigAction;
    let msg: BackgroundMessage = { type: BackgroundAction.putConfig, data: entry } as BackgroundMessage;
    return browser.runtime.sendMessage(msg);
  }

  private async updateEncrypted(key: string, value: string): Promise<string | null> {
    let encMsg: BackgroundMessage = { type: BackgroundAction.encrypt, data: this.encoder.encode(value) } as BackgroundMessage;
    let encAny: any | null = await browser.runtime.sendMessage(encMsg);

    if (encAny === null) {
      // TODO: handle error or something
      return null;
    }

    let encArr: Uint8Array = encAny as Uint8Array;
    let entry: ConfigAction = { key: key, isEnc: true, isArray: true, value: encArr } as ConfigAction;
    let msg: BackgroundMessage = { type: BackgroundAction.putConfig, data: entry } as BackgroundMessage;
    return browser.runtime.sendMessage(msg);
  }

  displayedColumns: string[] = ['key', 'description', 'value'];
}

interface SettingsEntry {
  description: string,
  value: string,
  enabled: boolean,
}
