import { Component, OnInit, OnDestroy } from '@angular/core';
import {NgFor, CommonModule} from "@angular/common";
import {FormsModule} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';

import { StorageService } from '../core/services/localStorage.service';

@Component({
  selector: 'app-queue-tests-form',
  standalone: true,
  imports: [NgFor,
    FormsModule,
    CommonModule,
    InputNumberModule,
    ButtonModule,
    SelectButtonModule,
    CheckboxModule
  ],
  templateUrl: './queue-tests-form.component.html',
  styleUrls: ['./queue-tests-form.component.css'],
  providers: []
})

export class QueueTestsFormComponent implements OnInit, OnDestroy {
  testOptions: any[] = [{ label: 'Экспресс тест', value: 'expresstest' },
    { label: 'Полный тест', value: 'fulltest' }];

  bandwidthOptions: any[] = [{ label: '10 МГц', value: 10 }, { label: '20 МГц', value: 20 }];

  modulationOptions: any[] = [{ label: 'BPSK 1/2', value: 0}, { label: 'QPSK 1/2', value: 1},
    { label: 'QPSK 3/4', value: 2},{ label: 'QPSK16 1/2', value: 3},
    { label: 'QAM16 3/4', value: 4},{ label: 'QAM64 2/3', value: 5},
    { label: 'QAM64 3/4', value: 6}];
    

  selectedTestType: string = "expresstest"
  selectedBandwidth: string =  "10";
  inputedFrequncy: number = 5900;
  selectedModulation: any[] = [{ label: 'BPSK 1/2', value: 0}, { label: 'QPSK 1/2', value: 1},
    { label: 'QPSK 3/4', value: 2},{ label: 'QPSK16 1/2', value: 3},
    { label: 'QAM16 3/4', value: 4},{ label: 'QAM64 2/3', value: 5},
    { label: 'QAM64 3/4', value: 6}];
  duration: string = "60";
  totalTime: number = 0;
  massiveTests: any[] = [];
  originalTests: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<QueueTestsFormComponent>,
    private localStorage: StorageService
  ) { }

  ngOnInit(): void {
    const savedTests = this.localStorage.getItem('massiveTests');
    console.log('Saved Tests:', savedTests);
  
    // Если сохраненные тесты не являются массивом, преобразуем их в массив
    if (savedTests) {
      if (Array.isArray(savedTests)) {
        this.massiveTests = savedTests;
      } else {
        this.massiveTests = [savedTests];
      }
    }

    this.originalTests = [...this.massiveTests];
  }

  ngOnDestroy() {
    this.localStorage.setItem('massiveTests', this.massiveTests);
   }

  addTest() {
    if (this.selectedModulation.length == 0 || (this.inputedFrequncy < 5900 || this.inputedFrequncy > 6300) || this.duration == '') {
      return;
    }

    const newTest = { type: this.selectedTestType,
      bandwidth: this.selectedBandwidth,
      frequency: this.inputedFrequncy,
      modulation: (this.selectedModulation.length == 7 ? [{label: "Все"}] : this.selectedModulation),
      time: this.duration,
      totalTime: this.totalTime += ((+this.duration) * this.selectedModulation.length )
    };
    this.massiveTests.push(newTest);
  }

  removeTest(index: number) {
    this.massiveTests.splice(index, 1);
  }

  acceptTests() {
    this.dialogRef.close(this.massiveTests);
  }

  closeDialog() {
    this.massiveTests = [...this.originalTests];
    this.dialogRef.close();
  }
  
}