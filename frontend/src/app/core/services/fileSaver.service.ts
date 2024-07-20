import { Injectable } from '@angular/core';
import { saveAs } from 'file-saver';

@Injectable({
  providedIn: 'root',
})
export class FileSaveService {
  constructor() {}

  saveFile(Blob: Blob, filename: string = 'SettingsForTest.json'): void {
    saveAs(Blob, filename);
  }
}
