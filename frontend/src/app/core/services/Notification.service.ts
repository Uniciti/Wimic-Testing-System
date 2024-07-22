import { Injectable } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  constructor(private messageService: MessageService) {}

  showSuccess(detail: string) {
    this.messageService.add({
      key: 'my-toast',
      severity: 'success',
      summary: 'Успех',
      detail: detail,
      life: 4000,
    });
  }

  showError(detail: string) {
    this.messageService.add({
      key: 'my-toast',
      severity: 'error',
      summary: 'Ошибка',
      detail: detail,
      life: 4000,
    });
  }

  showWarning(detail: string) {
    this.messageService.add({
      key: 'my-toast',
      severity: 'warn',
      summary: 'Предупреждение',
      detail: detail,
      life: 4000,
    });
  }
}
