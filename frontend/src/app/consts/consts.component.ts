import { Component, Inject, OnInit } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { CommonModule } from '@angular/common';
import { FormsModule } from "@angular/forms";

import { SharedWebSocketService } from "../core/services/SharedWebSocket.service";

@Component({
  selector: "app-consts",
  templateUrl: "./consts.component.html",
  styleUrls: ["./consts.component.css"],
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: []
})
export class ConstsComponent implements OnInit {
  selectedModel: string = '';
  sensitivities: number[] = [10, 20];
  speeds: number[] = [10, 20];

  models: string[] = [];
  tableData: any[] = [];

  constructor(
    public dialogRef: MatDialogRef<ConstsComponent>,
    private sharedWebSocketService: SharedWebSocketService,
    @Inject(MAT_DIALOG_DATA) public dialogData: any
  ) {}

  ngOnInit(): void {
    const { data, version } = this.dialogData;
    if (data) {
      this.tableData = data.map((item: any) => ({
        modulation: item.name,
        sensitivity10: item.sensitivity10,
        sensitivity20: item.sensitivity20,
        speed10: item.speed10,
        speed20: item.speed20
      }));
      this.models = ["M-1", "M-2", "U"];
      this.selectedModel = version;
    }
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  applySettings(): void {
    // Prepare the data to be sent
    const updatedData = {
      type: "set-settings",
      model: this.selectedModel,
      modulations: this.tableData
    };

    this.dialogRef.close(updatedData);
  }
}