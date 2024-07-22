import { Component, OnInit } from '@angular/core';
import { NgIf, NgFor } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';

import { TestDetailComponent } from '../test-detail/test-detail.component';

import { SharedWebSocketService } from '../core/services/SharedWebSocket.service';

@Component({
  selector: 'app-results',
  standalone: true,
  imports: [NgIf, NgFor, TableModule, ButtonModule],
  templateUrl: './results.component.html',
  styleUrl: './results.component.css',
  providers: [],
})
export class ResultsComponent implements OnInit {
  tableData: any[] = [];

  // messageExample = {
  //   action: 'database',
  //   tableData: [
  //     {
  //       date: '2024-07-19',
  //       time: '19:03',
  //       testType: 'Экспресс тест',
  //       platform: 'm1',
  //       result: 'Успех',
  //       data: [
  //         {
  //           Modulation: 'QAM64 2/3',
  //           Attenuation: 26,
  //           SNR: 22.04,
  //           LostPercent: 0.01,
  //           TestStatus: 'Пройдено',
  //           Frequency: 5900,
  //           Bandwidth: 3,
  //           ErrorExec: false,
  //         },
  //       ],
  //     },
  //     {
  //       date: '2024-07-19',
  //       time: '19:07',
  //       testType: 'Полный тест',
  //       platform: 'm1',
  //       result: 'Успех',
  //       data: [
  //         {
  //           Modulation: 'QAM64 2/3',
  //           Attenuation: 29,
  //           SNR: 21.04,
  //           Pin: -76.34,
  //           Sens: -72.5,
  //           PinStat: -60,
  //           LostPercent: 0,
  //           TestStatus: 'Пройдено',
  //           SensStatus: 'Чуствительность соответствует',
  //           Frequency: 5900,
  //           Bandwidth: 3,
  //           ErrorExec: false,
  //         },
  //       ],
  //     },
  //   ],
  // };

  cols = [
    { field: 'date', header: 'Дата' },
    { field: 'testType', header: 'Тип теста' },
    { field: 'platform', header: 'Платформа' },
    { field: 'result', header: 'Результат' },
    { field: 'buttons', header: 'Действие' },
  ];

  constructor(
    private sharedWebSocketService: SharedWebSocketService,
    public dialog: MatDialog,
  ) {}

  ngOnInit(): void {
    //this.tableData = this.transformData(this.messageExample);
    this.sharedWebSocketService.getMessages().subscribe((message) => {
      if (message.action === 'database') {
        this.tableData = this.transformData(message);
      }
    });
  }

  transformData(data: any): any[] {
    try {
      if (data.action !== 'database' || !Array.isArray(data.tableData)) {
        throw new Error('Invalid data format');
      }

      return data.tableData.map((item: any) => ({
        date: item.date,
        testType: item.testType,
        platform: item.platform,
        result: item.result,
        data: item.data,
      }));
    } catch (error) {
      console.error('Error in transformData:', error);
      return [];
    }
  }

  moreDetails(rowData: any): void {
    const dialogRef = this.dialog.open(TestDetailComponent, {
      panelClass: 'FormStyle',
      data: { testType: rowData.testType, data: rowData.data },
    });
  }
}
