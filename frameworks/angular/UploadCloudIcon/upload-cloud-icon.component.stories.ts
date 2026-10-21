import type { Meta, StoryObj } from '@storybook/angular';
import { UploadCloudIconComponent } from './upload-cloud-icon.component';

const meta: Meta<UploadCloudIconComponent> = {
  title: 'Angular Icons/UploadCloudIcon',
  component: UploadCloudIconComponent,
  args: {
    size: 32,
    color: '#111827',
  },
};

export default meta;
type Story = StoryObj<UploadCloudIconComponent>;

export const Default: Story = {};
