import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function gradeOrder(gl: string): number {
  if (!gl) return 999;
  const s = gl.trim().toLowerCase();
  if (s === 'kinder' || s === 'kindergarten') return 0;
  const m = s.match(/^grade\s*(\d+)$/);
  return m ? parseInt(m[1], 10) : 999;
}

export function sortGradeLevels<T extends string>(grades: T[]): T[] {
  return [...grades].sort((a, b) => gradeOrder(a) - gradeOrder(b));
}
