import { ComponentFixture, TestBed } from '@angular/core/testing';

import { mainTestsComponent } from './mainTests.component';

describe('mainTestsComponent', () => {
  let component: mainTestsComponent;
  let fixture: ComponentFixture<mainTestsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [mainTestsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(mainTestsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
