import { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchDevices } from '../lib/api';
import { DEVICE_TYPES } from '../lib/utils';
import type { Device } from '../lib/api';

type DeviceSearchProps = {
  schoolId: string;
  onSelect: (device: Device) => void;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  mode?: 'checkout' | 'checkin' | 'any';
};

export function DeviceSearch({
  schoolId,
  onSelect,
  value,
  onChange,
  error,
  placeholder = "Enter device barcode or asset tag",
  mode = 'any'
}: DeviceSearchProps) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const { data: devices = [] } = useQuery({
    queryKey: ['devices', schoolId],
    queryFn: () => fetchDevices(schoolId),
    staleTime: 30000,
  });

  const filteredDevices = devices
    .filter(device => {
      const matchesSearch = device.assetTag.toLowerCase().includes(value.toLowerCase());
      if (mode === 'any') return matchesSearch;
      const matchesMode = mode === 'checkout' 
        ? device.status === 'available'
        : device.status === 'checked_out';
      return matchesSearch && matchesMode;
    })
    .slice(0, 5);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          className={`block w-full rounded-md shadow-sm pl-10 ${
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500'
          }`}
          placeholder={placeholder}
          autoComplete="off"
        />
        <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
      </div>

      {showSuggestions && value && filteredDevices.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white rounded-md border border-gray-200 shadow-lg max-h-60 overflow-auto divide-y divide-gray-100">
          {filteredDevices.map((device) => (
            <li key={device.id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(device);
                  setShowSuggestions(false);
                }}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none transition-colors duration-150"
              >
                <div className="flex items-center justify-between">
                  <div className="min-w-0 flex-1">
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
                    <div className="mt-1 text-xs text-gray-500 space-x-2">
                      <span className="inline-block">Asset Tag: {device.assetTag}</span>
                      {device.serial && (
                        <>
                          <span className="inline-block">•</span>
                          <span className="inline-block">SN: {device.serial}</span>
                        </>
                      )}
                    </div>
                    {device.assignedTo && (
                      <div className="mt-1 text-xs text-gray-500">
                        Currently checked out to: {device.assignedTo.name}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && (
        <p className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
