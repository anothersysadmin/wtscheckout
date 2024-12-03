import { useState } from 'react';
import { X, QrCode, User, FileText } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkoutDevice, deviceExists } from '../lib/api';
import { CHECKOUT_REASONS, getSchools } from '../lib/utils';
import { BarcodeScanner } from './barcode-scanner';
import { DeviceRegistrationModal } from './device-registration-modal';
import { RepairTicketFlow } from './repair-ticket-flow';
import { DeviceSearch } from './device-search';
import toast from 'react-hot-toast';

type DeviceCheckoutModalProps = {
  schoolId: string;
  isOpen: boolean;
  onClose: () => void;
};

export function DeviceCheckoutModal({ schoolId, isOpen, onClose }: DeviceCheckoutModalProps) {
  const [step, setStep] = useState(1);
  const [deviceBarcode, setDeviceBarcode] = useState('');
  const [userName, setUserName] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [homeroomTeacher, setHomeroomTeacher] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showRegistration, setShowRegistration] = useState(false);
  const [showRepairFlow, setShowRepairFlow] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [showManualEntry, setShowManualEntry] = useState(false);
  
  const queryClient = useQueryClient();

  const schools = getSchools();
  const school = schools.find(s => s.id === schoolId);

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      if (!deviceBarcode || !userName || !selectedReason) {
        throw new Error('Please fill in all required fields');
      }

      try {
        await checkoutDevice(deviceBarcode, userName, selectedReason, homeroomTeacher);
      } catch (error) {
        throw new Error(error instanceof Error ? error.message : 'Failed to check out device');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['devices'] });
      handleClose();
    },
    onError: (err: Error) => {
      setError(err.message);
      setIsScanning(false);
    },
  });

  const handleClose = () => {
    setDeviceBarcode('');
    setUserName('');
    setSelectedReason('');
    setHomeroomTeacher('');
    setError(null);
    setStep(1);
    setIsScanning(false);
    setShowManualEntry(false);
    setShowRepairFlow(false);
    onClose();
  };

  const handleScan = async (scannedBarcode: string) => {
    if (!isScanning) return;
    
    setDeviceBarcode(scannedBarcode);
    setError(null);
    
    const exists = await deviceExists(scannedBarcode);
    if (!exists && school?.allowNewDevices) {
      setShowRegistration(true);
      setIsScanning(false);
      return;
    }

    try {
      await checkoutMutation.mutateAsync();
    } catch (error) {
      // Error handling is done in mutation callbacks
    }
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !selectedReason) {
      setError('Please fill in all required fields');
      return;
    }

    setError(null);

    // Check if repair ticket is needed
    if (selectedReason === 'student-repair' || selectedReason === 'staff-repair') {
      setShowRepairFlow(true);
    } else {
      setStep(2);
      setIsScanning(true);
    }
  };

  const handleRepairFlowComplete = async (loanerBarcode?: string) => {
    setShowRepairFlow(false);
    if (loanerBarcode) {
      setDeviceBarcode(loanerBarcode);
      try {
        await checkoutMutation.mutateAsync();
      } catch (error) {
        // Error handling is done in mutation callbacks
      }
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceBarcode) return;

    const exists = await deviceExists(deviceBarcode);
    if (!exists && school?.allowNewDevices) {
      setShowRegistration(true);
      return;
    }

    await checkoutMutation.mutateAsync();
  };

  if (!isOpen) return null;

  return (
    <>
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
              <h3 className="text-lg font-medium text-gray-900">Check Out Device</h3>
            </div>

            {error && (
              <div className="mb-4 rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {step === 1 ? (
              <form onSubmit={handleNextStep} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span>User Name</span>
                    </div>
                  </label>
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                    placeholder="Enter full name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <span>Reason</span>
                    </div>
                  </label>
                  <select
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                    required
                  >
                    <option value="">Select a reason</option>
                    {CHECKOUT_REASONS.map((reason) => (
                      <option key={reason.id} value={reason.id}>
                        {reason.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Homeroom Teacher (Optional)
                  </label>
                  <input
                    type="text"
                    value={homeroomTeacher}
                    onChange={(e) => setHomeroomTeacher(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
                    placeholder="Enter homeroom teacher's name"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-50"
                >
                  Next
                </button>
              </form>
            ) : (
              <div className="space-y-4">
                <BarcodeScanner
                  onScan={handleScan}
                  onError={setError}
                  minLength={1}
                />

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
                            mode="checkout"
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
                          Check Out
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setIsScanning(false);
                    setShowManualEntry(false);
                    setDeviceBarcode('');
                  }}
                  className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700"
                >
                  Back to User Info
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DeviceRegistrationModal
        schoolId={schoolId}
        assetTag={deviceBarcode}
        isOpen={showRegistration}
        onClose={() => setShowRegistration(false)}
        onSuccess={() => checkoutMutation.mutate()}
      />

      <RepairTicketFlow
        schoolId={schoolId}
        isOpen={showRepairFlow}
        onClose={() => setShowRepairFlow(false)}
        onComplete={handleRepairFlowComplete}
        isStaff={selectedReason === 'staff-repair'}
      />
    </>
  );
}
