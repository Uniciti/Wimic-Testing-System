import { Injectable } from '@angular/core';
import { parse } from 'path';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class QueueCommunicationService {
  private testsSubject = new BehaviorSubject<any[]>([]);
  tests$ = this.testsSubject.asObservable();

  constructor() {
    const savedTests = JSON.parse(
      localStorage.getItem('massiveTests') || '[]',
    );
    this.testsSubject.next(savedTests);
  }

  getTests() {
    return this.testsSubject.value;
  }

  addTest(test: any) {
    const currentTests = this.testsSubject.value;
    currentTests.push(test);
    this.testsSubject.next(currentTests);
    localStorage.setItem('massiveTests', JSON.stringify(currentTests));
  }

  editTest(index: number, updatedTest: any) {
    const currentTests = this.testsSubject.value;
    currentTests[index] = updatedTest;
    this.testsSubject.next(currentTests);
    localStorage.setItem('massiveTests', JSON.stringify(currentTests));
  }

  removeTest(index: number) {
    const currentTests = this.testsSubject.value;
    currentTests.splice(index, 1);
    this.testsSubject.next(currentTests);
    localStorage.setItem('massiveTests', JSON.stringify(currentTests));
  }

  loadTests(parsedData: any) {
    const newTests = parsedData.slice(0, -1);
    this.testsSubject.next(newTests);
    localStorage.setItem('massiveTests', JSON.stringify(newTests));
  }
}
