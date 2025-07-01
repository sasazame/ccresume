import { truncateStringByWidth, getStringWidth } from './charWidth.js';

export function truncateString(str: string, maxLength: number): string {
  return truncateStringByWidth(str, maxLength);
}

export function getStringDisplayLength(str: string): number {
  return getStringWidth(str);
}