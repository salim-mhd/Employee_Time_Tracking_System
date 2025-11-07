import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPendingRequests, approveLeaveRequest, approveTimesheet, clearError } from '../../store/slices/pendingRequestsSlice';
import { Timesheet, LeaveRequest } from '../../services/api';
import { CommonTable, TableColumn } from '../Common';
import { getDistanceFromOffice } from '../../utils/locationUtils';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface PendingRequestsProps {
  refreshTrigger?: number;
}

const PendingRequests: React.FC<PendingRequestsProps> = ({ refreshTrigger = 0 }) => {
  const dispatch = useAppDispatch();
  const { leaveRequests, timesheets, loading, error, processingId } = useAppSelector((state) => state.pendingRequests);
  const [activeTab, setActiveTab] = useState<'all' | 'leaves' | 'timesheets'>('all');

  useEffect(() => {
    dispatch(fetchPendingRequests());
  }, [dispatch, refreshTrigger]);

  useEffect(() => {
    // Clear error when component unmounts
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const handleApproveLeave = async (id: string) => {
    await dispatch(approveLeaveRequest({ id, approved: true }));
  };

  const handleRejectLeave = async (id: string) => {
    await dispatch(approveLeaveRequest({ id, approved: false }));
  };

  const handleApproveTimesheet = async (id: string) => {
    await dispatch(approveTimesheet({ id, approved: true }));
  };

  const handleRejectTimesheet = async (id: string) => {
    await dispatch(approveTimesheet({ id, approved: false }));
  };

  const getEmployeeName = (employeeId: string | { _id: string; name: string }): string => {
    if (typeof employeeId === 'object' && employeeId.name) {
      return employeeId.name;
    }
    return 'Unknown Employee';
  };

  const leaveColumns: TableColumn<LeaveRequest>[] = [
    {
      key: 'employeeId',
      header: 'Employee',
      render: (item: LeaveRequest) => (
        <div className="text-sm font-medium text-gray-900">
          {getEmployeeName(item.employeeId as any)}
        </div>
      )
    },
    {
      key: 'type',
      header: 'Type',
      render: (item: LeaveRequest) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
          {item.type}
        </span>
      )
    },
    {
      key: 'startDate',
      header: 'Start Date',
      render: (item: LeaveRequest) => {
        const date = new Date(item.startDate);
        return (
          <div className="text-sm text-gray-900">
            {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        );
      }
    },
    {
      key: 'endDate',
      header: 'End Date',
      render: (item: LeaveRequest) => {
        const date = new Date(item.endDate);
        return (
          <div className="text-sm text-gray-900">
            {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        );
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: LeaveRequest) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 capitalize">
          {item.status}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: LeaveRequest) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleApproveLeave(item._id)}
            disabled={processingId === item._id || item.status !== 'pending'}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircleIcon style={{ fontSize: 16 }} className="mr-1" />
            Approve
          </button>
          <button
            onClick={() => handleRejectLeave(item._id)}
            disabled={processingId === item._id || item.status !== 'pending'}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CancelIcon style={{ fontSize: 16 }} className="mr-1" />
            Reject
          </button>
        </div>
      )
    }
  ];

  const timesheetColumns: TableColumn<Timesheet>[] = [
    {
      key: 'employeeId',
      header: 'Employee',
      render: (item: Timesheet) => (
        <div className="text-sm font-medium text-gray-900">
          {getEmployeeName(item.employeeId as any)}
        </div>
      )
    },
    {
      key: 'date',
      header: 'Date',
      render: (item: Timesheet) => {
        const date = new Date(item.date);
        return (
          <div className="text-sm text-gray-900">
            {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        );
      }
    },
    {
      key: 'totalHours',
      header: 'Hours',
      render: (item: Timesheet) => {
        const regularHours = (item.totalHours || 0) - (item.overtimeHours || 0);
        const otHours = item.overtimeHours || 0;
        return (
          <div className="text-sm font-medium text-gray-900 flex flex-col">
            <div className="text-gray-700">Regular: {regularHours.toFixed(2)} hrs</div>
            {otHours > 0 && (
              <div className="text-orange-600 font-semibold mt-1">OT: {otHours.toFixed(2)} hrs</div>
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
      render: (item: Timesheet) => {
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
      render: (item: Timesheet) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 capitalize">
          {item.status}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: Timesheet) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleApproveTimesheet(item._id)}
            disabled={processingId === item._id || item.status !== 'pending'}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CheckCircleIcon style={{ fontSize: 16 }} className="mr-1" />
            Approve
          </button>
          <button
            onClick={() => handleRejectTimesheet(item._id)}
            disabled={processingId === item._id || item.status !== 'pending'}
            className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <CancelIcon style={{ fontSize: 16 }} className="mr-1" />
            Reject
          </button>
        </div>
      )
    }
  ];

  type PendingItem = (LeaveRequest & { type: 'leave' }) | (Timesheet & { type: 'timesheet' });

  const allPendingItems: PendingItem[] = [
    ...leaveRequests.map(lr => ({ ...lr, type: 'leave' as const })),
    ...timesheets.map(ts => ({ ...ts, type: 'timesheet' as const }))
  ];

  const allColumns: TableColumn<PendingItem>[] = [
    {
      key: 'type',
      header: 'Type',
      render: (item: PendingItem) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          item.type === 'leave' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {item.type === 'leave' ? 'Leave Request' : 'Timesheet'}
        </span>
      )
    },
    {
      key: 'employeeId',
      header: 'Employee',
      render: (item: PendingItem) => (
        <div className="text-sm font-medium text-gray-900">
          {getEmployeeName(item.employeeId as any)}
        </div>
      )
    },
    {
      key: 'date',
      header: 'Date/Period',
      render: (item: PendingItem) => {
        const date = item.type === 'leave' ? new Date(item.startDate) : new Date(item.date);
        return (
          <div className="text-sm text-gray-900">
            {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        );
      }
    },
    {
      key: 'details',
      header: 'Details',
      render: (item: PendingItem) => {
        if (item.type === 'leave') {
          return (
            <div className="text-sm text-gray-600">
              {item.type} • {new Date(item.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
          );
        } else {
          const timesheet = item as Timesheet;
          const regularHours = (timesheet.totalHours || 0) - (timesheet.overtimeHours || 0);
          const otHours = timesheet.overtimeHours || 0;
          return (
            <div className="text-sm text-gray-600 flex flex-col">
              <div>Regular: {regularHours.toFixed(2)} hrs</div>
              {otHours > 0 && (
                <div className="text-orange-600 font-semibold">OT: {otHours.toFixed(2)} hrs</div>
              )}
              <div className="text-xs text-gray-500 mt-1">
                Total: {timesheet.totalHours?.toFixed(2) || '0.00'} hrs
              </div>
            </div>
          );
        }
      }
    },
    {
      key: 'status',
      header: 'Status',
      render: (item: PendingItem) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 capitalize">
          {item.status}
        </span>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item: PendingItem) => {
        if (item.status !== 'pending') return <span className="text-sm text-gray-400">-</span>;
        
        if (item.type === 'leave') {
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleApproveLeave(item._id)}
                disabled={processingId === item._id}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircleIcon style={{ fontSize: 16 }} className="mr-1" />
                Approve
              </button>
              <button
                onClick={() => handleRejectLeave(item._id)}
                disabled={processingId === item._id}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CancelIcon style={{ fontSize: 16 }} className="mr-1" />
                Reject
              </button>
            </div>
          );
        } else {
          return (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleApproveTimesheet(item._id)}
                disabled={processingId === item._id}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CheckCircleIcon style={{ fontSize: 16 }} className="mr-1" />
                Approve
              </button>
              <button
                onClick={() => handleRejectTimesheet(item._id)}
                disabled={processingId === item._id}
                className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <CancelIcon style={{ fontSize: 16 }} className="mr-1" />
                Reject
              </button>
            </div>
          );
        }
      }
    }
  ];

  const displayData: any[] = activeTab === 'all' 
    ? allPendingItems 
    : activeTab === 'leaves' 
    ? leaveRequests 
    : timesheets;

  const displayColumns: TableColumn<any>[] = activeTab === 'all' 
    ? allColumns 
    : activeTab === 'leaves' 
    ? leaveColumns 
    : timesheetColumns;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <PendingActionsIcon className="text-orange-600" style={{ fontSize: 20 }} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Pending Requests</h3>
          </div>
          <div className="text-sm text-gray-600">
            {leaveRequests.length + timesheets.length} pending
          </div>
        </div>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Tabs */}
      <div className="px-6 pt-4 border-b border-gray-200">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'all'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            All ({leaveRequests.length + timesheets.length})
          </button>
          <button
            onClick={() => setActiveTab('leaves')}
            className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors flex items-center ${
              activeTab === 'leaves'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <EventIcon className="w-4 h-4 mr-1" style={{ fontSize: 16 }} />
            Leaves ({leaveRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('timesheets')}
            className={`pb-4 px-1 text-sm font-medium border-b-2 transition-colors flex items-center ${
              activeTab === 'timesheets'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <AccessTimeIcon className="w-4 h-4 mr-1" style={{ fontSize: 16 }} />
            Timesheets ({timesheets.length})
          </button>
        </div>
      </div>

      <div className="p-6">
        <CommonTable
          data={displayData}
          columns={displayColumns}
          loading={loading}
          emptyMessage="No pending requests at this time."
        />
      </div>
    </div>
  );
};

export default PendingRequests;

