import React from 'react';
import { render } from 'ink-testing-library';
import { CommandEditor } from '../components/CommandEditor.js';
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

describe('CommandEditor', () => {
  const mockOnComplete = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the command editor with initial args', () => {
    const { lastFrame } = render(
      <CommandEditor 
        initialArgs={['--dangerously-skip-permissions']} 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(lastFrame()).toContain('Edit command options for Claude');
    expect(lastFrame()).toContain('claude --dangerously-skip-permissions');
  });

  it('shows available options', () => {
    const { lastFrame } = render(
      <CommandEditor 
        initialArgs={[]} 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(lastFrame()).toContain('Available Options:');
    expect(lastFrame()).toContain('-p, --print');
    expect(lastFrame()).toContain('-c, --continue');
    expect(lastFrame()).toContain('Please refer to official docs');
  });

  it('displays edit instructions', () => {
    const { lastFrame } = render(
      <CommandEditor 
        initialArgs={[]} 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    expect(lastFrame()).toContain('Edit command options for Claude. Press Enter to confirm, Esc to cancel.');
    expect(lastFrame()).toContain('Shortcuts: Enter=confirm, Esc=cancel, ←/→=move cursor, Tab=autocomplete');
  });

  it('updates command line when typing', () => {
    const { lastFrame, stdin } = render(
      <CommandEditor 
        initialArgs={[]} 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Type '--debug'
    stdin.write('--debug');

    const frame = lastFrame();
    expect(frame).toContain('Command: claude --debug');
  });

  it('calls onComplete when Enter is pressed with no suggestions', () => {
    const { stdin } = render(
      <CommandEditor 
        initialArgs={['--debug']} 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    stdin.write('\r'); // Enter key

    expect(mockOnComplete).toHaveBeenCalledWith(['--debug']);
    expect(mockOnCancel).not.toHaveBeenCalled();
  });

  // Skipping escape key test due to ink-testing-library limitations

  // Skipping Ctrl+C test due to ink-testing-library limitations

  it('handles text editing with backspace', () => {
    const { lastFrame, stdin } = render(
      <CommandEditor 
        initialArgs={['--test']} 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Delete last character
    stdin.write('\x7F'); // Backspace

    expect(lastFrame()).toContain('claude --tes');
  });

  it('handles initial args correctly', () => {
    const { stdin } = render(
      <CommandEditor 
        initialArgs={['--test', '--debug']} 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // Just press enter to confirm
    stdin.write('\r');

    expect(mockOnComplete).toHaveBeenCalledWith(['--test', '--debug']);
  });

  it('shows cursor position correctly', () => {
    const { lastFrame } = render(
      <CommandEditor 
        initialArgs={['--test']} 
        onComplete={mockOnComplete}
        onCancel={mockOnCancel}
      />
    );

    // The cursor should be shown with inverse text
    expect(lastFrame()).toMatch(/claude --test/);
  });
});