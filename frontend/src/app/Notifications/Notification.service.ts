import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'   //сервис будет синглтоном и будет доступен во всем приложении
})
export class NotificationService {
  private notificationSubject = new Subject<string>();  //экземеляр, который позволяет рассылать всем своим подписчикам

  notification$ = this.notificationSubject.asObservable(); //подписчики могут получать уведы, но не могут их отправлять напрямую

  showNotification(message: string) {
    this.notificationSubject.next(message); //отправляем подписчикам сообщение
  }
}