import { Component, OnInit } from '@angular/core';
import { NotificationService } from './Notification.service';
import { NgFor, NgClass } from "@angular/common";

interface Notification {
  id: number;
  message: string;
  closing: boolean;
}

@Component({
  selector: 'app-Notifications',
  standalone: true,
  imports: [ NgFor, NgClass ],
  templateUrl: './Notification.component.html',
  styleUrls: ['./Notification.component.css']
})

export class NotificationComponent implements OnInit {
  notifications: Notification[] = [];

  constructor(private notificationService: NotificationService) {}

  ngOnInit() {
    this.notificationService.notification$.subscribe(message => {
      this.showNotification(message);
    });
  }

  showNotification(message: string) {
    const id = new Date().getTime();
    const notification: Notification = { id, message, closing: false };
    this.notifications.push(notification);

    setTimeout(() => this.closeNotification(notification), 4000);
  }

  closeNotification(notification: Notification) {
    notification.closing = true;
    setTimeout(() => {
      this.notifications = this.notifications.filter(n => n.id !== notification.id);
    }, 500); // время совпадает с временем анимации в CSS
  }
}