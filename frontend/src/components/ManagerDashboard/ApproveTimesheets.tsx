import React, { useState, useEffect } from 'react';
import { managerAPI, Timesheet } from '../../services/api';
import { CommonTable, TableColumn } from '../Common';
import { formatLocationWithDistance, getDistanceFromOffice } from '../../utils/locationUtils';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const ApproveTimesheets: React.FC = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchTimesheets();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredTimesheets(timesheets);
    } else {
      setFilteredTimesheets(timesheets.filter(ts => ts.status === filter));
    }
  }, [filter, timesheets]);

  const fetchTimesheets = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await managerAPI.getTeamTimesheets();
      console.log('Timesheets response:', res.data);
      setTimesheets(res.data || []);
    } catch (err: any) {
      console.error('Error fetching timesheets:', err);
      setError(err.response?.data?.message || 'Failed to load timesheets. Please ensure you have team members assigned.');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string, approved: boolean): Promise<void> => {
    try {
      setProcessingId(id);
      await managerAPI.approveTimesheet(id, approved);
      await fetchTimesheets(); // Refresh the list
    } catch (err: any) {
      console.error('Error approving timesheet:', err);
      alert(err.response?.data?.message || 'Failed to update timesheet. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getEmployeeName = (employeeId: Timesheet['employeeId']): string => {
    if (!employeeId) return 'N/A';
    if (typeof employeeId === 'string') return 'N/A';
    return employeeId.name || 'N/A';
  };

  const getEmployeeEmail = (employeeId: Timesheet['employeeId']): string => {
    if (!employeeId || typeof employeeId === 'string') return '';
    return employeeId.email || '';
  };

  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  const columns: TableColumn<Timesheet>[] = [
    {
      key: 'employeeId',
      header: 'Employee',
      render: (item) => (
        <div>
          <div className="text-sm font-medium text-gray-900 flex items-center">
            <PersonIcon className="mr-2 text-gray-400" style={{ fontSize: 16 }} />
            {getEmployeeName(item.employeeId)}
          </div>
          {getEmployeeEmail(item.employeeId) && (
            <div className="text-xs text-gray-500 mt-1">{getEmployeeEmail(item.employeeId)}</div>
          )}
        </div>
      )
    },
    {
      key: 'date',
      header: 'Date',
      render: (item) => (
        <div className="text-sm text-gray-900 flex items-center">
          <CalendarTodayIcon className="mr-2 text-gray-400" style={{ fontSize: 16 }} />
          {formatDate(item.date)}
        </div>
      )
    },
    {
      key: 'clockIn',
      header: 'Clock In/Out',
      render: (item) => (
        <div className="text-sm text-gray-600">
          {item.clockIn ? (
            <div>
              <div className="text-xs text-green-600">In: {formatTime(item.clockIn)}</div>
              {item.clockOut && (
                <div className="text-xs text-red-600">Out: {formatTime(item.clockOut)}</div>
              )}
            </div>
          ) : (
            <span className="text-gray-400">-</span>
          )}
        </div>
      )
    },
    {
      key: 'totalHours',
      header: 'Hours',
      render: (item) => {
        const regularHours = (item.totalHours || 0) - (item.overtimeHours || 0);
        const otHours = item.overtimeHours || 0;
        return (
          <div className="text-sm font-medium text-gray-900 flex flex-col">
            <div className="flex items-center">
              <AccessTimeIcon className="mr-1 text-blue-500" style={{ fontSize: 16 }} />
              <span className="text-gray-700">Regular: {regularHours.toFixed(2)} hrs</span>
            </div>
            {otHours > 0 && (
              <div className="flex items-center mt-1">
                <AccessTimeIcon className="mr-1 text-orange-500" style={{ fontSize: 14 }} />
                <span className="text-orange-600 font-semibold">OT: {otHours.toFixed(2)} hrs</span>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Total: {item.totalHours?.toFixed(2) || '0.00'} hrs
            </div>
          </div>
        );
      }
    },
    {
      key: 'location',
      header: 'Location',
      render: (item) => {
        const distance = getDistanceFromOffice(item.location);
        return (
          <div className="text-sm text-gray-600 flex flex-col">
            <div className="flex items-center">
              <LocationOnIcon className="mr-1 text-gray-400" style={{ fontSize: 14 }} />
              <span>{item.location || '-'}</span>
            </div>
            {distance !== null && (
              <div className="text-xs text-blue-600 mt-1 font-medium">
                {distance.toFixed(2)} km from office
              </div>
            )}
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(item.status)}`}>
          {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center space-x-2">
          {item.status === 'pending' ? (
            <>
              <button
                onClick={() => handleApprove(item._id, true)}
                disabled={processingId === item._id}
                className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon style={{ fontSize: 16 }} className="mr-1" />
                Approve
              </button>
              <button
                onClick={() => handleApprove(item._id, false)}
                disabled={processingId === item._id}
                className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CancelIcon style={{ fontSize: 16 }} className="mr-1" />
                Reject
              </button>
            </>
          ) : (
            <span className="text-gray-400 text-xs">No action needed</span>
          )}
        </div>
      )
    }
  ];

  const pendingCount = timesheets.filter(ts => ts.status === 'pending').length;
  const approvedCount = timesheets.filter(ts => ts.status === 'approved').length;
  const rejectedCount = timesheets.filter(ts => ts.status === 'rejected').length;

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <AccessTimeIcon className="text-white" style={{ fontSize: 24 }} />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Approve Timesheets</h3>
              <p className="text-sm text-gray-500">Review and approve team member timesheets</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {pendingCount > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {pendingCount} Pending
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <FilterListIcon className="text-gray-400" style={{ fontSize: 18 }} />
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'all'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({timesheets.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'approved'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'rejected'
                ? 'bg-blue-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Rejected ({rejectedCount})
          </button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : filteredTimesheets.length === 0 ? (
          <div className="text-center py-12">
            <AccessTimeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">
              {filter === 'pending' 
                ? 'No timesheets pending approval' 
                : `No ${filter} timesheets found`}
            </p>
            {timesheets.length === 0 && (
              <p className="mt-2 text-xs text-gray-400">
                Tip: Create employees from the "Create New Employee" button to see their timesheets here.
              </p>
            )}
          </div>
        ) : (
          <CommonTable
            data={filteredTimesheets}
            columns={columns}
            emptyMessage="No timesheets found"
          />
        )}
      </div>
    </div>
  );
};

export default ApproveTimesheets;
