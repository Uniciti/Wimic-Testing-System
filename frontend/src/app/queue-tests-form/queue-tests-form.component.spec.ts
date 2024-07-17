import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QueueTestsFormComponent } from './queue-tests-form.component';

describe('QueueTestsFormComponent', () => {
  let component: QueueTestsFormComponent;
  let fixture: ComponentFixture<QueueTestsFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QueueTestsFormComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QueueTestsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
