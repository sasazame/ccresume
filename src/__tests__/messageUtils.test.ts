import { extractMessageText } from '../utils/messageUtils.js';

describe('messageUtils', () => {
  describe('extractMessageText', () => {
    it('returns empty string for null or undefined', () => {
      expect(extractMessageText(null)).toBe('');
      expect(extractMessageText(undefined)).toBe('');
    });

    it('returns string content as-is', () => {
      expect(extractMessageText('Hello, world!')).toBe('Hello, world!');
      expect(extractMessageText('Multi\nline\nstring')).toBe('Multi\nline\nstring');
    });

    it('extracts text from text-type array items', () => {
      const content = [
        { type: 'text', text: 'First part' },
        { type: 'text', text: 'Second part' }
      ];
      
      expect(extractMessageText(content)).toBe('First part\nSecond part');
    });

    it('formats tool_use messages with command', () => {
      const content = [
        { type: 'tool_use', name: 'bash', input: { command: 'ls -la' } }
      ];
      
      expect(extractMessageText(content)).toBe('[Tool: bash] ls -la');
    });

    it('formats tool_use messages with description', () => {
      const content = [
        { type: 'tool_use', name: 'search', input: { description: 'Searching for files' } }
      ];
      
      expect(extractMessageText(content)).toBe('[Tool: search] Searching for files');
    });

    it('formats tool_use messages with prompt (truncated)', () => {
      const longPrompt = 'This is a very long prompt that exceeds one hundred characters and should be truncated with ellipsis at the end to maintain readability';
      const content = [
        { type: 'tool_use', name: 'ai_model', input: { prompt: longPrompt } }
      ];
      
      const result = extractMessageText(content);
      expect(result).toBe('[Tool: ai_model] This is a very long prompt that exceeds one hundred characters and should be truncated with ellipsis...');
      expect(result.length).toBe(120); // [Tool: ai_model]  + 100 + ...
    });

    it('formats tool_use messages without input details', () => {
      const content = [
        { type: 'tool_use', name: 'simple_tool' }
      ];
      
      expect(extractMessageText(content)).toBe('[Tool: simple_tool] ');
    });

    it('handles tool_result messages', () => {
      const content = [
        { type: 'tool_result' }
      ];
      
      expect(extractMessageText(content)).toBe('[Tool Result]');
    });

    it('combines different message types', () => {
      const content = [
        { type: 'text', text: 'Let me help you with that.' },
        { type: 'tool_use', name: 'bash', input: { command: 'pwd' } },
        { type: 'tool_result' },
        { type: 'text', text: 'The current directory is shown above.' }
      ];
      
      expect(extractMessageText(content)).toBe(
        'Let me help you with that.\n' +
        '[Tool: bash] pwd\n' +
        '[Tool Result]\n' +
        'The current directory is shown above.'
      );
    });

    it('skips null or undefined array items', () => {
      const content = [
        null,
        { type: 'text', text: 'Valid text' },
        undefined,
        { type: 'text', text: 'More text' }
      ];
      
      expect(extractMessageText(content as any)).toBe('Valid text\nMore text');
    });

    it('skips items without text property', () => {
      const content = [
        { type: 'text' }, // Missing text property
        { type: 'text', text: 'Valid text' },
        { type: 'text', text: '' }, // Empty text
        { type: 'text', text: 'More text' }
      ];
      
      expect(extractMessageText(content)).toBe('Valid text\nMore text');
    });

    it('handles unknown message types', () => {
      const content = [
        { type: 'unknown_type', data: 'some data' },
        { type: 'text', text: 'Known type' }
      ];
      
      expect(extractMessageText(content as any)).toBe('Known type');
    });

    it('handles empty array', () => {
      expect(extractMessageText([])).toBe('');
    });

    it('handles complex nested input objects', () => {
      const content = [
        { 
          type: 'tool_use', 
          name: 'complex_tool',
          input: {
            command: 'primary command',
            description: 'this should not be used',
            prompt: 'this should not be used either'
          }
        }
      ];
      
      // Should prefer command over description over prompt
      expect(extractMessageText(content)).toBe('[Tool: complex_tool] primary command');
    });

    it('handles tool_use with only prompt', () => {
      const content = [
        { 
          type: 'tool_use', 
          name: 'prompt_tool',
          input: {
            prompt: 'Short prompt'
          }
        }
      ];
      
      expect(extractMessageText(content)).toBe('[Tool: prompt_tool] Short prompt...');
    });

    it('handles tool_use with empty input', () => {
      const content = [
        { 
          type: 'tool_use', 
          name: 'empty_tool',
          input: {}
        }
      ];
      
      expect(extractMessageText(content)).toBe('[Tool: empty_tool] ');
    });

    it('preserves whitespace in text content', () => {
      const content = [
        { type: 'text', text: '  Indented text  ' },
        { type: 'text', text: '\n\nDouble newlines\n\n' }
      ];
      
      expect(extractMessageText(content)).toBe('  Indented text  \n\n\nDouble newlines\n\n');
    });
  });
});