import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getItemColor(str: string): string {
  const colors = [
    "bg-red-500/20 text-red-400 border-red-500/30",
    "bg-blue-500/20 text-blue-400 border-blue-500/30",
    "bg-green-500/20 text-green-400 border-green-500/30",
    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    "bg-purple-500/20 text-purple-400 border-purple-500/30",
    "bg-pink-500/20 text-pink-400 border-pink-500/30",
    "bg-indigo-500/20 text-indigo-400 border-indigo-500/30",
    "bg-teal-500/20 text-teal-400 border-teal-500/30",
    "bg-orange-500/20 text-orange-400 border-orange-500/30",
    "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  ];

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}
