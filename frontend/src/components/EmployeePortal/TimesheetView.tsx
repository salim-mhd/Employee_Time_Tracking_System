import React, { useState, useEffect, useMemo } from 'react';
import { employeeAPI, Timesheet } from '../../services/api';
import { CommonTable, TableColumn } from '../Common';
import { formatLocationWithDistance, getDistanceFromOffice } from '../../utils/locationUtils';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ViewModuleIcon from '@mui/icons-material/ViewModule';
import ViewListIcon from '@mui/icons-material/ViewList';
import TodayIcon from '@mui/icons-material/Today';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import CancelIcon from '@mui/icons-material/Cancel';
import WorkIcon from '@mui/icons-material/Work';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const TimesheetView: React.FC = () => {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([]);
  const [filteredTimesheets, setFilteredTimesheets] = useState<Timesheet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'calendar'>('table');
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [viewPeriod, setViewPeriod] = useState<'week' | 'month'>('week');
  const [currentWeek, setCurrentWeek] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  useEffect(() => {
    fetchTimesheets();
  }, []);

  useEffect(() => {
    // Filter timesheets based on status
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
      const res = await employeeAPI.getTimesheets();
      setTimesheets(res.data || []);
    } catch (err: any) {
      console.error('Error fetching timesheets:', err);
      setError('Failed to load timesheets');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString: string): string => {
    if (!dateString) return '-';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon style={{ fontSize: 16 }} />;
      case 'pending':
        return <PendingIcon style={{ fontSize: 16 }} />;
      case 'rejected':
        return <CancelIcon style={{ fontSize: 16 }} />;
      default:
        return null;
    }
  };

  // Calendar view helpers
  const getWeekDays = (date: Date): Date[] => {
    const week: Date[] = [];
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day; // Get Sunday
    const sunday = new Date(d.getFullYear(), d.getMonth(), diff);
    
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(sunday);
      dayDate.setDate(sunday.getDate() + i);
      week.push(dayDate);
    }
    return week;
  };

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

  const getTimesheetsForDate = (date: Date): Timesheet[] => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredTimesheets.filter(ts => {
      const tsDate = new Date(ts.date).toISOString().split('T')[0];
      return tsDate === dateStr;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeek(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setDate(prev.getDate() - 7);
      } else {
        newDate.setDate(prev.getDate() + 7);
      }
      return newDate;
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

  const weekDays = useMemo(() => getWeekDays(currentWeek), [currentWeek]);
  const calendarDays = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  const weekDayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const columns: TableColumn<Timesheet>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (item) => (
        <div className="text-sm font-medium text-gray-900 flex items-center">
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
              <div className="text-xs text-green-600 flex items-center">
                <CheckCircleIcon style={{ fontSize: 12 }} className="mr-1" />
                In: {formatTime(item.clockIn)}
              </div>
              {item.clockOut && (
                <div className="text-xs text-red-600 flex items-center mt-1">
                  <CancelIcon style={{ fontSize: 12 }} className="mr-1" />
                  Out: {formatTime(item.clockOut)}
                </div>
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
          {getStatusIcon(item.status)}
          <span className="ml-1">{item.status.charAt(0).toUpperCase() + item.status.slice(1)}</span>
        </span>
      )
    }
  ];

  const pendingCount = timesheets.filter(ts => ts.status === 'pending').length;
  const approvedCount = timesheets.filter(ts => ts.status === 'approved').length;
  const rejectedCount = timesheets.filter(ts => ts.status === 'rejected').length;

  // Calculate statistics
  const totalDaysWorked = useMemo(() => {
    const uniqueDates = new Set(
      filteredTimesheets.map(ts => new Date(ts.date).toDateString())
    );
    return uniqueDates.size;
  }, [filteredTimesheets]);

  const totalHoursWorked = useMemo(() => {
    return filteredTimesheets.reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
  }, [filteredTimesheets]);

  const totalRegularHours = useMemo(() => {
    return filteredTimesheets.reduce((sum, ts) => {
      const regular = (ts.totalHours || 0) - (ts.overtimeHours || 0);
      return sum + regular;
    }, 0);
  }, [filteredTimesheets]);

  const totalOvertimeHours = useMemo(() => {
    return filteredTimesheets.reduce((sum, ts) => sum + (ts.overtimeHours || 0), 0);
  }, [filteredTimesheets]);

  // Calculate approved and rejected hours separately
  const approvedHours = useMemo(() => {
    return filteredTimesheets
      .filter(ts => ts.status === 'approved')
      .reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
  }, [filteredTimesheets]);

  const rejectedHours = useMemo(() => {
    return filteredTimesheets
      .filter(ts => ts.status === 'rejected')
      .reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
  }, [filteredTimesheets]);

  const pendingHours = useMemo(() => {
    return filteredTimesheets
      .filter(ts => ts.status === 'pending')
      .reduce((sum, ts) => sum + (ts.totalHours || 0), 0);
  }, [filteredTimesheets]);

  const renderWeekView = () => {
    const today = new Date();
    return (
      <div className="mt-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Week Header */}
          <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
            <button
              onClick={() => navigateWeek('prev')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronLeftIcon />
            </button>
            <div className="flex items-center space-x-2">
              <TodayIcon className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Week of {weekDays[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </h3>
            </div>
            <button
              onClick={() => navigateWeek('next')}
              className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <ChevronRightIcon />
            </button>
          </div>

          {/* Week Grid */}
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((date, idx) => {
                const dateTimesheets = getTimesheetsForDate(date);
                const isToday = date.toDateString() === today.toDateString();
                const isCurrentWeek = date >= weekDays[0] && date <= weekDays[6];

                return (
                  <div
                    key={idx}
                    className={`min-h-[120px] border rounded-lg p-2 ${
                      isToday ? 'ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                    } ${!isCurrentWeek ? 'opacity-50' : ''}`}
                  >
                    <div className={`text-xs font-medium mb-2 ${isToday ? 'text-blue-600 font-bold' : 'text-gray-700'}`}>
                      {weekDayNames[date.getDay()]} {date.getDate()}
                    </div>
                    <div className="space-y-1">
                      {dateTimesheets.map(ts => (
                        <div
                          key={ts._id}
                          className={`text-xs p-1 rounded ${
                            ts.status === 'approved' ? 'bg-green-100 text-green-800' :
                            ts.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                          title={`Regular: ${((ts.totalHours || 0) - (ts.overtimeHours || 0)).toFixed(1)}h${ts.overtimeHours && ts.overtimeHours > 0 ? `, OT: ${ts.overtimeHours.toFixed(1)}h` : ''} - Total: ${ts.totalHours?.toFixed(1)}h - ${ts.status}`}
                        >
                          {formatTime(ts.clockIn || ts.date)} - {ts.totalHours?.toFixed(1)}h{ts.overtimeHours && ts.overtimeHours > 0 ? ` (+${ts.overtimeHours.toFixed(1)} OT)` : ''}
                        </div>
                      ))}
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

  const renderMonthView = () => {
    const today = new Date();
    const isCurrentMonth = (date: Date) => date.getMonth() === currentMonth.getMonth();

    return (
      <div className="mt-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Month Header */}
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
              {weekDayNames.map(day => (
                <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, idx) => {
                const dateTimesheets = getTimesheetsForDate(date);
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
                      {dateTimesheets.slice(0, 2).map(ts => (
                        <div
                          key={ts._id}
                          className={`text-xs p-1 rounded truncate ${
                            ts.status === 'approved' ? 'bg-green-100 text-green-800' :
                            ts.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}
                          title={`Regular: ${((ts.totalHours || 0) - (ts.overtimeHours || 0)).toFixed(1)}h${ts.overtimeHours && ts.overtimeHours > 0 ? `, OT: ${ts.overtimeHours.toFixed(1)}h` : ''} - Total: ${ts.totalHours?.toFixed(1)}h - ${ts.status}`}
                        >
                          {ts.totalHours?.toFixed(1)}h{ts.overtimeHours && ts.overtimeHours > 0 ? ` (+${ts.overtimeHours.toFixed(1)} OT)` : ''}
                        </div>
                      ))}
                      {dateTimesheets.length > 2 && (
                        <div className="text-xs text-gray-500">
                          +{dateTimesheets.length - 2} more
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
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl">
              <AccessTimeIcon className="text-white" style={{ fontSize: 24 }} />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">View Timesheets</h3>
              <p className="text-sm text-gray-500">Review your daily and weekly work logs</p>
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
                onClick={() => setViewMode('table')}
                className={`p-2 ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'}`}
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

      {/* Statistics Summary */}
      {!loading && filteredTimesheets.length > 0 && (
        <div className="px-6 py-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Days</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalDaysWorked}</p>
                <p className="text-xs text-gray-500 mt-1">Days worked</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Total Hours</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{totalHoursWorked.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Hours worked</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Approved Hours</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{approvedHours.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Approved timesheets</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rejected Hours</p>
                <p className="text-2xl font-bold text-red-600 mt-1">{rejectedHours.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Rejected timesheets</p>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Overtime Hours</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">{totalOvertimeHours.toFixed(2)}</p>
                <p className="text-xs text-gray-500 mt-1">Extra hours</p>
              </div>
            </div>
          </div>
        </div>
      )}

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
        ) : viewMode === 'calendar' ? (
          <>
            {/* Period Toggle */}
            <div className="mb-4 flex justify-end">
              <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewPeriod('week')}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewPeriod === 'week' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Week
                </button>
                <button
                  onClick={() => setViewPeriod('month')}
                  className={`px-4 py-2 text-sm font-medium ${
                    viewPeriod === 'month' ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Month
                </button>
              </div>
            </div>
            {viewPeriod === 'week' ? renderWeekView() : renderMonthView()}
          </>
        ) : filteredTimesheets.length === 0 ? (
          <div className="text-center py-12">
            <AccessTimeIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">
              {filter === 'pending' 
                ? 'No timesheets pending approval' 
                : `No ${filter} timesheets found`}
            </p>
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

export default TimesheetView;
