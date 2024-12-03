import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Download, Search, ChevronUp, ChevronDown } from 'lucide-react';
import { fetchDeviceLogs, exportDeviceLogs } from '../../lib/api';
import { DEVICE_TYPES, CHECKOUT_REASONS, getSchools, getDaysSince } from '../../lib/utils';
import toast from 'react-hot-toast';
import type { DeviceLog } from '../../lib/api/types';

type SortField = 'timestamp' | 'assetTag' | 'action' | 'userName' | 'homeroomTeacher' | 'reason' | 'schoolId';
type SortDirection = 'asc' | 'desc';

export function DeviceLogs() {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    assetTag: '',
    userName: '',
    reason: '',
    homeroomTeacher: '',
    action: '',
    schoolId: '',
  });

  const [sortConfig, setSortConfig] = useState<{
    field: SortField;
    direction: SortDirection;
  }>({
    field: 'timestamp',
    direction: 'desc',
  });

  const { data: logs, isLoading } = useQuery({
    queryKey: ['device-logs', filters],
    queryFn: () => fetchDeviceLogs(filters),
  });

  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction:
        current.field === field && current.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const sortedLogs = logs ? [...logs].sort((a, b) => {
    const direction = sortConfig.direction === 'asc' ? 1 : -1;
    
    switch (sortConfig.field) {
      case 'timestamp':
        return (new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()) * direction;
      case 'assetTag':
        return a.assetTag.localeCompare(b.assetTag) * direction;
      case 'action':
        return a.action.localeCompare(b.action) * direction;
      case 'userName':
        return a.userName.localeCompare(b.userName) * direction;
      case 'homeroomTeacher':
        return ((a.homeroomTeacher || '') as string).localeCompare((b.homeroomTeacher || '') as string) * direction;
      case 'reason':
        return ((a.reason || '') as string).localeCompare((b.reason || '') as string) * direction;
      case 'schoolId':
        const schoolA = getSchools().find(s => s.id === a.schoolId)?.name || a.schoolId;
        const schoolB = getSchools().find(s => s.id === b.schoolId)?.name || b.schoolId;
        return schoolA.localeCompare(schoolB) * direction;
      default:
        return 0;
    }
  }) : [];

  const handleExport = async () => {
    try {
      const csvContent = await exportDeviceLogs(filters);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `device-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Logs exported successfully');
    } catch (error) {
      toast.error('Failed to export logs');
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
          <h2 className="text-3xl font-bold text-gray-900">Device Logs</h2>
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
              Asset Tag
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.assetTag}
                onChange={(e) => setFilters({ ...filters, assetTag: e.target.value })}
                className="block w-full pl-10 rounded-md border-gray-300 focus:border-sky-500 focus:ring-sky-500"
                placeholder="Search by asset tag"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              User Name
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.userName}
                onChange={(e) => setFilters({ ...filters, userName: e.target.value })}
                className="block w-full pl-10 rounded-md border-gray-300 focus:border-sky-500 focus:ring-sky-500"
                placeholder="Search by user name"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Homeroom Teacher
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                value={filters.homeroomTeacher}
                onChange={(e) => setFilters({ ...filters, homeroomTeacher: e.target.value })}
                className="block w-full pl-10 rounded-md border-gray-300 focus:border-sky-500 focus:ring-sky-500"
                placeholder="Search by homeroom teacher"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => setFilters({ ...filters, action: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-sky-500 focus:ring-sky-500"
            >
              <option value="">All Actions</option>
              <option value="checkout">Check Out</option>
              <option value="checkin">Check In</option>
            </select>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-4">Loading logs...</div>
        ) : !sortedLogs?.length ? (
          <div className="text-center py-4 text-gray-500">No logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader field="timestamp" label="Date/Time" />
                  <SortHeader field="assetTag" label="Asset Tag" />
                  <SortHeader field="action" label="Action" />
                  <SortHeader field="userName" label="User" />
                  <SortHeader field="homeroomTeacher" label="Homeroom Teacher" />
                  <SortHeader field="reason" label="Reason" />
                  <SortHeader field="schoolId" label="School" />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedLogs.map((log) => {
                  const date = new Date(log.timestamp);
                  const school = getSchools().find(s => s.id === log.schoolId)?.name || log.schoolId;
                  
                  return (
                    <tr key={log.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {date.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.assetTag}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.action === 'checkout'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {log.action === 'checkout' ? 'Check Out' : 'Check In'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.userName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.homeroomTeacher || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {log.reason ? CHECKOUT_REASONS.find(r => r.id === log.reason)?.name || log.reason : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {school}
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
