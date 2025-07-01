export function getCharWidth(char: string): number {
  if (!char || char.length === 0) return 0;
  
  const code = char.charCodeAt(0);
  
  // ASCII characters
  if (code <= 0x7F) {
    return 1;
  }
  
  // Check for high surrogate (emoji that use surrogate pairs)
  if (code >= 0xD800 && code <= 0xDBFF) {
    // This is a high surrogate, check if there's a low surrogate following
    if (char.length > 1) {
      const lowSurrogate = char.charCodeAt(1);
      if (lowSurrogate >= 0xDC00 && lowSurrogate <= 0xDFFF) {
        // This is a surrogate pair (emoji)
        return 2;
      }
    }
    return 2; // Treat incomplete surrogate as width 2
  }
  
  // Low surrogate without high surrogate (shouldn't happen in valid UTF-16)
  if (code >= 0xDC00 && code <= 0xDFFF) {
    return 0; // Skip orphaned low surrogates
  }
  
  // Emoji blocks (single code point emojis)
  if ((code >= 0x2600 && code <= 0x27BF) ||     // Miscellaneous Symbols and Dingbats
      (code >= 0x2300 && code <= 0x23FF) ||     // Miscellaneous Technical
      (code >= 0x2B00 && code <= 0x2BFF) ||     // Miscellaneous Symbols and Arrows
      (code >= 0x2100 && code <= 0x214F) ||     // Letterlike Symbols
      (code >= 0x2190 && code <= 0x21FF) ||     // Arrows
      (code >= 0x25A0 && code <= 0x25FF) ||     // Geometric Shapes
      (code >= 0x2700 && code <= 0x27BF) ||     // Dingbats
      (code >= 0x1F300 && code <= 0x1F5FF) ||   // Miscellaneous Symbols and Pictographs
      (code >= 0x1F600 && code <= 0x1F64F) ||   // Emoticons
      (code >= 0x1F680 && code <= 0x1F6FF) ||   // Transport and Map Symbols
      (code >= 0x1F700 && code <= 0x1F77F) ||   // Alchemical Symbols
      (code >= 0x1F780 && code <= 0x1F7FF) ||   // Geometric Shapes Extended
      (code >= 0x1F800 && code <= 0x1F8FF) ||   // Supplemental Arrows-C
      (code >= 0x1F900 && code <= 0x1F9FF) ||   // Supplemental Symbols and Pictographs
      (code >= 0x1FA00 && code <= 0x1FA6F) ||   // Chess Symbols
      (code >= 0x1FA70 && code <= 0x1FAFF)) {   // Symbols and Pictographs Extended-A
    return 2;
  }
  
  // CJK characters and other full-width characters
  if ((code >= 0x4E00 && code <= 0x9FFF) ||   // CJK Unified Ideographs
      (code >= 0x3040 && code <= 0x309F) ||   // Hiragana
      (code >= 0x30A0 && code <= 0x30FF) ||   // Katakana
      (code >= 0xAC00 && code <= 0xD7AF) ||   // Hangul Syllables (Korean)
      (code >= 0xFF00 && code <= 0xFFEF) ||   // Full-width forms
      (code >= 0x3000 && code <= 0x303F) ||   // CJK punctuation
      (code >= 0xFE30 && code <= 0xFE4F) ||   // CJK Compatibility Forms
      (code >= 0xFE50 && code <= 0xFE6F) ||   // Small Form Variants
      (code >= 0x3200 && code <= 0x32FF) ||   // Enclosed CJK Letters and Months
      (code >= 0x3300 && code <= 0x33FF) ||   // CJK Compatibility
      (code >= 0x3400 && code <= 0x4DBF) ||   // CJK Extension A
      (code >= 0x20000 && code <= 0x2A6DF) || // CJK Extension B
      (code >= 0x2A700 && code <= 0x2B73F) || // CJK Extension C
      (code >= 0x2B740 && code <= 0x2B81F) || // CJK Extension D
      (code >= 0x2B820 && code <= 0x2CEAF) || // CJK Extension E
      (code >= 0x2CEB0 && code <= 0x2EBEF) || // CJK Extension F
      (code >= 0x30000 && code <= 0x3134F)) { // CJK Extension G
    return 2;
  }
  
  // Default for other characters
  return 1;
}

export function getStringWidth(str: string): number {
  if (!str) return 0;
  
  let width = 0;
  let i = 0;
  
  while (i < str.length) {
    const code = str.charCodeAt(i);
    
    // Handle surrogate pairs
    if (code >= 0xD800 && code <= 0xDBFF && i + 1 < str.length) {
      const lowCode = str.charCodeAt(i + 1);
      if (lowCode >= 0xDC00 && lowCode <= 0xDFFF) {
        // This is a valid surrogate pair
        width += 2;
        i += 2;
        continue;
      }
    }
    
    // Single character
    width += getCharWidth(str[i]);
    i++;
  }
  
  return width;
}

export function truncateStringByWidth(str: string, maxWidth: number): string {
  if (!str) return '';
  
  let width = 0;
  let result = '';
  let i = 0;
  
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
        charWidth = 2;
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
    
    if (width + charWidth > maxWidth - 3) { // Reserve space for "..."
      return result + '...';
    }
    
    result += charSequence;
    width += charWidth;
  }
  
  return result;
}