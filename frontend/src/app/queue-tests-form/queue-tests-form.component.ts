// import { Component, EventEmitter, Output } from '@angular/core';
// import { TableModule } from 'primeng/table';
// import { DynamicDialogRef } from 'primeng/dynamicdialog';
// import { DynamicDialogConfig } from 'primeng/dynamicdialog';
// import { QueueTestsFormService } from './queue-tests-form.service';
// import { PullTestsInterface } from '../core/interfaces/pull_tests'

// @Component({
//   selector: 'app-queue-tests-form',
//   standalone: true,
//   imports: [ TableModule ],
//   templateUrl: './queue-tests-form.component.html',
//   styleUrls: ['./queue-tests-form.component.css']
// })
// export class QueueTestsFormComponent {
//   pullman_tests: PullTestsInterface;

//   massive_tests: any[];

//   constructor(private queue: QueueTestsFormService, private ref: DynamicDialogRef, private config: DynamicDialogConfig) { }

//   ngOnInit() {
//       //id: this.config.id
//       //this.queue.pushingTest().then(cars => this.cars = cars);
//   }

//   applyParamsForTest(this.queue.pushingTest()) {
//     this.ref.close(car);
// }


// }
import { Component, EventEmitter, Output, OnDestroy } from '@angular/core';
import {NgFor, CommonModule} from "@angular/common";
import {FormsModule} from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CheckboxModule } from 'primeng/checkbox';

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
  styleUrls: ['./queue-tests-form.component.css']
})

export class QueueTestsFormComponent implements OnDestroy {
  testOptions: any[] = [{ label: 'Экспресс тест', value: 'expresstest' },
    { label: 'Полный тест', value: 'fulltest' }];
  bandwidthOptions: any[] = [{ label: '10 МГц', value: 10 }, { label: '20 МГц', value: 20 }];
  modulationOptions: any[] = [{ label: 'BPSK 1/2', value: 0}, { label: 'QPSK 1/2', value: 1},
    { label: 'QPSK 3/4', value: 2},{ label: 'QPSK16 1/2', value: 3},
    { label: 'QAM16 3/4', value: 4},{ label: 'QAM64 2/3', value: 5},
    { label: 'QAM64 3/4', value: 6}]
    

  selectedTestType: string = "expresstest"
  selectedBandwidth: string =  "10";
  inputedFrequncy: number = 0;
  selectedModulation: any[] = [];
  timeTesting: string = ""
  massiveTests: any[] = [];

  constructor(public dialogRef: MatDialogRef<QueueTestsFormComponent>) { }

  addTest() {
    if (this.selectedModulation.length == 0) {
      return;
    }

    const newTest = { type: this.selectedTestType,
      bandwidth: this.selectedBandwidth,
      frequency: (this.inputedFrequncy == 0 ? "none" : this.inputedFrequncy),
      modulation: this.selectedModulation,
      time: (this.timeTesting == "" ? "60" : this.timeTesting)
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
    this.dialogRef.close();
  }
  ngOnDestroy() { }
}