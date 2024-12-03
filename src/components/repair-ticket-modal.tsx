import { useState } from 'react';
import { X, AlertTriangle, Laptop, QrCode } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { OperationsHeroAPI, ISSUE_TYPES } from '../lib/api/operations-hero';
import { BarcodeScanner } from './barcode-scanner';
import { DeviceSearch } from './device-search';
import toast from 'react-hot-toast';

type RepairTicketModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  schoolId: string;
};

export function RepairTicketModal({
  isOpen,
  onClose,
  onSuccess,
  schoolId
}: RepairTicketModalProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    schoolId,
    deviceType: 'chromebook' as const,
    noBarcode: false,
    fullName: '',
    issueType: '',
    serialNumber: '',
    notes: '',
    isStaff: false
  });
  const [isScanning, setIsScanning] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTicketMutation = useMutation({
    mutationFn: OperationsHeroAPI.createTicket,
    onSuccess: () => {
      console.log('Repair ticket created successfully');
      toast.success('Repair ticket created successfully');
      onSuccess();
      handleClose();
    },
    onError: (err: Error) => {
      console.error('Failed to create repair ticket:', err);
      setError(err.message);
      toast.error(err.message);
    }
  });

  const handleClose = () => {
    setStep(1);
    setFormData({
      schoolId,
      deviceType: 'chromebook',
      noBarcode: false,
      fullName: '',
      issueType: '',
      serialNumber: '',
      notes: '',
      isStaff: false
    });
    setIsScanning(false);
    setShowManualEntry(false);
    setError(null);
    onClose();
  };

  const handleScan = (barcode: string) => {
    if (!isScanning) return;
    console.log('Scanned barcode:', barcode);
    setFormData(prev => ({ ...prev, serialNumber: barcode }));
    setIsScanning(false);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    console.log('Submitting repair ticket with data:', formData);

    if (!formData.fullName || !formData.issueType || !formData.serialNumber) {
      console.error('Validation failed - missing required fields');
      setError('Please fill in all required fields');
      return;
    }

    try {
      await createTicketMutation.mutateAsync(formData);
    } catch (error) {
      console.error('Mutation error:', error);
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
            <h3 className="text-lg font-medium text-gray-900">Device Repair</h3>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <BarcodeScanner
                onScan={handleScan}
                onError={setError}
                minLength={1}
              />

              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {!showManualEntry ? (
                <div className="text-center space-y-4">
                  <div className="animate-pulse flex justify-center">
                    <QrCode className="h-12 w-12 text-sky-500" />
                  </div>
                  <p className="text-sm text-gray-600">
                    Scan the barcode on the device that needs repair
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowManualEntry(true)}
                    className="text-sm text-sky-500 hover:text-sky-600"
                  >
                    Barcode Scanner Not Working?
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Enter Device Barcode/Asset ID
                    </label>
                    <DeviceSearch
                      schoolId={schoolId}
                      value={formData.serialNumber}
                      onChange={(value) => setFormData(prev => ({ ...prev, serialNumber: value }))}
                      onSelect={(device) => {
                        setFormData(prev => ({ ...prev, serialNumber: device.assetTag }));
                        setStep(2);
                      }}
                      mode="any"
                      placeholder="Enter device barcode or asset tag"
                    />
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
                      Back to Scanner
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      disabled={!formData.serialNumber}
                      className="flex-1 rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 p-4">
                  <div className="flex items-center">
                    <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Type
                </label>
                <select
                  value={formData.isStaff ? 'staff' : 'student'}
                  onChange={(e) => setFormData({ ...formData, isStaff: e.target.value === 'staff' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                  required
                >
                  <option value="student">Student</option>
                  <option value="staff">Staff</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Device Type
                </label>
                <select
                  value={formData.deviceType}
                  onChange={(e) => setFormData({ ...formData, deviceType: e.target.value as 'chromebook' | 'windows' | 'mac' | 'other' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                  required
                >
                  <option value="chromebook">Chromebook</option>
                  <option value="windows">Windows Computer</option>
                  <option value="mac">Mac Computer</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Issue Type
                </label>
                <select
                  value={formData.issueType}
                  onChange={(e) => setFormData({ ...formData, issueType: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                  required
                >
                  <option value="">Select issue type</option>
                  {ISSUE_TYPES.map(type => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                  placeholder="Describe the issue in detail..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={createTicketMutation.isPending}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50"
                >
                  {createTicketMutation.isPending ? 'Creating...' : 'Submit Ticket'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
