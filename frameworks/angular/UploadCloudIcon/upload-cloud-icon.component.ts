import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-upload-cloud-icon',
  standalone: true,
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size"
      [attr.height]="size"
      fill="none"
      [attr.stroke]="color"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
      [attr.aria-label]="title || null"
      [attr.role]="title ? 'img' : 'presentation'"
    >
      <title *ngIf="title">{{ title }}</title>
      <path d="M7 18.25A4.25 4.25 0 0 1 7 9.75C7.9 7.09 10.36 5.25 13.26 5.25C16.18 5.25 18.75 7.32 19.3 10.08A4.28 4.28 0 0 1 17.75 18.25H7Z" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M12 9.5V15.5" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M9.5 12L12 9.5L14.5 12" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
  `,
})
export class UploadCloudIconComponent {
  @Input() size = 24;
  @Input() color = 'currentColor';
  @Input() title?: string;
}
