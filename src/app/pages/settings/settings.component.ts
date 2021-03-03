import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

import { CryptoService } from '@core/crypto/crypto.service';
import { StorageService } from '@core/storage/storage.service';
import { ConfigArray, ConfigString, StorageKeys as sk } from '@models';

@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})

export class SettingsComponent implements OnInit {
  elements: SettingsEntry[] = [];

  constructor(private s: StorageService, private c: CryptoService) {
    this.populateSettings();
   }

  ngOnInit(): void {
  }

  async populateSettings() {
    let elementMap: Map<string, string> = new Map<string, string>();
    let plainConfigs: Array<ConfigString|undefined>;

    sk.plaintextSettings.forEach(v => {
      elementMap.set(v, "No value set");
    });

    plainConfigs = await this.s.getConfigBulkString(sk.plaintextSettings);
    plainConfigs.forEach(v => {
      if (v !== undefined) elementMap.set(v.key, v.value);
    });

    sk.encryptedSettings.forEach(v => {
      elementMap.set(v, 'Encrypted value');
    });

    this.elements.length = 0;
    elementMap.forEach((v, k) => {
      this.elements.push({key: k, value: v} as SettingsEntry)
    });
  }

  public onUpdate(entry: SettingsEntry) {
    console.log(entry.key);
  }

  displayedColumns: string[] = ['key', 'value'];

}

interface SettingsEntry {
  key: string,
  value: string,
  selected?: boolean,
}
