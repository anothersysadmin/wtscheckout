import { getSchools } from '../utils';
import type { DeviceLog } from './types';

const LOGS_KEY = 'device_logs';

export async function fetchDeviceLogs(params: {
  startDate?: string;
  endDate?: string;
  assetTag?: string;
  userName?: string;
  reason?: string;
  homeroomTeacher?: string;
  action?: 'checkin' | 'checkout';
  schoolId?: string;
}): Promise<DeviceLog[]> {
  const stored = localStorage.getItem(LOGS_KEY);
  if (!stored) return [];

  try {
    let logs = JSON.parse(stored) as DeviceLog[];
    
    if (params.startDate) {
      logs = logs.filter(log => log.timestamp >= params.startDate!);
    }
    if (params.endDate) {
      logs = logs.filter(log => log.timestamp <= params.endDate!);
    }
    if (params.assetTag) {
      logs = logs.filter(log => log.assetTag.toLowerCase().includes(params.assetTag!.toLowerCase()));
    }
    if (params.userName) {
      logs = logs.filter(log => log.userName.toLowerCase().includes(params.userName!.toLowerCase()));
    }
    if (params.reason) {
      logs = logs.filter(log => log.reason?.toLowerCase().includes(params.reason!.toLowerCase()));
    }
    if (params.homeroomTeacher) {
      logs = logs.filter(log => log.homeroomTeacher?.toLowerCase().includes(params.homeroomTeacher!.toLowerCase()));
    }
    if (params.action) {
      logs = logs.filter(log => log.action === params.action);
    }
    if (params.schoolId) {
      logs = logs.filter(log => log.schoolId === params.schoolId);
    }

    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  } catch (error) {
    console.error('Error parsing logs:', error);
    return [];
  }
}

export async function exportDeviceLogs(params: {
  startDate?: string;
  endDate?: string;
  assetTag?: string;
  userName?: string;
  reason?: string;
  homeroomTeacher?: string;
  action?: 'checkin' | 'checkout';
  schoolId?: string;
}): Promise<string> {
  const logs = await fetchDeviceLogs(params);
  
  const headers = ['Date', 'Time', 'Asset Tag', 'Action', 'User', 'Homeroom Teacher', 'Reason', 'School'];
  const rows = logs.map(log => {
    const date = new Date(log.timestamp);
    const school = getSchools().find(s => s.id === log.schoolId)?.name || log.schoolId;
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      log.assetTag,
      log.action === 'checkout' ? 'Check Out' : 'Check In',
      log.userName,
      log.homeroomTeacher || '',
      log.reason || '',
      school
    ].map(field => `"${field}"`);
  });

  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}
