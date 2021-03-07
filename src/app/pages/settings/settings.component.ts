import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, FormGroup, AbstractControl } from '@angular/forms';

import { BackgroundAction as ba, BackgroundMessage as bm, BackgroundDataType as bt, ConfigAction, StorageKeys as sk, sendBackgroundMessage } from '@models';

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
    this.elements.clear();

    sk.plaintextSettings.forEach(v => {
      this.elements.set(v, { description: sk.descriptions[v], value: "No value set", enabled: false } as SettingsEntry);
    });

    for (const key in sk.plaintextSettings) {
      let msg: bm = { action: ba.getConfigString, type: bt.string, data: key } as bm;
      let v: string | null = await sendBackgroundMessage(msg);

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

    let msg: bm = { action: ba.getConfigString, type: bt.string, data: key } as bm;

    let configValue: string | undefined = await sendBackgroundMessage(msg);
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
    this.ref.detectChanges();
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
    await this.refreshSetting(key);

    entry.enabled = false;
    this.ref.detectChanges();
  }

  private updatePlaintext(key: string, value: string): Promise<string | null> {
    let entry: ConfigAction = { key: key, isEnc: false, isArray: false, value: value } as ConfigAction;
    let msg: bm = { action: ba.putConfig, type: bt.ConfigAction, data: entry } as bm;

    return sendBackgroundMessage(msg);
  }

  private async updateEncrypted(key: string, value: string): Promise<string | null> {
    let encMsg: bm = { action: ba.encrypt, type: bt.Uint8Array, data: this.encoder.encode(value) } as bm;

    let encAny: any | null = await sendBackgroundMessage(encMsg);

    if (encAny === null) {
      // TODO: handle error or something
      return null;
    }

    let encArr: Uint8Array = encAny as Uint8Array;
    let entry: ConfigAction = { key: key, isEnc: true, isArray: true, value: encArr } as ConfigAction;
    let msg: bm = { action: ba.putConfig, type: bt.ConfigAction, data: entry } as bm;

    return sendBackgroundMessage(msg);
  }

  displayedColumns: string[] = ['key', 'description', 'value'];
}

interface SettingsEntry {
  description: string,
  value: string,
  enabled: boolean,
}
