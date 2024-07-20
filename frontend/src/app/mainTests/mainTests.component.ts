import {
  Component,
  OnInit,
  ChangeDetectorRef,
  OnDestroy,
  NgZone,
  HostListener,
} from '@angular/core';
import { NgClass, NgFor, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router, NavigationStart } from '@angular/router';
import { BehaviorSubject, Subscription, timer } from 'rxjs';

import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ToastModule } from 'primeng/toast';
import { ProgressBarModule } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';

import { SharedWebSocketService } from '../core/services/SharedWebSocket.service';
import { NotificationService } from '../core/services/Notification.service';
import { StorageService } from '../core/services/localStorage.service';
import { QueueCommunicationService } from '../core/services/QueueCommunication.service';
import { SettingsService } from '../core/services/settings.service';

import { TestData } from '../core/interfaces/test.models';

import { QueueTestsFormComponent } from '../queue-tests-form/queue-tests-form.component';

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
  styles: [
    `
      .tab_content {
        height: 38rem;
        overflow-y: scroll;
      }
    `,
  ],
  providers: [],
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
      cable3: this.cable3,
    };
  }

  massiveTests: any[] = [];

  modulationOptions: any[] = [
    { label: 'BPSK 1/2', value: 0 },
    { label: 'QPSK 1/2', value: 1 },
    { label: 'QPSK 3/4', value: 2 },
    { label: 'QPSK16 1/2', value: 3 },
    { label: 'QAM16 3/4', value: 4 },
    { label: 'QAM64 2/3', value: 5 },
    { label: 'QAM64 3/4', value: 6 },
  ];

  testOptions: any[] = [
    { label: 'Экспресс', value: 'expresstest' },
    { label: 'Полный', value: 'fulltest' },
  ];
  stationOptions: any[] = [
    { label: '10 МГц', value: 10 },
    { label: '20 МГц', value: 20 },
  ];

  cols: any[] = [
    { field: 'type', header: 'Тип теста' },
    { field: 'bandwidth', header: 'Ширина полосы' },
    { field: 'frequency', header: 'Частота' },
    { field: 'modulation', header: 'Модуляции' },
    { field: 'time', header: 'Время' },
    { field: 'buttons', header: 'Действия' },
  ];

  private subscription: Subscription = new Subscription();

  constructor(
    private sharedWebSocketService: SharedWebSocketService,
    private cdr: ChangeDetectorRef,
    private notificationService: NotificationService,
    private ngZone: NgZone,
    private dialog: MatDialog,
    private localStorage: StorageService,
    private testService: QueueCommunicationService,
    private router: Router,
    private settingsService: SettingsService,
  ) {
    this.massiveTests = this.testService.getTests();
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
      this.cable2 = savedValue.cable2;
      this.cable3 = savedValue.cable3;
    }
    this.settingsService.settings$.subscribe((settings) => {
      if (settings) {
        this.pa1 = settings.Attenuator_PA1;
        this.pa2 = settings.Attenuator_PA2;
        this.splitterM3M = settings.splitter_to_M3M;
        this.splitterST = settings.splitter_straight;
        this.cable1 = settings.cable1;
        this.cable2 = settings.cable2;
        this.cable3 = settings.cable3;
      }
    });

    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.localStorage.setItem('settingsData', this.settingsData);
      }
    });

    this.testService.tests$.subscribe((tests) => {
      this.massiveTests = tests;
    });
  }
  ngOnDestroy() {
    this.localStorage.setItem('settingsData', this.settingsData);
    this.settingsService.updateSettings(this.settingsData);

    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  // saveSettings(): void {
  //   const settings = {
  //     Attenuator_PA1: this.pa1,
  //     Attenuator_PA2: this.pa2,
  //     splitter_to_M3M: this.splitterM3M,
  //     splitter_straight: this.splitterST,
  //     cable1: this.cable1,
  //     cable2: this.cable2,
  //     cable3: this.cable3
  //   };
  //   this.settingsService.updateSettings(settings);
  // }

  getLabelByValue(options: any[], value: any): string {
    try {
      const option = options.find(
        (opt) => opt.value == value || opt.value == Number(value),
      );
      if (option) {
        return option.label;
      } else {
        throw new Error(`Option with value ${value} not found`);
      }
    } catch (error) {
      console.error('Error in getLabelByValue:', error);
      return ''; // Возвращаем пустую строку или любое другое значение по умолчанию
    }
  }

  toNumber(value: any): number {
    return Number(value);
  }

  getModulationBoxes(modulation: any[]): any[] {
    try {
      return this.modulationOptions.map((opt) => ({
        selected: modulation.some((mod) => mod.label === opt.label),
      }));
    } catch (error) {
      console.error('Error in getModulationBoxes:', error);
      return [];
    }
  }

  openDialog(testData: TestData | null = null): void {
    const dialogRef = this.dialog.open(QueueTestsFormComponent, {
      width: '350px',
      height: '580px',
      panelClass: 'FormStyle',
      data: testData,
    });
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        if (testData) {
          const index = this.massiveTests.indexOf(testData);
          if (index !== -1) {
            this.testService.editTest(index, result);
          }
        } else {
          this.testService.addTest(result);
        }
      }
    });
  }

  editTest(rowData: any): void {
    this.openDialog(rowData);
  }

  deleteTest(rowData: any): void {
    const index = this.massiveTests.indexOf(rowData);
    this.testService.removeTest(index);
  }

  addTest(): void {
    this.openDialog();
  }

  buttonsControlTest(sub: Subscription) {
    this.TestProcessing = false;
    this.loadingTest = false;
    this.cdr.detectChanges();
    sub.unsubscribe();
  }

  pullman() {
    this.ngZone.runOutsideAngular(() => {
      let subscription = this.sharedWebSocketService
        .getMessages()
        .subscribe({
          next: (message) => {
            if (message.status === 'modulation') {
              this.ngZone.run(() => {
                this.modulation = Math.round(
                  (message.messageMod / message.stage) * 100 - 1,
                );
              });
            }
            if (message.status === 'completed') {
              subscription.unsubscribe();
            }
          },
          error: (error) => {
            this.ngZone.run(() => {
              this.TestProcessing = false;
              this.loadingTest = false;
            });
            subscription.unsubscribe();
          },
        });

      this.subscription.add(subscription);
    });
  }

  areFieldsValid(): boolean {
    return (
      this.pa1 !== null &&
      this.pa2 !== null &&
      this.splitterM3M !== null &&
      this.splitterST !== null &&
      this.cable1 !== null &&
      this.cable2 !== null &&
      this.cable3 !== null
    );
  }

  startTest(Queue_tests: any[]) {
    if (!this.areFieldsValid()) {
      this.notificationService.showWarning('Введите все значения в поля.');
      return;
    }

    if (Queue_tests.length == 0) {
      this.notificationService.showWarning(
        'Создайте хотя бы один тест для начала тестирования.',
      );
      return;
    }
    this.loadingTest = true;

    let i: number = 1;
    const InputedParams = {
      Attenuator_PA1: this.pa1,
      Attenuator_PA2: this.pa2,
      splitterM3M: this.splitterM3M,
      splitter_straight: this.splitterST,
      cable1: this.cable1,
      cable2: this.cable2,
      cable3: this.cable3,
    };

    const message = {
      type: 'test',
      params: Queue_tests,
      command: InputedParams,
    };
    this.sharedWebSocketService.sendMessage(message);

    const connectionTimeout = timer(5000).subscribe(() => {
      this.loadingTest = false;
      connectionTimeout.unsubscribe();
    });

    let subscription = this.sharedWebSocketService
      .getMessages()
      .subscribe({
        next: (message) => {
          this.loadingTest = true;
          if (message.type === 'sended' && message.test === 'queue') {
            this.pullman();
            connectionTimeout.unsubscribe();
            this.loadingTest = true;
            this.TestProcessing = true;
            this.cdr.detectChanges();
          } else if (message.status === 'error exec') {
            this.notificationService.showError(
              'Проверьте подключение к устройствам.',
            );
            this.loadingTest = false;
            this.TestProcessing = false;
            this.cdr.detectChanges();
          } else if (message.status === 'processing') {
            this.loadingTest = true;
            this.TestProcessing = true;
            this.modulation = 0;
            this.currentStageQueue += Math.round(100 / Queue_tests.length);
            this.notificationService.showWarning(
              `Тест пройден. Осталось ${Queue_tests.length - i} ...`,
            );
            i++;
            this.cdr.detectChanges();
          } else if (message.status === 'completed') {
            this.modulation = 0;
            this.currentStageQueue = 0;
            this.notificationService.showSuccess(
              'Все тесты успешно завершены! Проверьте папку пользователя.',
            );
            this.buttonsControlTest(subscription);
            this.cdr.detectChanges();
          }
        },
        error: (error) => {
          connectionTimeout.unsubscribe();
          this.notificationService.showError(
            'Проверьте подключение к устройствам.',
          );
          this.buttonsControlTest(subscription);
          this.cdr.detectChanges();
        },
      });
    this.subscription.add(subscription);
  }
}
