import { useState } from 'react';
import { X } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { addDevice } from '../lib/api';
import { DEVICE_TYPES } from '../lib/utils';

type DeviceRegistrationModalProps = {
  schoolId: string;
  assetTag: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

export function DeviceRegistrationModal({
  schoolId,
  assetTag,
  isOpen,
  onClose,
  onSuccess,
}: DeviceRegistrationModalProps) {
  const [selectedType, setSelectedType] = useState(DEVICE_TYPES[0].id);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const addDeviceMutation = useMutation({
    mutationFn: async () => {
      try {
        await addDevice({
          assetTag,
          model: selectedType,
          schoolId,
        });
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to register device');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      onSuccess?.();
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addDeviceMutation.mutateAsync();
  };

  const handleClose = () => {
    setSelectedType(DEVICE_TYPES[0].id);
    setError(null);
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
            <h3 className="text-lg font-medium text-gray-900">New Device Detected</h3>
            <p className="mt-2 text-sm text-gray-600">
              Would you like to add this device to inventory?
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Asset Tag
              </label>
              <input
                type="text"
                value={assetTag}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Device Type
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              >
                {DEVICE_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="mt-5 sm:mt-6 flex space-x-3">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addDeviceMutation.isPending}
                className="flex-1 rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-50"
              >
                {addDeviceMutation.isPending ? 'Adding...' : 'Add Device'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
