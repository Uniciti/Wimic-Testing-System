import { Component, NgZone, OnInit, ViewChild } from '@angular/core';

import { ButtonModule } from 'primeng/button';
import { FileUpload, FileUploadModule } from 'primeng/fileupload';

import { FileSaveService } from '../core/services/fileSaver.service'
import { QueueCommunicationService } from '../core/services/QueueCommunication.service';
import { SettingsService } from '../core/services/settings.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ButtonModule, FileUploadModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  styles: [`.tab_content{height: 70.5rem; overflow-y: scroll;}`]
})
export class SettingsComponent implements OnInit {
  
  @ViewChild('fileUpload') fileUpload!: FileUpload;
  settingsData: any;
  parsedData: any;

  constructor(
    private fileSaveService: FileSaveService,
    private ngZone: NgZone,
    private testService: QueueCommunicationService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.settingsService.settings$.subscribe(data => {
      if (data) {
        this.settingsData = { ...data }; // Создаем копию объекта
      } else {
        console.warn('Received null settings data');
      }
    });
  }

  uploadJSONWithSettings(event: any) {
    const file = event.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.ngZone.run(() => {
        try {
          this.parsedData = JSON.parse(e.target.result);
          this.testService.loadTests(this.parsedData);

          const settingsElement = this.parsedData[this.parsedData.length - 1];
          this.settingsService.updateSettings(settingsElement);
          console.log("SETTINGS ELEMENT: ",settingsElement);
          this.fileUpload.clear();
        } catch (error) {
          console.error('Ошибка при парсинге JSON:', error);
        }
      });
    };
    reader.readAsText(file);
  }

  // downloadJSONWithSettings() {

  //   const jsonDataSettings = this.testService.getTests().concat(this.settingsData);
  //   const blob = new Blob([JSON.stringify(jsonDataSettings, null, 2)], {type: 'application/json' });
  //   this.fileSaveService.saveFile(blob);
  //  }
  downloadJSONWithSettings() {
    const tests = this.testService.getTests();
    if (this.settingsData) {
      const jsonDataSettings = [...tests, this.settingsData];
      const blob = new Blob([JSON.stringify(jsonDataSettings, null, 2)], {type: 'application/json'});
      this.fileSaveService.saveFile(blob);
    } else {
      console.error('Settings data is null or undefined');
      // Здесь вы можете добавить уведомление пользователю о том, что данные настроек отсутствуют
    }
  }
}