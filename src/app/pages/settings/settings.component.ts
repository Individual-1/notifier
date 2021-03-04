import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';

import { CryptoService } from '@core/crypto/crypto.service';
import { StorageService } from '@core/storage/storage.service';
import { ConfigArray, ConfigString, StorageKeys as sk } from '@models';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})

export class SettingsComponent implements OnInit {
  elements: Map<string, SettingsEntry> = new Map<string, SettingsEntry>();
  settingsForm: FormGroup;

  constructor(private fb: FormBuilder, private ref: ChangeDetectorRef, private s: StorageService, private c: CryptoService) {
    this.initialSettings();
    this.settingsForm = fb.group({
    });
  }

  ngOnInit(): void {
  }

  async initialSettings() {
    let plainConfigs: Array<ConfigString | undefined>;

    this.elements.clear();

    sk.plaintextSettings.forEach(v => {
      this.elements.set(v, { description: sk.descriptions[v], value: "No value set", enabled: false } as SettingsEntry);
    });

    plainConfigs = await this.s.getConfigBulkString(sk.plaintextSettings);
    plainConfigs.forEach(v => {
      if (v !== undefined) {
        let entry: SettingsEntry = { description: sk.descriptions[v.key], value: v.value, enabled: false } as SettingsEntry;
        this.elements.set(v.key, entry);
      }
    });

    sk.encryptedSettings.forEach(v => {
      this.elements.set(v, { description: sk.descriptions[v], value: 'Encrypted value', enabled: false } as SettingsEntry);
    });
  }

  private async refreshSetting(key: string): Promise<boolean> {
    if (sk.encryptedSettings.includes(key)) {
      return false;
    }

    let plainConfig: ConfigString | undefined = await this.s.getConfigString(key);
    if (plainConfig !== undefined) {
      let entry: SettingsEntry = { description: sk.descriptions[key], value: plainConfig.value, enabled: false } as SettingsEntry;
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
      this.ref.markForCheck();
    }

    entry.enabled = false;
  }

  private updatePlaintext(key: string, value: string): Promise<string | null> {
    let entry: ConfigString = { key: key, isEnc: false, value: value } as ConfigString;
    return this.s.putConfig(entry);
  }

  private async updateEncrypted(key: string, value: string): Promise<string | null> {
    let encArr: Uint8Array | null = await this.c.encrypt(this.c.encodeString(value));

    if (encArr === null) {
      // TODO: handle error or something
      return null;
    }

    let entry: ConfigArray = { key: key, isEnc: true, value: encArr } as ConfigArray;
    return this.s.putConfig(entry);
  }

  displayedColumns: string[] = ['key', 'description', 'value'];

}

interface SettingsEntry {
  description: string,
  value: string,
  enabled: boolean,
}
