import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isSafeRedirectPath = (path: string): boolean => {
  if (!path.startsWith("/") || path.startsWith("//")) return false;
  try {
    return new URL(path, "http://localhost").origin === "http://localhost";
  } catch {
    return false;
  }
};
