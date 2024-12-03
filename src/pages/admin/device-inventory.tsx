import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Tablet, List } from 'lucide-react';
import { fetchDevices, addDevice, removeDevice } from '../../lib/api';
import { getSchools, DEVICE_TYPES, getDaysSince } from '../../lib/utils';
import { BulkDeviceModal } from '../../components/bulk-device-modal';

export function DeviceInventory() {
  const schools = getSchools();
  const [selectedSchool, setSelectedSchool] = useState(schools[0].id);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showBulkAdd, setShowBulkAdd] = useState(false);
  const [newDevice, setNewDevice] = useState({
    assetTag: '',
    model: DEVICE_TYPES[0].id,
  });
  const [error, setError] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: devices, isLoading } = useQuery({
    queryKey: ['devices', selectedSchool],
    queryFn: () => fetchDevices(selectedSchool),
  });

  const addDeviceMutation = useMutation({
    mutationFn: (data: typeof newDevice & { schoolId: string }) => addDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      setShowAddForm(false);
      setNewDevice({ assetTag: '', model: DEVICE_TYPES[0].id });
      setError(null);
    },
    onError: (error: Error) => {
      setError(error.message);
    },
  });

  const removeDeviceMutation = useMutation({
    mutationFn: removeDevice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
    },
  });

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    addDeviceMutation.mutate({ ...newDevice, schoolId: selectedSchool });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Tablet className="h-6 w-6 text-sky-500" />
          <h2 className="text-3xl font-bold text-gray-900">Device Inventory</h2>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowBulkAdd(true)}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600"
          >
            <List className="h-4 w-4 mr-2" />
            Bulk Add
          </button>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Device
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Select School
          </label>
          <select
            value={selectedSchool}
            onChange={(e) => setSelectedSchool(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
          >
            {schools.map((school) => (
              <option key={school.id} value={school.id}>
                {school.name}
              </option>
            ))}
          </select>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddDevice} className="mt-6 space-y-4 p-4 bg-gray-50 rounded-lg">
            {error && (
              <div className="p-3 bg-red-50 text-red-700 rounded-md">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Asset Tag
              </label>
              <input
                type="text"
                value={newDevice.assetTag}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, assetTag: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Device Type
              </label>
              <select
                value={newDevice.model}
                onChange={(e) =>
                  setNewDevice({ ...newDevice, model: e.target.value })
                }
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
              >
                {DEVICE_TYPES.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={addDeviceMutation.isPending}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50"
              >
                {addDeviceMutation.isPending ? 'Adding...' : 'Add Device'}
              </button>
            </div>
          </form>
        )}

        {isLoading ? (
          <div className="text-center py-4">Loading devices...</div>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Asset Tag
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Model
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Days Checked Out
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {devices?.map((device) => {
                  const checkoutDays = device.assignedTo ? getDaysSince(new Date(device.assignedTo.timestamp)) : 0;
                  
                  return (
                    <tr key={device.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {device.assetTag}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {DEVICE_TYPES.find(type => type.id === device.model)?.name || device.model}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          device.status === 'available'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {device.status === 'available' ? 'Available' : 'Checked Out'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {device.assignedTo?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {device.status === 'checked_out' ? `${checkoutDays} ${checkoutDays === 1 ? 'day' : 'days'}` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => removeDeviceMutation.mutate(device.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <BulkDeviceModal
        isOpen={showBulkAdd}
        onClose={() => setShowBulkAdd(false)}
      />
    </div>
  );
}
