import { Component } from '@angular/core';
import { ButtonModule } from 'primeng/button';
import { FileUploadModule } from 'primeng/fileupload';
import { FileSaveService } from '../core/services/fileSaver.service'

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [ButtonModule, FileUploadModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
  styles: [`.tab_content{height: 70.5rem; overflow-y: scroll;}`]
})
export class SettingsComponent {

  constructor(private fileSaveService: FileSaveService) {}

  uploadJSONWithSettings(event: any) {
    // const file = event.files[0];
    // const reader = new FileReader();
    // reader.onload = (e: any) => {
    //   this.ngZone.run(() => {
    //     try {
    //       this.parsedData = JSON.parse(e.target.result);
    //       this.massiveTests = this.parsedData.slice(0, -1);
  
    //       let settingsElement = this.parsedData.length - 1;
    //       this.pa1 = this.parsedData[settingsElement].Attenuator_PA1;
    //       this.pa2 = this.parsedData[settingsElement].Attenuator_PA2;
    //       this.splitterM3M = this.parsedData[settingsElement].splitter_to_M3M;
    //       this.splitterST = this.parsedData[settingsElement].splitter_straight;
    //       this.cable1 = this.parsedData[settingsElement].cable1;
    //       this.cable2 = this.parsedData[settingsElement].cable2;
    //       this.cable3 = this.parsedData[settingsElement].cable3;
  
    //       this.localStorage.setItem('massiveTests', this.massiveTests);
  
    //       this.cdr.detectChanges();
    //     } catch (error) {
    //       console.error('Ошибка при парсинге JSON:', error);
    //     }
    //   });
    // };
    // reader.readAsText(file);
  }

  downloadJSONWithSettings() {
  //   const settingsData : any = {
  //     Attenuator_PA1: this.pa1,
  //     Attenuator_PA2: this.pa2,
  //     splitter_to_M3M: this.splitterM3M,
  //     splitter_straight: this.splitterST,
  //     cable1: this.cable1,
  //     cable2: this.cable2,
  //     cable3: this.cable3,
  //   }

  //   const jsonDataSettings = this.massiveTests.concat(settingsData);
  //   const blob = new Blob([JSON.stringify(jsonDataSettings, null, 2)], {type: 'application/json' });
  //   this.fileSaveService.saveFile(blob);
   }

}