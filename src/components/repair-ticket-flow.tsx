import { useState } from 'react';
import { AlertTriangle, QrCode, Laptop, ArrowRight, X } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { OperationsHeroAPI, ISSUE_TYPES } from '../lib/api/operations-hero';
import { BarcodeScanner } from './barcode-scanner';
import { DeviceSearch } from './device-search';
import toast from 'react-hot-toast';

type RepairTicketFlowProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (loanerBarcode: string) => void;
  schoolId: string;
  isStaff?: boolean;
};

type Step = 'broken-device' | 'details' | 'loaner-device';

export function RepairTicketFlow({
  isOpen,
  onClose,
  onComplete,
  schoolId,
  isStaff = false
}: RepairTicketFlowProps) {
  const [step, setStep] = useState<Step>('broken-device');
  const [formData, setFormData] = useState({
    schoolId,
    deviceType: 'chromebook' as const,
    noBarcode: false,
    fullName: '',
    issueType: '',
    serialNumber: '',
    notes: ''
  });
  const [isScanning, setIsScanning] = useState(true);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualBarcode, setManualBarcode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const createTicketMutation = useMutation({
    mutationFn: OperationsHeroAPI.createTicket,
    onSuccess: () => {
      console.log('Repair ticket created successfully');
      toast.success('Repair ticket created successfully');
      setStep('loaner-device');
    },
    onError: (err: Error) => {
      console.error('Failed to create repair ticket:', err);
      setError(err.message);
      toast.error(err.message);
    }
  });

  const handleClose = () => {
    setStep('broken-device');
    setFormData({
      schoolId,
      deviceType: 'chromebook',
      noBarcode: false,
      fullName: '',
      issueType: '',
      serialNumber: '',
      notes: ''
    });
    setIsScanning(true);
    setShowManualEntry(false);
    setManualBarcode('');
    setError(null);
    onClose();
  };

  const handleScan = (barcode: string) => {
    if (!isScanning) return;
    console.log('Scanned barcode:', barcode);
    processBarcode(barcode);
  };

  const processBarcode = (barcode: string) => {
    if (step === 'broken-device') {
      setFormData(prev => ({ ...prev, serialNumber: barcode }));
      setStep('details');
    } else if (step === 'loaner-device') {
      onComplete(barcode); // Pass the loaner barcode back
      handleClose();
    }
    setIsScanning(false);
    setShowManualEntry(false);
    setManualBarcode('');
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualBarcode) return;
    processBarcode(manualBarcode);
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
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

  const renderManualEntry = (isLoanerDevice: boolean) => (
    <form onSubmit={handleManualSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Enter Barcode/Asset ID manually
        </label>
        <div className="mt-1">
          <DeviceSearch
            schoolId={schoolId}
            value={manualBarcode}
            onChange={setManualBarcode}
            onSelect={(device) => {
              setManualBarcode(device.assetTag);
              processBarcode(device.assetTag);
            }}
            mode={isLoanerDevice ? 'checkout' : 'any'}
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
            setManualBarcode('');
          }}
          className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Return to Scanner
        </button>
        <button
          type="submit"
          disabled={!manualBarcode}
          className="flex-1 rounded-md bg-sky-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sky-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 disabled:opacity-50"
        >
          Submit
        </button>
      </div>
    </form>
  );

  const renderScannerInterface = (title: string, description: string, isLoanerDevice: boolean = false) => (
    <div className="space-y-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      </div>

      {!showManualEntry && (
        <>
          <BarcodeScanner
            onScan={handleScan}
            onError={setError}
            minLength={1}
          />

          <div className="text-center space-y-4">
            <div className="animate-pulse flex justify-center">
              {isLoanerDevice ? (
                <Laptop className="h-12 w-12 text-sky-500" />
              ) : (
                <QrCode className="h-12 w-12 text-sky-500" />
              )}
            </div>
            <p className="text-sm text-gray-600">{description}</p>
            <button
              type="button"
              onClick={() => {
                setIsScanning(false);
                setShowManualEntry(true);
              }}
              className="text-sm text-sky-500 hover:text-sky-600"
            >
              Barcode Scanner Not Working?
            </button>
          </div>
        </>
      )}

      {showManualEntry && renderManualEntry(isLoanerDevice)}
    </div>
  );

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

          {step === 'broken-device' && renderScannerInterface(
            'Scan Broken Device Barcode',
            'Please scan the barcode on the broken device',
            false
          )}

          {step === 'details' && (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Device Issue Details
                </h3>
              </div>

              <form onSubmit={handleSubmitDetails} className="space-y-4">
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
                    type="submit"
                    disabled={createTicketMutation.isPending}
                    className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600 disabled:opacity-50"
                  >
                    {createTicketMutation.isPending ? 'Creating...' : 'Submit Ticket'}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              </form>
            </>
          )}

          {step === 'loaner-device' && renderScannerInterface(
            'Scan Loaner Device Barcode',
            'Please scan the barcode on the loaner device',
            true
          )}
        </div>
      </div>
    </div>
  );
}
