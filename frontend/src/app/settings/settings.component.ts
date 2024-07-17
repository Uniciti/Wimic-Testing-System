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
      this.settingsData = data;
    });
  }

  uploadJSONWithSettings(event: any) {
    const file = event.files[0];
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.ngZone.run(() => {
        try {
          this.parsedData = JSON.parse(e.target.result);
          // //this.massiveTests = this.parsedData.slice(0, -1);
          // const currentTests = this.testService.testsSubject.value;
          // currentTests.push(this.parsedData.slice(0, -1));
          // this.testService.testsSubject.next(currentTests);
          this.testService.loadTests(this.parsedData);

          const settingsElement = this.parsedData[this.parsedData.length - 1];
          this.settingsService.updateSettings(settingsElement);
          // this.pa1 = this.parsedData[settingsElement].Attenuator_PA1;
          // this.pa2 = this.parsedData[settingsElement].Attenuator_PA2;
          // this.splitterM3M = this.parsedData[settingsElement].splitter_to_M3M;
          // this.splitterST = this.parsedData[settingsElement].splitter_straight;
          // this.cable1 = this.parsedData[settingsElement].cable1;
          // this.cable2 = this.parsedData[settingsElement].cable2;
          // this.cable3 = this.parsedData[settingsElement].cable3;
  
          //this.localStorage.setItem('massiveTests', this.massiveTests);
  
          //this.cdr.detectChanges();
          this.fileUpload.clear();
        } catch (error) {
          console.error('Ошибка при парсинге JSON:', error);
        }
      });
    };
    reader.readAsText(file);
  }

  downloadJSONWithSettings() {

    const jsonDataSettings = this.testService.getTests().concat(this.settingsData);
    const blob = new Blob([JSON.stringify(jsonDataSettings, null, 2)], {type: 'application/json' });
    this.fileSaveService.saveFile(blob);
   }

}