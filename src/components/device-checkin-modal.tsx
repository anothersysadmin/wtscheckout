import { useState } from 'react';
import { X, QrCode } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkinDevice, deviceExists } from '../lib/api';
import { DeviceSearch } from './device-search';
import { BarcodeScanner } from './barcode-scanner';
import { DeviceRegistrationModal } from './device-registration-modal';
import { getSchools } from '../lib/utils';
import toast from 'react-hot-toast';

type DeviceCheckinModalProps = {
  schoolId: string;
  isOpen: boolean;
  onClose: () => void;
};

export function DeviceCheckinModal({ schoolId, isOpen, onClose }: DeviceCheckinModalProps) {
  const [deviceBarcode, setDeviceBarcode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [isScanning, setIsScanning] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const queryClient = useQueryClient();

  const schools = getSchools();
  const school = schools.find(s => s.id === schoolId);

  const checkinMutation = useMutation({
    mutationFn: async (deviceId: string) => {
      try {
        const exists = await deviceExists(deviceId);
        if (!exists) {
          throw new Error('Device not found in inventory');
        }
        await checkinDevice(deviceId);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to check in device');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      toast.success('Device checked in successfully');
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
      setIsScanning(false);
    },
  });

  const handleClose = () => {
    setDeviceBarcode('');
    setError(null);
    setIsScanning(true);
    setShowManualEntry(false);
    onClose();
  };

  const handleScan = async (scannedBarcode: string) => {
    if (!isScanning) return;
    
    setDeviceBarcode(scannedBarcode);
    setError(null);
    
    try {
      const exists = await deviceExists(scannedBarcode);
      if (!exists && school?.allowNewDevices) {
        setShowRegistration(true);
        setIsScanning(false);
        return;
      }

      await checkinMutation.mutateAsync(scannedBarcode);
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceBarcode) return;

    try {
      const exists = await deviceExists(deviceBarcode);
      if (!exists && school?.allowNewDevices) {
        setShowRegistration(true);
        return;
      }

      await checkinMutation.mutateAsync(deviceBarcode);
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />

        <div className="relative w-full max-w-md transform rounded-lg bg-white px-4 pb-4 pt-5 shadow-xl transition-all sm:p-6">
          <div className="absolute right-0 top-0 pr-4 pt-4">
            <button
              onClick={handleClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900">Check In Device</h3>
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <BarcodeScanner
            onScan={handleScan}
            onError={setError}
            minLength={1}
          />

          <div className="space-y-4">
            <div className="text-center space-y-4">
              {isScanning ? (
                <div className="space-y-3">
                  <div className="animate-pulse flex justify-center">
                    <QrCode className="h-12 w-12 text-sky-500" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Waiting for barcode scan...
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsScanning(false);
                      setShowManualEntry(true);
                    }}
                    className="text-sm text-sky-500 hover:text-sky-600"
                  >
                    Barcode scanning not working?
                  </button>
                </div>
              ) : showManualEntry ? (
                <form onSubmit={handleManualSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Device Asset Tag
                    </label>
                    <div className="mt-1">
                      <DeviceSearch
                        schoolId={schoolId}
                        value={deviceBarcode}
                        onChange={setDeviceBarcode}
                        onSelect={(device) => setDeviceBarcode(device.assetTag)}
                        mode="checkin"
                        placeholder="Enter asset tag number"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowManualEntry(false);
                        setIsScanning(true);
                      }}
                      className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                    >
                      Back to Scanning
                    </button>
                    <button
                      type="submit"
                      disabled={!deviceBarcode}
                      className="flex-1 rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-50"
                    >
                      Check In
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <DeviceRegistrationModal
        schoolId={schoolId}
        assetTag={deviceBarcode}
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={() => checkinMutation.mutate(deviceBarcode)}
      />
    </div>
  );
}
