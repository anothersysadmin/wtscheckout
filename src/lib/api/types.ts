export type DeviceLog = {
  id: string;
  deviceId: string;
  assetTag: string;
  action: 'checkin' | 'checkout';
  userName: string;
  reason?: string;
  homeroomTeacher?: string;
  timestamp: string;
  schoolId: string;
};
