import { ComponentFixture, TestBed } from '@angular/core/testing';

import { deviceStatusComponent } from './deviceStatus.component';

describe('deviceStatusComponent', () => {
  let component: deviceStatusComponent;
  let fixture: ComponentFixture<deviceStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [deviceStatusComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(deviceStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
