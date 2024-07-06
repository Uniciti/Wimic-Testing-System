import { Component, OnInit, ChangeDetectorRef, OnDestroy,
   NgZone } from '@angular/core';
import { NgClass, NgFor, CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Subscription, timer } from 'rxjs';

import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar'

import { SharedWebSocketService } from '../SharedWebSocket.service';
import { NotificationService } from '../Notification.service';
import { FileSaveService } from './fileSaver.service';

import { QueueTestsFormComponent } from "../queue-tests-form/queue-tests-form.component"
//import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { PullTestsInterface } from '../core/interfaces/pull_tests'

@Component({
  selector: 'app-mainTests',
  standalone: true,
  imports: [
    NgClass,
    NgFor,
    CommonModule,
    FormsModule,
    MatDialogModule,
    InputNumberModule,
    ButtonModule,
    ProgressBarModule,
    SelectButtonModule,
    ToastModule,
    QueueTestsFormComponent
  ],
  templateUrl: './mainTests.component.html',
  styleUrls: ['./mainTests.component.css'],
  styles: [`.tab_content{height: 38rem; overflow-y: scroll;}`],
  providers: [ NotificationService ]
})

export class mainTestsComponent implements OnInit, OnDestroy {

  loadingTest: boolean = false;
  TestProcessing: boolean = false;
  interval: any;
  modulation: number = 0;

  // selectionTestType: string = "express_test"
  // selectionBandwidth: number =  3;

  pa1: number | null = null;
  pa2: number | null = null;
  splitterM3M: number | null = null;
  splitterST: number | null = null;
  cable1: number | null = null;
  cable2: number | null = null;
  cable3: number | null = null;
  duration: number | null = null;

  pullman_tests: PullTestsInterface = {
    "modulation": "",
    "bandwidth": "",
    "frequncy": "none",
    "type": "",
    "time": ""
  }

  massiveTests = [this.pullman_tests]
  //ref: DynamicDialogRef | null = null;

  /*
    modulation: all, bpsk1/2, qpsk3/4...
    bandwidth: 3, 5
    frequency: 1124, ...
    type: full, express
  */
  testOptions: any[] = [{ label: 'Экспресс тест', value: "express_test" },{ label: 'Полный тест', value: "full_test" }];
  stationOptions: any[] = [{ label: '10 МГц', value: 3 },{ label: '20 МГц', value: 5 }];
  
  private subscription: Subscription = new Subscription();

  constructor(
    private sharedWebSocketService: SharedWebSocketService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private fileSaveService: FileSaveService
  ) {}

  openDialog() {
    const dialogRef = this.dialog.open(QueueTestsFormComponent, {
      width: '750px',
      height: '800px',
      panelClass: 'FormStyle'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.massiveTests = result;
      }
    });
  }

  downloadJSONWithSettings() {
    const jsonDataSettings = { name: "Blob" }
    const blob = new Blob([JSON.stringify(jsonDataSettings, null, 2)], {type: 'application/json' });
    this.fileSaveService.saveFile(blob);
  }

  ngOnInit(): void { }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  buttonsControlTest(sub:  Subscription) {
    this.TestProcessing = false;
    this.loadingTest = false;
    this.cdr.detectChanges();
    sub.unsubscribe();
  }

  pullman() {
    this.ngZone.runOutsideAngular(() => {
      this.interval = setInterval(() => {
        this.ngZone.run(() => {
          let subscription = this.sharedWebSocketService.getMessages().subscribe({
            next: (message) => {
              if (message.status === "modulation") {
                this.modulation = ((message.currentMod / message.stage) * 100) - 1;
                if (message.status === "completed") {
                  this.modulation = 0;
                  this.notificationService.showSuccess("Тестирование успешно завершено, проверьте папку tests...");
                  subscription.unsubscribe();
                  clearInterval(this.interval);
                }
              }
            },
            error: (error) => {
              this.TestProcessing = false;
              this.loadingTest = false;
              subscription.unsubscribe();
              clearInterval(this.interval);
          }});
          this.subscription.add(subscription);
        });
      }, 2000);
    });
  }

  startTest(Queue_tests: any[]) {
    this.loadingTest = true;
    const InputedParams = 
    {
      pa1: this.pa1,
      pa2: this.pa2,
      v1: this.splitterST,
      v2: this.splitterM3M,
      c1: this.cable1,
      c2: this.cable2,
      c3: this.cable3,
      //duration: this.duration,
      //bandwidth: this.selectionBandwidth
    };

    const message = {"type": "test", "params": Queue_tests, "command": InputedParams};
    this.sharedWebSocketService.sendMessage(message);

    const connectionTimeout = timer(5000).subscribe(() => {
      this.loadingTest = false;
      connectionTimeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
        if (message.type === "sended" && message.type === "test") {
          this.pullman();
          connectionTimeout.unsubscribe();
          this.TestProcessing = true;
          if (message.status !== "completed") {
            this.notificationService.showError('Проверьте подключение к устройствам');
          }
        } 
          this.buttonsControlTest(subscription);
      },
      error: (error) => {
        connectionTimeout.unsubscribe();
        this.notificationService.showError('Проверьте подключение к устройствам');
        this.buttonsControlTest(subscription);
      }
    });
    this.subscription.add(subscription);
  }
}

