import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { fetchRepairTickets, exportRepairTickets } from '../../lib/api/repair-tickets';
import { ISSUE_TYPES } from '../../lib/api/operations-hero';
import { getSchools } from '../../lib/utils';
import toast from 'react-hot-toast';
import type { RepairTicket } from '../../lib/api/repair-tickets';

type SortField = keyof RepairTicket;
type SortDirection = 'asc' | 'desc';

export function RepairTickets() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    deviceBarcode: '',
    fullName: '',
    issueType: '',
    schoolId: '',
    isStaff: undefined as boolean | undefined,
    status: '' as '' | 'open' | 'closed'
  });

  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: 'createdAt',
    direction: 'desc',
  });

  const { data: tickets, isLoading } = useQuery({
    queryKey: ['repair-tickets', filters],
    queryFn: () => fetchRepairTickets(filters),
  });

  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction:
        current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedTickets = tickets ? [...tickets].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    
    switch (sortConfig.field) {
      case 'createdAt':
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction;
      case 'fullName':
      case 'deviceType':
      case 'deviceBarcode':
      case 'issueType':
      case 'schoolId':
      case 'status':
        return (a[sortConfig.field].localeCompare(b[sortConfig.field])) * direction;
      case 'isStaff':
        return ((a.isStaff === b.isStaff) ? 0 : a.isStaff ? 1 : -1) * direction;
      default:
        return 0;
    }
  }) : [];

  const handleExport = async () => {
    try {
      const csvContent = await exportRepairTickets(filters);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `repair-tickets-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Repair tickets exported successfully');
    } catch (error) {
      toast.error('Failed to export repair tickets');
    }
  };

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <th
      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-50"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center space-x-1">
        <span>{label}</span>
        <span className="inline-flex flex-col">
          <ChevronUp
            className={`h-3 w-3 ${
              sortConfig.field === field && sortConfig.direction === 'asc'
                ? 'text-sky-500'
                : 'text-gray-400'
            }`}
          />
          <ChevronDown
            className={`h-3 w-3 ${
              sortConfig.field === field && sortConfig.direction === 'desc'
                ? 'text-sky-500'
                : 'text-gray-400'
            }`}
          />
        </span>
      </div>
    </th>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Calendar className="h-6 w-6 text-sky-500" />
          <h2 className="text-3xl font-bold text-gray-900">Repair Tickets</h2>
        </div>
        <button
          onClick={handleExport}
          className="flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sky-500 hover:bg-sky-600"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              School
            </label>
            <select
              value={filters.schoolId}
              onChange={(e) => setFilters({ ...filters, schoolId: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
            >
              <option value="">All Schools</option>
              {getSchools().map((school) => (
                <option key={school.id} value={school.id}>
                  {school.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Device Barcode
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.deviceBarcode}
                onChange={(e) => setFilters({ ...filters, deviceBarcode: e.target.value })}
                className="block w-full pl-10 rounded-md border-gray-300 focus:border-sky-500 focus:ring-sky-500"
                placeholder="Search by barcode"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.fullName}
                onChange={(e) => setFilters({ ...filters, fullName: e.target.value })}
                className="block w-full pl-10 rounded-md border-gray-300 focus:border-sky-500 focus:ring-sky-500"
                placeholder="Search by name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Issue Type
            </label>
            <select
              value={filters.issueType}
              onChange={(e) => setFilters({ ...filters, issueType: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
            >
              <option value="">All Issues</option>
              {ISSUE_TYPES.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Type
            </label>
            <select
              value={filters.isStaff === undefined ? '' : filters.isStaff.toString()}
              onChange={(e) => setFilters({
                ...filters,
                isStaff: e.target.value === '' ? undefined : e.target.value === 'true'
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
            >
              <option value="">All</option>
              <option value="true">Staff</option>
              <option value="false">Student</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({
                ...filters,
                status: e.target.value as '' | 'open' | 'closed'
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
            >
              <option value="">All</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-4">Loading repair tickets...</div>
        ) : !sortedTickets?.length ? (
          <div className="text-center py-4 text-gray-500">No repair tickets found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader field="createdAt" label="Date/Time" />
                  <SortHeader field="fullName" label="Name" />
                  <SortHeader field="deviceType" label="Device Type" />
                  <SortHeader field="deviceBarcode" label="Device Barcode" />
                  <SortHeader field="issueType" label="Issue" />
                  <SortHeader field="schoolId" label="School" />
                  <SortHeader field="isStaff" label="Type" />
                  <SortHeader field="status" label="Status" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTickets.map((ticket) => {
                  const date = new Date(ticket.createdAt);
                  const school = getSchools().find(s => s.id === ticket.schoolId)?.name || ticket.schoolId;
                  const issueType = ISSUE_TYPES.find(t => t.id === ticket.issueType)?.name || ticket.issueType;
                  
                  return (
                    <tr key={ticket.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {date.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.deviceType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {ticket.deviceBarcode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {issueType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {school}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ticket.isStaff
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {ticket.isStaff ? 'Staff' : 'Student'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          ticket.status === 'open'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
