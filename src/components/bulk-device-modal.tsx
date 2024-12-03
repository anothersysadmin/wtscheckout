import { useState } from 'react';
import { X, QrCode, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDevice } from '../lib/api';
import { DEVICE_TYPES, getSchools } from '../lib/utils';
import { BarcodeScanner } from './barcode-scanner';
import toast from 'react-hot-toast';

type BulkDeviceModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function BulkDeviceModal({ isOpen, onClose }: BulkDeviceModalProps) {
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState('');
  const [selectedSchool, setSelectedSchool] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCount, setSuccessCount] = useState(0);
  const schools = getSchools();
  const queryClient = useQueryClient();

  const addDeviceMutation = useMutation({
    mutationFn: async (assetTag: string) => {
      try {
        await addDevice({
          assetTag,
          model: selectedType,
          schoolId: selectedSchool,
        });
        setSuccessCount(prev => prev + 1);
        toast.success(`Device ${assetTag} added successfully`);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to add device');
      }
    },
    onError: (err: Error) => {
      setError(err.message);
      toast.error(err.message);
    },
  });

  const handleScan = async (scannedBarcode: string) => {
    if (!isScanning) return;
    setError(null);
    await addDeviceMutation.mutateAsync(scannedBarcode);
  };

  const handleNextStep = () => {
    if (!selectedType || !selectedSchool) {
      setError('Please select both device type and school');
      return;
    }
    setError(null);
    setStep(2);
    setIsScanning(true);
    queryClient.invalidateQueries({ queryKey: ['devices'] });
  };

  const handleClose = () => {
    setStep(1);
    setSelectedType('');
    setSelectedSchool('');
    setIsScanning(false);
    setError(null);
    setSuccessCount(0);
    onClose();
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
            <h3 className="text-lg font-medium text-gray-900">Bulk Add Devices</h3>
            {step === 2 && (
              <p className="mt-2 text-sm text-gray-600">
                Devices added: {successCount}
              </p>
            )}
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          )}

          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Device Type
                </label>
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                >
                  <option value="">Select device type</option>
                  {DEVICE_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  School
                </label>
                <select
                  value={selectedSchool}
                  onChange={(e) => setSelectedSchool(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                >
                  <option value="">Select school</option>
                  {schools.map((school) => (
                    <option key={school.id} value={school.id}>
                      {school.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleNextStep}
                disabled={!selectedType || !selectedSchool}
                className="w-full rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <BarcodeScanner
                onScan={handleScan}
                onError={setError}
                minLength={1}
              />

              <div className="text-center space-y-4">
                <div className="animate-pulse flex justify-center">
                  <QrCode className="h-12 w-12 text-sky-500" />
                </div>
                <p className="text-sm text-gray-600">
                  Ready to scan device barcodes...
                </p>
                <p className="text-xs text-gray-500">
                  Scanning {DEVICE_TYPES.find(t => t.id === selectedType)?.name} devices for{' '}
                  {schools.find(s => s.id === selectedSchool)?.name}
                </p>
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Back to Selection
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
