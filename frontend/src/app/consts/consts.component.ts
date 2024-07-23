import { Component } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatDialogModule } from "@angular/material/dialog";

@Component({
  selector: "app-consts",
  standalone: true,
  templateUrl: "./consts.component.html",
  styleUrl: "./consts.component.css",
  imports: [CommonModule, FormsModule, MatDialogModule],
})
export class ConstComponent {
  modulations = [
    {
      name: "BPSK 1/2",
      speed10: null,
      speed20: null,
      sensitivity10: null,
      sensitivity20: null,
    },
    {
      name: "QPSK 1/2",
      speed10: null,
      speed20: null,
      sensitivity10: null,
      sensitivity20: null,
    },
    {
      name: "QPSK 3/4",
      speed10: null,
      speed20: null,
      sensitivity10: null,
      sensitivity20: null,
    },
    {
      name: "QAM16 1/2",
      speed10: null,
      speed20: null,
      sensitivity10: null,
      sensitivity20: null,
    },
    {
      name: "QAM16 3/4",
      speed10: null,
      speed20: null,
      sensitivity10: null,
      sensitivity20: null,
    },
    {
      name: "QAM64 2/3",
      speed10: null,
      speed20: null,
      sensitivity10: null,
      sensitivity20: null,
    },
    {
      name: "QAM64 3/4",
      speed10: null,
      speed20: null,
      sensitivity10: null,
      sensitivity20: null,
    },
  ];
}
