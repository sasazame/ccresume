import { getCharWidth } from './charWidth.js';

/**
 * Strictly truncate a string to fit within the specified width
 * This function ensures that the string never exceeds the maximum width
 * by cutting off characters that would overflow
 */
export function strictTruncateByWidth(str: string, maxWidth: number): string {
  if (!str || maxWidth <= 0) return '';
  
  let width = 0;
  let result = '';
  let i = 0;
  
  // Reserve space for ellipsis if string needs truncation
  const ellipsisWidth = 3;
  const effectiveMaxWidth = maxWidth - ellipsisWidth;
  
  while (i < str.length) {
    const code = str.charCodeAt(i);
    let charSequence = '';
    let charWidth = 0;
    
    // Handle surrogate pairs
    if (code >= 0xD800 && code <= 0xDBFF && i + 1 < str.length) {
      const lowCode = str.charCodeAt(i + 1);
      if (lowCode >= 0xDC00 && lowCode <= 0xDFFF) {
        // This is a valid surrogate pair
        charSequence = str.slice(i, i + 2);
        charWidth = 2; // Emojis are typically width 2
        i += 2;
      } else {
        // High surrogate without valid low surrogate
        charSequence = str[i];
        charWidth = getCharWidth(str[i]);
        i++;
      }
    } else {
      // Single character
      charSequence = str[i];
      charWidth = getCharWidth(str[i]);
      i++;
    }
    
    // Check if adding this character would exceed the width
    if (width + charWidth > effectiveMaxWidth) {
      // Check if we've already added some characters
      if (result.length > 0) {
        return result + '...';
      } else {
        // Even the first character is too wide, return just ellipsis
        return '...';
      }
    }
    
    result += charSequence;
    width += charWidth;
  }
  
  return result;
}

/**
 * Strictly truncate each line of a multi-line string
 */
export function strictTruncateLines(text: string, maxWidth: number): string {
  const lines = text.split('\n');
  return lines
    .map(line => strictTruncateByWidth(line, maxWidth))
    .join('\n');
}