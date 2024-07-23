import { Component, NgZone, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { FileUploadModule } from "primeng/fileupload";
import { ButtonModule } from "primeng/button"; // Import PrimeNG ButtonModule
import { FileSaveService } from "../core/services/fileSaver.service";
import { QueueCommunicationService } from "../core/services/QueueCommunication.service";
import { SettingsService } from "../core/services/settings.service";

@Component({
  selector: "app-settings",
  standalone: true,
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.css"],
  imports: [CommonModule, FormsModule, FileUploadModule, ButtonModule], // Import PrimeNG modules here
})
export class SettingsComponent implements OnInit {
  settingsData: any;
  parsedData: any;
  stationVersions: any[] = []; // Array for station versions
  selectedStationVersion: any; // Model for selected station version
  bandwidthOptions: any[] = []; // Array for bandwidth options
  selectedBandwidth: any; // Model for selected bandwidth
  modulations: any[] = []; // Array for modulations

  constructor(
    private fileSaveService: FileSaveService,
    private ngZone: NgZone,
    private testService: QueueCommunicationService,
    private settingsService: SettingsService
  ) {}

  ngOnInit(): void {
    this.settingsService.settings$.subscribe((data) => {
      if (data) {
        this.settingsData = { ...data }; // Create a copy of the object
      } else {
        console.warn("Received null settings data");
      }
    });

    // Initialize station versions
    this.stationVersions = [
      { label: "M-1", value: "M-1" },
      { label: "M-2", value: "M-2" },
      { label: "U", value: "U" },
    ];

    // Initialize bandwidth options
    this.bandwidthOptions = [
      { label: "10", value: 10 },
      { label: "20", value: 20 },
    ];

    // Initialize modulations
    this.modulations = [
      { name: "BPSK 1/2", speed: null, sensitivity: null },
      { name: "QPSK 1/2", speed: null, sensitivity: null },
      { name: "QPSK 3/4", speed: null, sensitivity: null },
      { name: "QAM16 1/2", speed: null, sensitivity: null },
      { name: "QAM16 3/4", speed: null, sensitivity: null },
      { name: "QAM64 2/3", speed: null, sensitivity: null },
      { name: "QAM64 3/4", speed: null, sensitivity: null },
    ];
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
          console.log("SETTINGS ELEMENT: ", settingsElement);
          event.target.value = ""; // Clear the file input
        } catch (error) {
          console.error("Ошибка при парсинге JSON:", error);
        }
      });
    };
    reader.readAsText(file);
  }

  downloadJSONWithSettings() {
    const tests = this.testService.getTests();
    if (this.settingsData) {
      const jsonDataSettings = [...tests, this.settingsData];
      const blob = new Blob([JSON.stringify(jsonDataSettings, null, 2)], {
        type: "application/json",
      });
      this.fileSaveService.saveFile(blob);
    } else {
      console.error("Settings data is null or undefined");
      // You can add a user notification here that the settings data is missing
    }
  }

  applySettings() {
    // Logic to apply settings
    console.log("Settings applied:", {
      selectedStationVersion: this.selectedStationVersion,
      selectedBandwidth: this.selectedBandwidth,
      modulations: this.modulations,
    });
    // Add further logic as needed
  }
}
