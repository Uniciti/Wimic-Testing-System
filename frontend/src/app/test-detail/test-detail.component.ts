import { Component, Input, OnInit, Inject } from '@angular/core';
import {
  NgFor,
  NgIf,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault,
} from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { TableModule } from 'primeng/table';
import { Button } from 'primeng/button';

@Component({
  selector: 'app-test-detail',
  standalone: true,
  imports: [
    NgFor,
    NgIf,
    NgSwitch,
    NgSwitchCase,
    NgSwitchDefault,
    TableModule,
    Button,
  ],
  templateUrl: './test-detail.component.html',
  styleUrl: './test-detail.component.css',
  providers: [],
})
export class TestDetailComponent implements OnInit {
  @Input() data: any[] = [];
  cols: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<TestDetailComponent>,
    @Inject(MAT_DIALOG_DATA) public dialogData: any,
  ) {
    this.data = dialogData.data;
  }

  ngOnInit(): void {
    this.cols = this.getColsByTestType(this.dialogData.testType);
    this.data = this.mergeStatusAndError(this.data);
  }
  getColsByTestType(testType: string): any[] {
    if (testType === 'Экспресс тест') {
      return [
        { field: 'Modulation', header: 'Модуляция' },
        { field: 'Attenuation', header: 'Аттен, ДБ' },
        { field: 'Frequency', header: 'Частота, МГц' },
        { field: 'Bandwidth', header: 'Ширина полосы, МГц' },
        { field: 'SNR', header: 'С/Ш' },
        { field: 'LostPercent', header: 'Процент потерь' },
        { field: 'TestStatus', header: 'Статус теста' },
      ];
    } else if (testType === 'Полный тест') {
      return [
        { field: 'Modulation', header: 'Модуляция' },
        { field: 'Attenuation', header: 'Аттен, ДБ' },
        { field: 'Frequency', header: 'Частота, МГц' },
        { field: 'Bandwidth', header: 'Ширина полосы' },
        { field: 'SNR', header: 'С/Ш' },
        { field: 'Pin', header: 'Pin' },
        { field: 'Sens', header: 'Чувствительность' },
        { field: 'PinStat', header: 'Pin Status' },
        { field: 'LostPercent', header: 'Процент потерь' },
        { field: 'TestStatus', header: 'Статус теста' },
        { field: 'SensStatus', header: 'Статус чувствительности' },
      ];
    } else {
      return [];
    }
  }

  mergeStatusAndError(data: any[]): any[] {
    return data.map((item) => {
      return {
        ...item,
        TestStatus: `${item.TestStatus} <span class="status-icon">${
          item.ErrorExec
            ? '<i class="fas fa-times-circle"></i>'
            : '<i class="fas fa-check-circle"></i>'
        }</span>`,
      };
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
