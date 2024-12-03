import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { LogIn, LogOut, Wrench } from 'lucide-react';
import { DeviceList } from '../components/device-list';
import { DeviceCheckoutModal } from '../components/device-checkout-modal';
import { DeviceCheckinModal } from '../components/device-checkin-modal';
import { RepairTicketModal } from '../components/repair-ticket-modal';
import { getSchools } from '../lib/utils';

export function SchoolPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const schools = getSchools();
  const school = schools.find((s) => s.id === schoolId);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showCheckinModal, setShowCheckinModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);

  if (!school) {
    return <div>School not found</div>;
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900">{school.name}</h2>
        <p className="mt-2 text-gray-600">Device Management System</p>
      </div>

      <div className="space-y-4">
        {/* Device Management Actions */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={() => setShowCheckoutModal(true)}
            className="flex items-center px-6 py-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Check Out Device
          </button>
          <button
            onClick={() => setShowCheckinModal(true)}
            className="flex items-center px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <LogIn className="h-5 w-5 mr-2" />
            Check In Device
          </button>
        </div>

        {/* Repair Ticket Action */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowRepairModal(true)}
            className="flex items-center px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
          >
            <Wrench className="h-5 w-5 mr-2" />
            Submit Repair Ticket Without Checking Out Loaner Device
          </button>
        </div>
      </div>

      <DeviceList schoolId={schoolId!} />

      <DeviceCheckoutModal
        schoolId={schoolId!}
        isOpen={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
      />

      <DeviceCheckinModal
        schoolId={schoolId!}
        isOpen={showCheckinModal}
        onClose={() => setShowCheckinModal(false)}
      />

      <RepairTicketModal
        schoolId={schoolId!}
        isOpen={showRepairModal}
        onClose={() => setShowRepairModal(false)}
        onSuccess={() => setShowRepairModal(false)}
      />
    </div>
  );
}
