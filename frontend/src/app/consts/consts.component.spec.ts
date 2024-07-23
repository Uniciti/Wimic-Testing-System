import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ConstsComponent } from './consts.component';

describe('ConstsComponent', () => {
  let component: ConstsComponent;
  let fixture: ComponentFixture<ConstsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConstsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ConstsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
