import { useQuery } from '@tanstack/react-query';
import { Laptop, User, MapPin } from 'lucide-react';
import { fetchDevices } from '../lib/api';
import { DEVICE_TYPES, CHECKOUT_REASONS, getDaysSince } from '../lib/utils';
import type { Device } from '../lib/api';

type DeviceListProps = {
  schoolId: string;
};

export function DeviceList({ schoolId }: DeviceListProps) {
  const { data: devices, isLoading, error } = useQuery({
    queryKey: ['devices', schoolId],
    queryFn: () => fetchDevices(schoolId),
    staleTime: 30000,
  });

  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="text-center text-gray-500">Loading devices...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="text-center text-red-500">Error loading devices</div>
      </div>
    );
  }

  if (!devices?.length) {
    return (
      <div className="bg-white shadow-sm rounded-lg p-4">
        <div className="text-center text-gray-500">
          No devices found for this school
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Device Inventory</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {devices.map((device) => {
          const checkoutDays = device.assignedTo ? getDaysSince(new Date(device.assignedTo.timestamp)) : 0;
          
          return (
            <div key={device.id} className="px-4 py-2 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center min-w-0">
                <Laptop className="h-5 w-5 text-sky-500 flex-shrink-0" />
                <div className="ml-3 truncate">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {DEVICE_TYPES.find(type => type.id === device.model)?.name || device.model}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      device.status === 'available'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {device.status === 'available' ? 'Available' : 'Checked Out'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
                    <span>Tag: {device.assetTag}</span>
                    {device.assignedTo?.reason && (
                      <>
                        <span>•</span>
                        <span>Reason: {
                          CHECKOUT_REASONS.find(r => r.id === device.assignedTo?.reason)?.name || 
                          device.assignedTo.reason
                        }</span>
                      </>
                    )}
                    {device.assignedTo?.homeroomTeacher && (
                      <>
                        <span>•</span>
                        <span>Homeroom: {device.assignedTo.homeroomTeacher}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="ml-4 flex items-center space-x-4 text-sm text-gray-500 flex-shrink-0">
                {device.assignedTo ? (
                  <>
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      <span className="truncate max-w-[150px]">{device.assignedTo.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {checkoutDays} {checkoutDays === 1 ? 'day' : 'days'}
                    </span>
                  </>
                ) : (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    <span>Available</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
