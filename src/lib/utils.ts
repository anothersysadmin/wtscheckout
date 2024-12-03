import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Generate UUID using crypto API with fallback
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  
  // Fallback implementation for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// School data management
export function getSchools(): School[] {
  const savedSchools = localStorage.getItem('schools');
  if (savedSchools) {
    try {
      return JSON.parse(savedSchools);
    } catch (error) {
      console.error('Error parsing schools from localStorage:', error);
    }
  }
  
  const defaultSchools = [
    { id: 'flocktown', name: 'Flocktown', allowNewDevices: false },
    { id: 'kossman', name: 'Kossman', allowNewDevices: false },
    { id: 'old-farmers', name: 'Old Farmers', allowNewDevices: false },
    { id: 'cucinella', name: 'Cucinella', allowNewDevices: false },
    { id: 'long-valley', name: 'Long Valley Middle School', allowNewDevices: false },
    { id: 'central-office', name: 'Central Office', allowNewDevices: false },
  ];

  localStorage.setItem('schools', JSON.stringify(defaultSchools));
  return defaultSchools;
}

export function saveSchools(schools: School[]) {
  localStorage.setItem('schools', JSON.stringify(schools));
}

// File handling utilities
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
}

// Constants
export const DEVICE_TYPES = [
  { id: 'chromebook', name: 'Chromebook' },
  { id: 'laptop', name: 'Laptop' },
  { id: 'av-cart', name: 'AV Projector Cart' },
  { id: 'dvd-player', name: 'DVD Player' },
  { id: 'projector', name: 'Projector' },
] as const;

export const CHECKOUT_REASONS = [
  // Student-related reasons
  { id: 'left-at-home', name: 'Student device left at home' },
  { id: 'student-repair', name: 'Student device needs repair' },
  // Staff-related reasons
  { id: 'teacher', name: 'Teacher use' },
  { id: 'staff-repair', name: 'Staff device needs repair' },
  { id: 'substitute', name: 'Substitute' },
  // Administrative reasons
  { id: 'school-admin', name: 'School admin use' },
  { id: 'it-admin', name: 'IT admin use' },
  // General purposes
  { id: 'testing', name: 'Testing' },
  { id: 'presentation', name: 'Presentation' },
] as const;

export function getDaysSince(date: Date): number {
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}

export type School = {
  id: string;
  name: string;
  allowNewDevices: boolean;
  logoUrl?: string;
  address?: string;
  contact?: string;
};
