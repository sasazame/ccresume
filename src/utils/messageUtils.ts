export function extractMessageText(content: string | Array<{ type: string; text?: string; name?: string; input?: any }> | undefined | null): string {
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
        
        if (item.input) {
          if (item.input.command) {
            description = item.input.command;
          } else if (item.input.description) {
            description = item.input.description;
          } else if (item.input.prompt) {
            description = item.input.prompt.substring(0, 100) + '...';
          }
        }
        
        parts.push(`[Tool: ${toolName}] ${description}`);
      } else if (item.type === 'tool_result') {
        // Handle tool results
        parts.push('[Tool Result]');
      }
    }
    
    return parts.join('\n');
  }
  
  return '';
}