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
import { TableModule } from 'primeng/table';

import { SharedWebSocketService } from '../core/services/SharedWebSocket.service';
import { NotificationService } from '../core/services/Notification.service';
import { StorageService } from '../core/services/localStorage.service';

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
    TableModule,
    SelectButtonModule,
    ToastModule,
    QueueTestsFormComponent,
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

  //massiveTests = [];
  massiveTests: any[] = [];

  testOptions: any[] = [{ label: 'Экспресс тест', value: "express_test" },{ label: 'Полный тест', value: "full_test" }];
  stationOptions: any[] = [{ label: '10 МГц', value: 3 },{ label: '20 МГц', value: 5 }];

  cols: any[] = [
    { field: 'type', header: 'Тип теста' },
    { field: 'bandwidth', header: 'Ширина полосы' },
    { field: 'frequency', header: 'Частота' },
    { field: 'modulation', header: 'Модуляции' },
    { field: 'time', header: 'Время' }
  ];

  getModulationLabels(modulation: any[]): string {
    return modulation.map(mod => mod.label).join(', ');
  }
  
  private subscription: Subscription = new Subscription();

  constructor(
    private sharedWebSocketService: SharedWebSocketService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private ngZone: NgZone,
    private dialog: MatDialog,
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
    this.massiveTests = [
      {
        "type": "Экспресс",
        "bandwidth": "10",
        "frequency": 5900,
        "modulation": [
          {
            "label": "Все"
          }
        ],
        "time": "60",
        "totalTime": 420
      },
      {
        "type": "Полный",
        "bandwidth": "10",
        "frequency": 5900,
        "modulation": [
          {
            "label": "Все"
          }
        ],
        "time": "60",
        "totalTime": 420
      }
      // другие объекты
    ];
    console.log(this.massiveTests);
  }

  ngOnDestroy() {
    this.localStorage.setItem('settingsData', this.settingsData);
    this.localStorage.setItem('massiveTests', this.massiveTests);

    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  onMouseOver(rowData: any): void {
    this.massiveTests.forEach(test => test.hovered = false); // Сбрасываем hover для всех строк
    rowData.hovered = true; // Устанавливаем hover для текущей строки
  }

  onMouseLeave(rowData: any): void {
    rowData.hovered = false; // Убираем hover для текущей строки
  }

  openDialog() {
    const dialogRef = this.dialog.open(QueueTestsFormComponent, {
      width: '350px',
      height: '580px',
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

  editTest(massiveTests: any[]) {

  }

  deleteTest(massiveTests: any[]) {

  }

  // uploadJSONWithSettings(event: any) {
  //   const file = event.files[0];
  //   const reader = new FileReader();
  //   reader.onload = (e: any) => {
  //     this.ngZone.run(() => {
  //       try {
  //         this.parsedData = JSON.parse(e.target.result);
  //         this.massiveTests = this.parsedData.slice(0, -1);
  
  //         let settingsElement = this.parsedData.length - 1;
  //         this.pa1 = this.parsedData[settingsElement].Attenuator_PA1;
  //         this.pa2 = this.parsedData[settingsElement].Attenuator_PA2;
  //         this.splitterM3M = this.parsedData[settingsElement].splitter_to_M3M;
  //         this.splitterST = this.parsedData[settingsElement].splitter_straight;
  //         this.cable1 = this.parsedData[settingsElement].cable1;
  //         this.cable2 = this.parsedData[settingsElement].cable2;
  //         this.cable3 = this.parsedData[settingsElement].cable3;
  
  //         this.localStorage.setItem('massiveTests', this.massiveTests);
  
  //         this.cdr.detectChanges();
  //       } catch (error) {
  //         console.error('Ошибка при парсинге JSON:', error);
  //       }
  //     });
  //   };
  //   reader.readAsText(file);
  // }

  // downloadJSONWithSettings() {
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
  // }

  buttonsControlTest(sub:  Subscription) {
    this.TestProcessing = false;
    this.loadingTest = false;
    this.cdr.detectChanges();
    sub.unsubscribe();
  }

  pullman() {
    this.ngZone.runOutsideAngular(() => {  
      let subscription = this.sharedWebSocketService.getMessages().subscribe({
        next: (message) => {
          if (message.status === "modulation") {
            this.ngZone.run(() => {
              this.modulation = Math.round(((message.messageMod / message.stage) * 100) - 1);
            });
          }
          if (message.status === "completed") {
            subscription.unsubscribe();
          }
        },
        error: (error) => {
          this.ngZone.run(() => {
            this.TestProcessing = false;
            this.loadingTest = false;
          });
          subscription.unsubscribe();
        }
      });
  
      this.subscription.add(subscription);
    });
  } 


  startTest(Queue_tests: any[]) {
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
          this.pullman();
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

