import type { Meta, StoryObj } from '@storybook/angular';
import { FoundationsUploadIconComponent } from './foundations-upload-icon.component';
 
const meta: Meta<FoundationsUploadIconComponent> = {
  title: 'Menu Item Icons/Foundations Upload',
  component: FoundationsUploadIconComponent,
  args: {
    size: 32,
    color: '#111827',
  },
};

export default meta;
type Story = StoryObj<FoundationsUploadIconComponent>;

export const Default: Story = {};
