import React, { useState, useEffect, useMemo } from 'react';
import { managerAPI, LeaveRequest } from '../../services/api';
import { CommonTable, TableColumn } from '../Common';
import EventIcon from '@mui/icons-material/Event';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FilterListIcon from '@mui/icons-material/FilterList';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import TodayIcon from '@mui/icons-material/Today';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const TeamSchedule: React.FC = () => {
  const [schedules, setSchedules] = useState<LeaveRequest[]>([]);
  const [filteredSchedules, setFilteredSchedules] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedules();
  }, []);

  useEffect(() => {
    if (filter === 'all') {
      setFilteredSchedules(schedules);
    } else {
      setFilteredSchedules(schedules.filter(s => s.status === filter));
    }
  }, [filter, schedules]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await managerAPI.getTeamSchedules();
      console.log('Schedules response:', res.data);
      setSchedules(res.data || []);
    } catch (err: any) {
      console.error('Error fetching schedules:', err);
      setError(err.response?.data?.message || 'Failed to load schedules. Please ensure you have team members assigned.');
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (id: string, approved: boolean): Promise<void> => {
    try {
      setProcessingId(id);
      await managerAPI.approveLeave(id, approved);
      await fetchSchedules(); // Refresh the list
    } catch (err: any) {
      console.error('Error approving leave:', err);
      alert(err.response?.data?.message || 'Failed to update leave request. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  const getEmployeeName = (employeeId: LeaveRequest['employeeId']): string => {
    if (!employeeId) return 'N/A';
    if (typeof employeeId === 'string') return 'N/A';
    return employeeId.name || 'N/A';
  };

  const getEmployeeEmail = (employeeId: LeaveRequest['employeeId']): string => {
    if (!employeeId || typeof employeeId === 'string') return '';
    return employeeId.email || '';
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysBetween = (start: string, end: string): number => {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800';
  };

  // Calendar view helpers
  const getDaysInMonth = (date: Date): Date[] => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days: Date[] = [];
    
    // Add days from previous month to fill the week
    const startDay = firstDay.getDay();
    for (let i = startDay - 1; i >= 0; i--) {
      days.push(new Date(year, month, -i));
    }
    
    // Add days of current month
    for (let day = 1; day <= lastDay.getDate(); day++) {
      days.push(new Date(year, month, day));
    }
    
    // Add days from next month to fill the week
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      days.push(new Date(year, month + 1, day));
    }
    
    return days;
  };

  const getSchedulesForDate = (date: Date): LeaveRequest[] => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredSchedules.filter(schedule => {
      const start = new Date(schedule.startDate).toISOString().split('T')[0];
      const end = new Date(schedule.endDate).toISOString().split('T')[0];
      return dateStr >= start && dateStr <= end;
    });
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const calendarDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const columns: TableColumn<LeaveRequest>[] = [
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
      key: 'type',
      header: 'Leave Type',
      render: (item) => (
        <span className="text-sm font-medium text-gray-900 capitalize">
          {item.type}
        </span>
      )
    },
    {
      key: 'startDate',
      header: 'Date Range',
      render: (item) => (
        <div className="text-sm text-gray-900 flex items-center">
          <CalendarTodayIcon className="mr-2 text-gray-400" style={{ fontSize: 16 }} />
          <div>
            <div>{formatDate(item.startDate)}</div>
            <div className="text-xs text-gray-500">to {formatDate(item.endDate)}</div>
            <div className="text-xs text-blue-600 mt-1">
              {getDaysBetween(item.startDate, item.endDate)} day{getDaysBetween(item.startDate, item.endDate) !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )
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
                onClick={() => handleApproveLeave(item._id, true)}
                disabled={processingId === item._id}
                className="inline-flex items-center px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <CheckCircleIcon style={{ fontSize: 16 }} className="mr-1" />
                Approve
              </button>
              <button
                onClick={() => handleApproveLeave(item._id, false)}
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

  const pendingCount = schedules.filter(s => s.status === 'pending').length;
  const approvedCount = schedules.filter(s => s.status === 'approved').length;
  const rejectedCount = schedules.filter(s => s.status === 'rejected').length;

  const renderCalendarView = () => {
    const today = new Date();
    const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth.getMonth();

    return (
      <div className="mt-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Calendar Header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeftIcon />
            </button>
            <div className="flex items-center space-x-2">
              <TodayIcon className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </h3>
            </div>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronRightIcon />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                const dateSchedules = getSchedulesForDate(date);
                const isToday = date.toDateString() === today.toDateString();
                const isOtherMonth = !isCurrentMonth(date);

                return (
                  <div
                    key={idx}
                    className={`min-h-[80px] border border-gray-200 rounded-lg p-1 ${
                      isOtherMonth ? 'bg-gray-50 opacity-50' : 'bg-white'
                    } ${isToday ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-1 ${
                      isToday ? 'text-blue-600 font-bold' : 'text-gray-700'
                    }`}>
                      {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dateSchedules.slice(0, 2).map(schedule => (
                        <div
                          key={schedule._id}
                          className={`text-xs p-1 rounded truncate ${
                            schedule.status === 'approved' ? 'bg-green-100 text-green-800' :
                            schedule.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                          title={`${getEmployeeName(schedule.employeeId)} - ${schedule.type}`}
                        >
                          {getEmployeeName(schedule.employeeId).split(' ')[0]}
                        </div>
                      ))}
                      {dateSchedules.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dateSchedules.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl">
              <EventIcon className="text-white" style={{ fontSize: 24 }} />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Team Schedules</h3>
              <p className="text-sm text-gray-500">View and manage team calendar and leave requests</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {pendingCount > 0 && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {pendingCount} Pending
              </span>
            )}
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                <ViewListIcon style={{ fontSize: 18 }} />
              </button>
              <button
                onClick={() => setViewMode('calendar')}
                className={`p-2 ${viewMode === 'calendar' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
              >
                <ViewModuleIcon style={{ fontSize: 18 }} />
              </button>
            </div>
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
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            All ({schedules.length})
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'pending'
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Pending ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'approved'
                ? 'bg-indigo-500 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            Approved ({approvedCount})
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === 'rejected'
                ? 'bg-indigo-500 text-white'
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : error ? (
          <div className="flex items-center p-4 bg-red-50 border border-red-200 rounded-lg">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : viewMode === 'calendar' ? (
          renderCalendarView()
        ) : filteredSchedules.length === 0 ? (
          <div className="text-center py-12">
            <EventIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">
              {filter === 'pending' 
                ? 'No leave requests pending approval' 
                : `No ${filter} leave requests found`}
            </p>
            {schedules.length === 0 && (
              <p className="mt-2 text-xs text-gray-400">
                Tip: Create employees from the "Create New Employee" button to see their leave requests here.
              </p>
            )}
          </div>
        ) : (
          <CommonTable
            data={filteredSchedules}
            columns={columns}
            emptyMessage="No leave requests found"
          />
        )}
      </div>
    </div>
  );
};

export default TeamSchedule;
