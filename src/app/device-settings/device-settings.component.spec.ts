import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DeviceSettingsComponent } from './device-settings.component';

describe('DeviceSettingsComponent', () => {
  let component: DeviceSettingsComponent;
  let fixture: ComponentFixture<DeviceSettingsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeviceSettingsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DeviceSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
