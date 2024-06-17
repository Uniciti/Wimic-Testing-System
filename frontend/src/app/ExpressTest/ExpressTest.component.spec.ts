import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BercutComponent } from './bercut.component';

describe('BercutComponent', () => {
  let component: BercutComponent;
  let fixture: ComponentFixture<BercutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BercutComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BercutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
