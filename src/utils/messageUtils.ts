export function extractMessageText(content: string | Array<{ type: string; text?: string; name?: string; input?: unknown }> | undefined | null): string {
  if (!content) {
    return '';
  }
  
  if (typeof content === 'string') {
    return content;
  }
  
  if (Array.isArray(content)) {
    const parts: string[] = [];
    
    for (const item of content) {
      if (!item) continue;
      
      if (item.type === 'text' && item.text) {
        parts.push(item.text);
      } else if (item.type === 'tool_use' && item.name) {
        // Format tool use messages
        const toolName = item.name;
        let description = '';
        
        if (item.input && typeof item.input === 'object') {
          const input = item.input as Record<string, unknown>;
          if (typeof input.command === 'string') {
            description = input.command;
          } else if (typeof input.description === 'string') {
            description = input.description;
          } else if (typeof input.prompt === 'string') {
            description = input.prompt.substring(0, 100) + '...';
          }
        }
        
        parts.push(`[Tool: ${toolName}] ${description}`);
      } else if (item.type === 'tool_result') {
        // Handle tool results
        parts.push('[Tool Result]');
      } else if (item.type === 'thinking') {
        // Handle thinking messages
        parts.push('[Thinking...]');
      }
    }
    
    return parts.join('\n');
  }
  
  return '';
}