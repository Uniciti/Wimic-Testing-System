import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { NgFor, CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';

import { StorageService } from '../core/services/localStorage.service';
import { QueueCommunicationService } from '../core/services/QueueCommunication.service';

import { TestData } from '../core/interfaces/test.models';

@Component({
  selector: 'app-queue-tests-form',
  standalone: true,
  imports: [
    NgFor,
    FormsModule,
    CommonModule,
    InputNumberModule,
    ButtonModule,
    SelectButtonModule,
    CheckboxModule,
  ],
  templateUrl: './queue-tests-form.component.html',
  styleUrls: ['./queue-tests-form.component.css'],
  providers: [],
})
export class QueueTestsFormComponent implements OnInit, OnDestroy {
  testOptions: any[] = [
    { label: 'Экспресс тест', value: 'expresstest' },
    { label: 'Полный тест', value: 'fulltest' },
  ];

  bandwidthOptions: any[] = [
    { label: '10 МГц', value: 10 },
    { label: '20 МГц', value: 20 },
  ];

  modulationOptions: any[] = [
    { label: 'BPSK 1/2', value: 0 },
    { label: 'QPSK 1/2', value: 1 },
    { label: 'QPSK 3/4', value: 2 },
    { label: 'QPSK16 1/2', value: 3 },
    { label: 'QAM16 3/4', value: 4 },
    { label: 'QAM64 2/3', value: 5 },
    { label: 'QAM64 3/4', value: 6 },
  ];

  selectedTestType: string;
  selectedBandwidth: number;
  inputedFrequency: number;
  selectedModulation: any[];
  duration: number;

  constructor(
    private localStorage: StorageService,
    private testService: QueueCommunicationService,
    public dialogRef: MatDialogRef<QueueTestsFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any | null,
  ) {
    this.selectedTestType = data ? data.type : this.testOptions[0].value;
    this.selectedBandwidth = data ? data.bandwidth : 10;
    this.inputedFrequency = data ? data.frequency : 5900;
    this.selectedModulation = data
      ? data.modulation.length === 1 && data.modulation[0].label === 'Все'
        ? this.modulationOptions
        : data.modulation
      : this.modulationOptions;
    this.duration = data ? data.time : 60;
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {}

  save(): void {
    if (this.inputedFrequency === null) {
      this.inputedFrequency = 5900;
    }
    if (this.selectedModulation.length === 0) {
      this.selectedModulation = this.modulationOptions;
    }
    if (this.duration === null) {
      this.duration = 60;
    }

    const newTest: TestData = {
      type: this.selectedTestType,
      bandwidth: Number(this.selectedBandwidth),
      frequency: this.inputedFrequency,
      modulation: this.selectedModulation,
      time: this.duration,
    };
    this.dialogRef.close(newTest);
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
}
