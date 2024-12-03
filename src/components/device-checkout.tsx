import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, AlertCircle } from 'lucide-react';
import { checkoutDevice, fetchUsers } from '../lib/api';
import { DEVICE_TYPES, CHECKOUT_REASONS } from '../lib/utils';
import { BarcodeScanner } from './barcode-scanner';

type DeviceCheckoutProps = {
  schoolId: string;
};

export function DeviceCheckout({ schoolId }: DeviceCheckoutProps) {
  const [selectedType, setSelectedType] = useState('');
  const [barcode, setBarcode] = useState('');
  const [reason, setReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const filteredUsers = users?.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const checkoutMutation = useMutation({
    mutationFn: async ({ deviceId, userId, note }: { deviceId: string; userId: string; note: string }) => {
      try {
        await checkoutDevice(deviceId, userId, note);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to check out device. Please try again.');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setBarcode('');
      setReason('');
      setSelectedUser(null);
      setSearchQuery('');
      setError(null);
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleScan = async (scannedBarcode: string) => {
    setBarcode(scannedBarcode);
    setError(null);
    
    // If we have all required fields, process the checkout automatically
    if (selectedUser && reason) {
      try {
        await checkoutMutation.mutateAsync({
          deviceId: scannedBarcode,
          userId: selectedUser,
          note: `Checked out: ${reason}`,
        });
      } catch (error) {
        // Error handling is done in mutation callbacks
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedType || !barcode || !reason || !selectedUser) return;

    await checkoutMutation.mutateAsync({
      deviceId: barcode,
      userId: selectedUser,
      note: `Checked out: ${reason}`,
    });
  };

  return (
    <div className="bg-white shadow-sm rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Check Out Device</h3>

      {/* Barcode Scanner Integration */}
      <BarcodeScanner
        onScan={handleScan}
        onError={setError}
        minLength={1} // Changed to allow any length barcode
        maxLength={50}
        timeout={100}
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEVICE_TYPES.map((type) => (
            <button
              key={type.id}
              type="button"
              onClick={() => setSelectedType(type.id)}
              className={`p-4 text-left rounded-lg border-2 transition-colors ${
                selectedType === type.id
                  ? 'border-sky-500 bg-sky-50'
                  : 'border-gray-200 hover:border-sky-200'
              }`}
            >
              {type.name}
            </button>
          ))}
        </div>

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
            {error && (
              <div className="mt-2 flex items-center text-sm text-red-600">
                <AlertCircle className="h-4 w-4 mr-1" />
                {error}
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Search User
          </label>
          <div className="relative mt-1">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500 pl-10"
              placeholder="Search by name or email"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          {searchQuery && filteredUsers && (
            <div className="mt-2 max-h-48 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-sm">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => {
                    setSelectedUser(user.id);
                    setSearchQuery(user.name);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50"
                >
                  <div className="text-sm font-medium text-gray-900">
                    {user.name}
                  </div>
                  <div className="text-sm text-gray-500">{user.email}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Reason for Check-out
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
          >
            <option value="">Select a reason</option>
            {CHECKOUT_REASONS.map((reason) => (
              <option key={reason.id} value={reason.id}>
                {reason.name}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!selectedType || !barcode || !reason || !selectedUser || checkoutMutation.isPending}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-white bg-sky-500 hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {checkoutMutation.isPending ? 'Processing...' : 'Check Out Device'}
        </button>
      </form>
    </div>
  );
}
