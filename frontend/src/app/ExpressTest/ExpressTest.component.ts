import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { InputNumberModule } from 'primeng/inputnumber';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-ExpressTest',
  standalone: true,
  imports: [FormsModule, InputNumberModule, ButtonModule],
  templateUrl: './ExpressTest.component.html',
  styleUrls: ['./ExpressTest.component.css']
})
export class ExpressTest implements OnInit {
  pa1: string = '';
  pa2: string = '';
  splitterM3M: string = '';
  splitterST: string = '';
  cable1: string = '';
  cable2: string = '';
  cable3: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {}

  Express_test() {
    const button = document.getElementById('expressTestButton') as HTMLButtonElement;
    if (button) {
      button.disabled = true;
      button.style.opacity = '0.5';
    }

    const InputedParams = [
      {
        device: "Attenuators",
        pa1: this.pa1,
        pa2: this.pa2
      },
      {
        device: "Splitter",
        v1: this.splitterST,
        v2: this.splitterM3M
      },
      {
        device: "Cable",
        c1: this.cable1,
        c2: this.cable2,
        c3: this.cable3
      },
    ];

    // Send the POST request
    this.http.post('/Test/EXPRESS_TEST', InputedParams, { responseType: 'json' }).subscribe(
      response => {
        console.log(response);
        if (button) {
          button.disabled = false;
          button.style.opacity = '1';
        }
      },
      error => {
        console.error('Ошибка запроса:', error);
        if (button) {
          button.disabled = false;
          button.style.opacity = '1';
        }
      }
    );
  }
}