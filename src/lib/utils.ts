import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

const ADDRESS_SET_DATE_KEY = "addressSetDate";

/**
 * Checks if the user can set a new address today.
 * Returns true if no address was set today (after midnight local time).
 */
export function canSetNewAddress(): boolean {
  const lastSetDate = localStorage.getItem(ADDRESS_SET_DATE_KEY);
  if (!lastSetDate) return true;

  const lastSet = new Date(lastSetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return lastSet < today;
}

/**
 * Records the current timestamp when an address is set.
 * Used for rate-limiting address changes to once per day.
 */
export function recordAddressSetTimestamp(): void {
  localStorage.setItem(ADDRESS_SET_DATE_KEY, new Date().toISOString());
}
