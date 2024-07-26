import { Component, NgZone, ChangeDetectorRef, OnInit, OnDestroy } from "@angular/core";
import { NgClass, NgFor, CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";

import { Subscription, timer } from "rxjs";

import { FileUploadModule } from "primeng/fileupload";
import { ButtonModule } from "primeng/button"; // Import PrimeNG ButtonModule

import { FileSaveService } from "../core/services/fileSaver.service";
import { QueueCommunicationService } from "../core/services/QueueCommunication.service";
import { SharedWebSocketService } from "../core/services/SharedWebSocket.service";
import { NotificationService } from "../core/services/Notification.service";
import { SettingsService } from "../core/services/settings.service";

import { ConstsComponent } from "../consts/consts.component";

@Component({
  selector: "app-settings",
  standalone: true,
  imports: [
    NgClass,
    NgFor,
    CommonModule,
    FormsModule,
    FileUploadModule,
    ButtonModule,
    MatDialogModule,
    ConstsComponent,
  ],
  templateUrl: "./settings.component.html",
  styleUrls: ["./settings.component.css"],
  providers: [],
})
export class SettingsComponent implements OnInit, OnDestroy {
  settingsData: any;
  parsedData: any;
  private subscription: Subscription = new Subscription();

  constructor(
    private fileSaveService: FileSaveService,
    private ngZone: NgZone,
    private testService: QueueCommunicationService,
    private sharedWebSocketService: SharedWebSocketService,
    private notificationService: NotificationService,
    private settingsService: SettingsService,
    private cdr: ChangeDetectorRef,
    public dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.subscription.add(
      this.settingsService.settings$.subscribe((data) => {
        if (data) {
          this.settingsData = { ...data }; // Create a copy of the object
        } else {
          console.warn("Received null settings data");
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
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
    if (tests) {
      const jsonDataSettings = [...tests, this.settingsData];
      const blob = new Blob([JSON.stringify(jsonDataSettings, null, 2)], {
        type: "application/json",
      });
      this.fileSaveService.saveFile(blob);
    } else {
      console.error("Settings data is null or undefined");
    }
  }

  openDialog(): void {

    const message = { type: "get-settings" };
    this.sharedWebSocketService.sendMessage(message);

    const timeout = timer(5000).subscribe(() => {
      this.notificationService.showError("Время ожидания истекло.");
      timeout.unsubscribe();
    });

    const subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
        if (message.settings === "get-settings") {
          const dialogRef = this.dialog.open(ConstsComponent, {
            data: {
              data: message.data,
              version: message.version,
            },
            height: '100%', // Set the dialog height to 100%
            maxHeight: '90vh', // Allow the dialog to grow up to 90% of the viewport height
            width: '80%', // Adjust the width as necessary
          });

          dialogRef.afterClosed().subscribe((result) => {
            this.sharedWebSocketService.sendMessage(result);

            const subscription = this.sharedWebSocketService.getMessages().subscribe({
              next: (message) => {
                if (message.settings === "set-ok") {
                  this.notificationService.showSuccess("Параметры отправлены!");
                  subscription.unsubscribe();
                  timeout.unsubscribe();
                } else {
                  // this.notificationService.showError("Ошибка отправки параметров");
                  subscription.unsubscribe();
                  timeout.unsubscribe();
                }
              },
              error: () => {
                this.notificationService.showError("Ошибка отправки параметров");
                subscription.unsubscribe();
                timeout.unsubscribe();
              },
            });
        
            this.subscription.add(subscription);
          });

          subscription.unsubscribe();
          timeout.unsubscribe();
        } else {
          this.notificationService.showError("Ошибка получения параметров");
          subscription.unsubscribe();
          timeout.unsubscribe();
        }
      },
      error: () => {
        this.notificationService.showError("Ошибка получения параметров");
        subscription.unsubscribe();
        // timeout.unsubscribe();
      },
    });

    this.subscription.add(subscription);
  }
}