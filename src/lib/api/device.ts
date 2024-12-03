import { z } from 'zod';
import { generateUUID } from '../utils';
import type { DeviceLog } from './types';

// Device Schema
export const DeviceSchema = z.object({
  id: z.string(),
  assetTag: z.string(),
  serial: z.string().optional(),
  model: z.string(),
  status: z.enum(['available', 'checked_out']),
  assignedTo: z.object({
    name: z.string(),
    timestamp: z.string(),
    reason: z.string().optional(),
    homeroomTeacher: z.string().optional(),
  }).nullable(),
  schoolId: z.string(),
});

export type Device = z.infer<typeof DeviceSchema>;

const DEVICES_KEY = 'devices';
const LOGS_KEY = 'device_logs';

export async function fetchDevices(schoolId: string): Promise<Device[]> {
  const stored = localStorage.getItem(DEVICES_KEY);
  if (!stored) return [];

  try {
    const devices = JSON.parse(stored);
    return devices.filter((device: Device) => device.schoolId === schoolId);
  } catch (error) {
    console.error('Error parsing devices:', error);
    return [];
  }
}

export async function deviceExists(assetTag: string): Promise<boolean> {
  const stored = localStorage.getItem(DEVICES_KEY);
  if (!stored) return false;

  const devices = JSON.parse(stored);
  return devices.some((device: Device) => device.assetTag === assetTag);
}

export async function addDevice(data: { assetTag: string; model: string; schoolId: string; serial?: string }): Promise<Device> {
  const stored = localStorage.getItem(DEVICES_KEY);
  const devices = stored ? JSON.parse(stored) : [];

  if (devices.some((device: Device) => device.assetTag === data.assetTag)) {
    throw new Error('A device with this asset tag already exists');
  }

  const newDevice: Device = {
    id: generateUUID(),
    assetTag: data.assetTag,
    model: data.model,
    status: 'available',
    assignedTo: null,
    schoolId: data.schoolId,
    serial: data.serial || '',
  };

  devices.push(newDevice);
  localStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
  return newDevice;
}

export async function removeDevice(id: string): Promise<void> {
  const stored = localStorage.getItem(DEVICES_KEY);
  if (!stored) return;

  const devices = JSON.parse(stored);
  const updatedDevices = devices.filter((device: Device) => device.id !== id);
  localStorage.setItem(DEVICES_KEY, JSON.stringify(updatedDevices));
}

export async function checkoutDevice(deviceId: string, userName: string, reason: string, homeroomTeacher?: string): Promise<void> {
  const stored = localStorage.getItem(DEVICES_KEY);
  if (!stored) throw new Error('No devices found');

  const devices = JSON.parse(stored);
  const deviceIndex = devices.findIndex((device: Device) => device.assetTag === deviceId);
  
  if (deviceIndex === -1) {
    throw new Error('Device not found');
  }

  if (devices[deviceIndex].status === 'checked_out') {
    throw new Error('Device is already checked out');
  }

  devices[deviceIndex].status = 'checked_out';
  devices[deviceIndex].assignedTo = {
    name: userName,
    timestamp: new Date().toISOString(),
    reason,
    homeroomTeacher
  };
  localStorage.setItem(DEVICES_KEY, JSON.stringify(devices));

  const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
  logs.push({
    id: generateUUID(),
    deviceId: devices[deviceIndex].id,
    assetTag: deviceId,
    action: 'checkout',
    userName,
    reason,
    homeroomTeacher,
    timestamp: new Date().toISOString(),
    schoolId: devices[deviceIndex].schoolId
  });
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}

export async function checkinDevice(deviceId: string): Promise<void> {
  const stored = localStorage.getItem(DEVICES_KEY);
  if (!stored) throw new Error('No devices found');

  const devices = JSON.parse(stored);
  const deviceIndex = devices.findIndex((device: Device) => device.assetTag === deviceId);
  
  if (deviceIndex === -1) {
    throw new Error('Device not found');
  }

  if (devices[deviceIndex].status === 'available') {
    throw new Error('Device is already checked in');
  }

  const userName = devices[deviceIndex].assignedTo?.name || 'Unknown';
  
  devices[deviceIndex].status = 'available';
  devices[deviceIndex].assignedTo = null;
  localStorage.setItem(DEVICES_KEY, JSON.stringify(devices));

  const logs = JSON.parse(localStorage.getItem(LOGS_KEY) || '[]');
  logs.push({
    id: generateUUID(),
    deviceId: devices[deviceIndex].id,
    assetTag: deviceId,
    action: 'checkin',
    userName,
    timestamp: new Date().toISOString(),
    schoolId: devices[deviceIndex].schoolId
  });
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs));
}
