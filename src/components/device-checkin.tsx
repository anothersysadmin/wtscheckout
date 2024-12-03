import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { QrCode, AlertCircle } from 'lucide-react';
import { checkinDevice } from '../lib/api';
import { BarcodeScanner } from './barcode-scanner';

type DeviceCheckinProps = {
  schoolId: string;
};

export function DeviceCheckin({ schoolId }: DeviceCheckinProps) {
  const [barcode, setBarcode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const checkinMutation = useMutation({
    mutationFn: (params: { deviceId: string }) =>
      checkinDevice(params.deviceId, 'Device checked in'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setBarcode('');
      setError(null);
    },
    onError: (err) => {
      setError('Failed to check in device. Please try again.');
    },
  });

  const handleScan = async (scannedBarcode: string) => {
    setBarcode(scannedBarcode);
    try {
      await checkinMutation.mutateAsync({ deviceId: scannedBarcode });
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcode) return;
    await handleScan(barcode);
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Check In Device</h3>
      
      {/* Barcode Scanner Integration */}
      <BarcodeScanner
        onScan={handleScan}
        onError={setError}
        minLength={5}
        maxLength={50}
        timeout={100}
      />

      <form onSubmit={handleManualSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Device Barcode
          </label>
          <div className="mt-1 relative">
            <input
              type="text"
              value={barcode}
              onChange={(e) => {
                setBarcode(e.target.value);
                setError(null);
              }}
              className={`block w-full rounded-md shadow-sm pl-10 ${
                error
                  ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:border-sky-500 focus:ring-sky-500'
              }`}
              placeholder="Scan or enter barcode"
            />
            <QrCode className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {error && (
            <div className="mt-2 flex items-center text-sm text-red-600">
              <AlertCircle className="h-4 w-4 mr-1" />
              {error}
            </div>
          )}
          <p className="mt-2 text-sm text-gray-500">
            Scan a barcode or manually enter the device ID
          </p>
        </div>

        <button
          type="submit"
          disabled={!barcode || checkinMutation.isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkinMutation.isPending ? 'Processing...' : 'Check In Device'}
        </button>
      </form>
    </div>
  );
}
