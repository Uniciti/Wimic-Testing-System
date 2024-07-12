import { Component, OnInit, ChangeDetectorRef, OnDestroy,
   NgZone, HostListener } from '@angular/core';
import { NgClass, NgFor, CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, NavigationStart } from '@angular/router';
import { Subscription, timer } from 'rxjs';


import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar'
import { FileUploadModule } from 'primeng/fileupload';

import { SharedWebSocketService } from '../SharedWebSocket.service';
import { NotificationService } from '../Notification.service';
import { FileSaveService } from './fileSaver.service';
import { StorageService } from '../localStorage.service';

import { QueueTestsFormComponent } from "../queue-tests-form/queue-tests-form.component"

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
    QueueTestsFormComponent,
    FileUploadModule
  ],
  templateUrl: './mainTests.component.html',
  styleUrls: ['./mainTests.component.css'],
  styles: [`.tab_content{height: 38rem; overflow-y: scroll;}`],
  providers: [ NotificationService ]
})

export class mainTestsComponent implements OnInit, OnDestroy {

  mainTestsData: any = {};

  loadingTest: boolean = false;
  TestProcessing: boolean = false;
  interval: any;
  modulation: number = 0;
  currentStageQueue: number = 0;

  routerSubscription: Subscription = new Subscription();

  pa1: number | null = null;
  pa2: number | null = null;
  splitterM3M: number | null = null;
  splitterST: number | null = null;
  cable1: number | null = null;
  cable2: number | null = null;
  cable3: number | null = null;

  get settingsData() {
    return {
    Attenuator_PA1: this.pa1,
    Attenuator_PA2: this.pa2,
    splitter_to_M3M: this.splitterM3M,
    splitter_straight: this.splitterST,
    cable1: this.cable1,
    cable2: this.cable2,
    cable3: this.cable3
    };
  }

  parsedData: any;

  massiveTests = []

  testOptions: any[] = [{ label: 'Экспресс тест', value: "express_test" },{ label: 'Полный тест', value: "full_test" }];
  stationOptions: any[] = [{ label: '10 МГц', value: 3 },{ label: '20 МГц', value: 5 }];
  
  private subscription: Subscription = new Subscription();

  constructor(
    private sharedWebSocketService: SharedWebSocketService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private fileSaveService: FileSaveService,
    private localStorage: StorageService,
    private router: Router
  ) { 
    const savedTests = this.localStorage.getItem('massiveTests');
    if (savedTests) {
      this.massiveTests = savedTests;
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadHandler(event: Event): void {
    this.localStorage.setItem('settingsData', this.settingsData);
  }
  
  ngOnInit(): void {
    const savedValue = this.localStorage.getItem('settingsData');
    if (savedValue) {
      this.pa1 = savedValue.Attenuator_PA1;
      this.pa2 = savedValue.Attenuator_PA2;
      console.log("Ну типо должно сохраняться вот" ,savedValue.Attenuator_PA2)
      console.log(savedValue);
      this.splitterM3M = savedValue.splitter_to_M3M;
      this.splitterST = savedValue.splitter_straight;
      this.cable1 = savedValue.cable1;
      this.cable2 = savedValue.cable2
      this.cable3 = savedValue.cable3
    }

    this.routerSubscription = this.router.events.subscribe(event => {
      if (event instanceof NavigationStart) {
        this.localStorage.setItem('settingsData', this.settingsData);
        this.localStorage.setItem('massiveTests', this.massiveTests);
      }
    });
  }

  ngOnDestroy() {
    this.localStorage.setItem('settingsData', this.settingsData);
    this.localStorage.setItem('massiveTests', this.massiveTests);

    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  openDialog() {
    const dialogRef = this.dialog.open(QueueTestsFormComponent, {
      width: '750px',
      height: '800px',
      panelClass: 'FormStyle',
      data: this.massiveTests 
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.massiveTests = result;
        this.localStorage.setItem('massiveTests', this.massiveTests);
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
          this.massiveTests = this.parsedData.slice(0, -1);
  
          let settingsElement = this.parsedData.length - 1;
          this.pa1 = this.parsedData[settingsElement].Attenuator_PA1;
          this.pa2 = this.parsedData[settingsElement].Attenuator_PA2;
          this.splitterM3M = this.parsedData[settingsElement].splitter_to_M3M;
          this.splitterST = this.parsedData[settingsElement].splitter_straight;
          this.cable1 = this.parsedData[settingsElement].cable1;
          this.cable2 = this.parsedData[settingsElement].cable2;
          this.cable3 = this.parsedData[settingsElement].cable3;
  
          this.localStorage.setItem('massiveTests', this.massiveTests);
  
          this.cdr.detectChanges();
        } catch (error) {
          console.error('Ошибка при парсинге JSON:', error);
        }
      });
    };
    reader.readAsText(file);
  }

  downloadJSONWithSettings() {
    const settingsData : any = {
      Attenuator_PA1: this.pa1,
      Attenuator_PA2: this.pa2,
      splitter_to_M3M: this.splitterM3M,
      splitter_straight: this.splitterST,
      cable1: this.cable1,
      cable2: this.cable2,
      cable3: this.cable3,
    }

    const jsonDataSettings = this.massiveTests.concat(settingsData);
    const blob = new Blob([JSON.stringify(jsonDataSettings, null, 2)], {type: 'application/json' });
    this.fileSaveService.saveFile(blob);
  }

  buttonsControlTest(sub:  Subscription) {
    this.TestProcessing = false;
    this.loadingTest = false;
    this.cdr.detectChanges();
    sub.unsubscribe();
  }

  pullman(Queue_tests: any[]) {
    this.ngZone.runOutsideAngular(() => {  
      // Подписка на сообщения WebSocket
      let subscription = this.sharedWebSocketService.getMessages().subscribe({
        next: (message) => {
          if (message.status === "modulation") {
            console.log("Я в пульмане....")
            this.ngZone.run(() => {
              this.modulation = Math.round(((message.messageMod / message.stage) * 100) - 1);
            });
          }
          if (message.status === "completed") {
            subscription.unsubscribe();
            //clearInterval(this.interval);
          }
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.TestProcessing = false;
            this.loadingTest = false;
          });
          subscription.unsubscribe();
          //clearInterval(this.interval);
        }
      });
  
      this.subscription.add(subscription);
    });
  } 


  startTest(Queue_tests: any[]) {
    console.log("Вот saved_data", this.settingsData);
    console.log("А вот само значение ПА1", this.pa1)
    this.loadingTest = true;

    let i: number = 1;
    const InputedParams = 
    {
      Attenuator_PA1: this.pa1,
      Attenuator_PA2: this.pa2,
      splitterM3M: this.splitterM3M,
      splitter_straight: this.splitterST,
      cable1: this.cable1,
      cable2: this.cable2,
      cable3: this.cable3
    };

    const message = {"type": "test", "params": Queue_tests, "command": InputedParams};
    this.sharedWebSocketService.sendMessage(message);

    const connectionTimeout = timer(5000).subscribe(() => {
      this.loadingTest = false;
      connectionTimeout.unsubscribe();
    });
    
    let subscription = this.sharedWebSocketService.getMessages().subscribe({
      next: (message) => {
        this.loadingTest = true;
        if (message.type === "sended" && message.test === "queue") {
          this.pullman(Queue_tests[Queue_tests.length - 1].totalTime);
          connectionTimeout.unsubscribe();
          this.loadingTest = true;
          this.TestProcessing = true;
          this.cdr.detectChanges();
        }
          else if (message.status === "error exec") {
            this.notificationService.showError('Проверьте подключение к устройствам...');
            this.loadingTest = false;
            this.TestProcessing = false;
            this.cdr.detectChanges();
          }
          else if (message.status === "processing") {
            this.loadingTest = true;
            this.TestProcessing = true;
            this.modulation = 0;
            this.currentStageQueue += Math.round(100 / Queue_tests.length);
            this.notificationService.showWarning(`Тест пройден. Осталось ${(Queue_tests.length - i)} ...`);
            i++;
            this.cdr.detectChanges();
          }
          else if (message.status === "completed") {
            this.modulation = 0;
            this.currentStageQueue = 0;
            this.notificationService.showSuccess('Все тесты успешно завершены! Проверьте папку пользователя...');
            this.buttonsControlTest(subscription);
            this.cdr.detectChanges();
          }
      },
      error: (error) => {
        connectionTimeout.unsubscribe();
        this.notificationService.showError('Проверьте подключение к устройствам');
        this.buttonsControlTest(subscription);
        this.cdr.detectChanges();
      }
    });
    this.subscription.add(subscription);
  }
}

