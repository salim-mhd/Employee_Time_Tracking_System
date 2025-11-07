import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { 
  fetchPayrollReport, 
  fetchAttendanceReport, 
  fetchLeavesReport,
  setReportType,
  setStatusFilter,
  setPayrollPeriod,
  setEmployeeId,
  clearError,
  setError
} from '../store/slices/reportsSlice';
import { hrAPI } from '../services/api';
import { CommonTable, TableColumn, CommonTextField, CommonButton, CommonSelect, SelectOption } from '../components/Common';
import { getDistanceFromOffice } from '../utils/locationUtils';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import DownloadIcon from '@mui/icons-material/Download';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import LocationOnIcon from '@mui/icons-material/LocationOn';

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'hr';
  hourlyWage: number;
}

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { 
    reportType, 
    allData, 
    filteredData, 
    loading, 
    error, 
    statusFilter, 
    payrollPeriod, 
    employeeId 
  } = useAppSelector((state) => state.reports);
  
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [fetchingEmployees, setFetchingEmployees] = useState<boolean>(false);

  useEffect(() => {
    fetchEmployees();
    // Clear reports when component unmounts
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Auto-fetch leaves report when leaves tab is selected
  useEffect(() => {
    if (reportType === 'leaves' && allData.length === 0 && !loading) {
      dispatch(fetchLeavesReport());
    }
  }, [reportType, dispatch, allData.length, loading]);

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const res = await hrAPI.getEmployees();
      setEmployees(res.data || []);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
    } finally {
      setFetchingEmployees(false);
    }
  };

  const getEmployeeOptions = (): SelectOption[] => {
    return employees.map(emp => ({
      value: emp._id,
      label: `${emp.name} (${emp.email}) - ${emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}${emp.hourlyWage > 0 ? ` - $${emp.hourlyWage}/hr` : ' - Salaried'}`
    }));
  };

  const fetchReport = async (type: 'payroll' | 'attendance' | 'leaves'): Promise<void> => {
    if (type === 'payroll') {
      if (!payrollPeriod) {
        dispatch(setError('Please enter a period (YYYY-MM)'));
        return;
      }
      await dispatch(fetchPayrollReport(payrollPeriod));
    } else if (type === 'attendance') {
      if (!employeeId) {
        dispatch(setError('Please select an Employee'));
        return;
      }
      await dispatch(fetchAttendanceReport(employeeId));
    } else if (type === 'leaves') {
      await dispatch(fetchLeavesReport());
    }
  };

  const handleReportTypeChange = (type: 'payroll' | 'attendance' | 'leaves') => {
    dispatch(setReportType(type));
    // Auto-fetch leaves report when leaves tab is clicked
    if (type === 'leaves') {
      dispatch(fetchLeavesReport());
    }
  };

  const handleExport = () => {
    if (filteredData.length === 0) return;
    
    const jsonString = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${reportType}_report_${statusFilter !== 'all' ? `_${statusFilter}_` : ''}${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getStatusCounts = () => {
    const counts: Record<string, number> = {
      all: allData.length,
      pending: 0,
      approved: 0,
      rejected: 0,
      processed: 0,
    };

    allData.forEach(item => {
      if (reportType === 'payroll') {
        if (item.status === 'processed') counts.processed++;
        else if (item.status === 'pending') counts.pending++;
        else if (item.status === 'approved') counts.approved++;
        else if (item.status === 'rejected') counts.rejected++;
      } else {
        if (item.status === 'pending') counts.pending++;
        else if (item.status === 'approved') counts.approved++;
        else if (item.status === 'rejected') counts.rejected++;
      }
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  const getReportColumns = (): TableColumn<any>[] => {
    if (reportType === 'payroll') {
      return [
        { key: 'employeeId', header: 'Employee', render: (item) => getEmployeeName(item.employeeId) },
        { key: 'period', header: 'Period' },
        { key: 'basePay', header: 'Base Pay', render: (item) => `$${item.basePay?.toFixed(2) || '0.00'}` },
        { key: 'overtimePay', header: 'Overtime', render: (item) => `$${item.overtimePay?.toFixed(2) || '0.00'}` },
        { key: 'deductions', header: 'Deductions', render: (item) => `$${item.deductions?.toFixed(2) || '0.00'}` },
        { key: 'totalPay', header: 'Total Pay', render: (item) => <span className="font-bold text-green-600">${item.totalPay?.toFixed(2) || '0.00'}</span> },
        { key: 'status', header: 'Status', render: (item) => (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.status === 'processed' ? 'bg-green-100 text-green-800' :
            item.status === 'approved' ? 'bg-green-100 text-green-800' :
            item.status === 'rejected' ? 'bg-red-100 text-red-800' :
            item.status === 'pending' ? 'bg-orange-100 text-orange-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {item.status || 'processed'}
          </span>
        )}
      ];
    } else if (reportType === 'attendance') {
      return [
        { key: 'date', header: 'Date', render: (item) => new Date(item.date).toLocaleDateString() },
        { key: 'clockIn', header: 'Clock In', render: (item) => item.clockIn ? new Date(item.clockIn).toLocaleTimeString() : '-' },
        { key: 'clockOut', header: 'Clock Out', render: (item) => item.clockOut ? new Date(item.clockOut).toLocaleTimeString() : '-' },
        { 
          key: 'totalHours', 
          header: 'Hours', 
          render: (item) => {
            const regularHours = (item.totalHours || 0) - (item.overtimeHours || 0);
            const otHours = item.overtimeHours || 0;
            return (
              <div className="flex flex-col">
                <div className="text-gray-700">Regular: {regularHours.toFixed(2)} hrs</div>
                {otHours > 0 && (
                  <div className="text-orange-600 font-semibold">OT: {otHours.toFixed(2)} hrs</div>
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
        { key: 'status', header: 'Status', render: (item) => (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.status === 'approved' ? 'bg-green-100 text-green-800' :
            item.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-orange-100 text-orange-800'
          }`}>
            {item.status}
          </span>
        )}
      ];
    } else {
      return [
        { key: 'employeeId', header: 'Employee', render: (item) => getEmployeeName(item.employeeId) },
        { key: 'type', header: 'Type', render: (item) => (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
            {item.type}
          </span>
        )},
        { key: 'startDate', header: 'Start Date', render: (item) => new Date(item.startDate).toLocaleDateString() },
        { key: 'endDate', header: 'End Date', render: (item) => new Date(item.endDate).toLocaleDateString() },
        { key: 'status', header: 'Status', render: (item) => (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            item.status === 'approved' ? 'bg-green-100 text-green-800' :
            item.status === 'rejected' ? 'bg-red-100 text-red-800' :
            'bg-orange-100 text-orange-800'
          }`}>
            {item.status}
          </span>
        )}
      ];
    }
  };

  const getEmployeeName = (employeeId: any): string => {
    if (typeof employeeId === 'object' && employeeId.name) {
      return employeeId.name;
    }
    // Try to find employee name from the employees list
    if (typeof employeeId === 'string') {
      const employee = employees.find(emp => emp._id === employeeId);
      if (employee) return employee.name;
    }
    return employeeId || 'Unknown Employee';
  };

  return (
    <DashboardLayout title="Reports">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <CommonButton
            type="button"
            variant="outline"
            onClick={() => navigate('/hr')}
            icon={<ArrowBackIcon style={{ fontSize: 16 }} />}
            size="sm"
          >
            Back to Dashboard
          </CommonButton>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center mb-4">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
                <AssessmentIcon className="text-white" style={{ fontSize: 32 }} />
              </div>
              <div className="ml-4">
                <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                <p className="text-sm text-gray-500 mt-1">
                  Generate and view payroll, attendance, and leave reports
                </p>
              </div>
            </div>
            {filteredData.length > 0 && (
              <CommonButton
                type="button"
                variant="outline"
                onClick={handleExport}
                icon={<DownloadIcon style={{ fontSize: 20 }} />}
              >
                Export Report
              </CommonButton>
            )}
          </div>
        </div>

        {/* Report Type Selection */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Report Type</h2>
          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => handleReportTypeChange('payroll')}
              className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                reportType === 'payroll'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AttachMoneyIcon className="mr-2" style={{ fontSize: 20 }} />
              Payroll Report
            </button>
            <button
              onClick={() => handleReportTypeChange('attendance')}
              className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                reportType === 'attendance'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <AccessTimeIcon className="mr-2" style={{ fontSize: 20 }} />
              Attendance Report
            </button>
            <button
              onClick={() => handleReportTypeChange('leaves')}
              className={`inline-flex items-center px-6 py-3 rounded-lg font-medium transition-colors ${
                reportType === 'leaves'
                  ? 'bg-purple-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <EventIcon className="mr-2" style={{ fontSize: 20 }} />
              Leaves Report
            </button>
          </div>
        </div>

        {/* Report Parameters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Report Parameters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reportType === 'payroll' && (
              <div className="md:col-span-2">
                <CommonTextField
                  id="payrollPeriod"
                  name="payrollPeriod"
                  type="month"
                  label="Pay Period"
                  value={payrollPeriod}
                  onChange={(e) => dispatch(setPayrollPeriod(e.target.value))}
                  placeholder="YYYY-MM"
                  helperText="Select the month for payroll report"
                />
              </div>
            )}
            {reportType === 'attendance' && (
              <div className="md:col-span-2">
                <CommonSelect
                  id="employeeId"
                  name="employeeId"
                  label="Employee"
                  value={employeeId}
                  onChange={(e) => dispatch(setEmployeeId(e.target.value))}
                  options={getEmployeeOptions()}
                  placeholder={fetchingEmployees ? "Loading employees..." : "Select an employee"}
                  required
                  disabled={fetchingEmployees}
                  helperText={fetchingEmployees ? "Loading employees..." : "Select an employee to view attendance report"}
                />
              </div>
            )}
            {reportType === 'leaves' && (
              <div className="md:col-span-2">
                <p className="text-sm text-gray-600">Leave reports show all leave requests across the organization.</p>
              </div>
            )}
          </div>
          <div className="mt-4">
            <CommonButton
              type="button"
              variant="primary"
              onClick={() => fetchReport(reportType as 'payroll' | 'attendance' | 'leaves')}
              disabled={loading || (reportType === 'payroll' && !payrollPeriod) || (reportType === 'attendance' && !employeeId)}
              loading={loading}
              icon={<SearchIcon style={{ fontSize: 20 }} />}
            >
              Generate Report
            </CommonButton>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Report Results */}
        {!loading && allData.length > 0 && !(reportType === 'attendance' && !employeeId) && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {reportType === 'payroll' && 'Payroll Report'}
                  {reportType === 'attendance' && 'Attendance Report'}
                  {reportType === 'leaves' && 'Leaves Report'}
                </h2>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-600">
                    {filteredData.length} of {allData.length} record{filteredData.length !== 1 ? 's' : ''}
                  </span>
                  <CommonButton
                    type="button"
                    variant="outline"
                    onClick={handleExport}
                    icon={<DownloadIcon style={{ fontSize: 16 }} />}
                    size="sm"
                  >
                    Export
                  </CommonButton>
                </div>
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center space-x-2 border-b border-gray-200 pb-4">
                <FilterListIcon className="text-gray-400" style={{ fontSize: 18 }} />
                <button
                  onClick={() => dispatch(setStatusFilter('all'))}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    statusFilter === 'all'
                      ? 'bg-purple-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All ({statusCounts.all})
                </button>
                {reportType === 'payroll' ? (
                  <>
                    <button
                      onClick={() => dispatch(setStatusFilter('processed'))}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        statusFilter === 'processed'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Processed ({statusCounts.processed})
                    </button>
                    <button
                      onClick={() => dispatch(setStatusFilter('pending'))}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        statusFilter === 'pending'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Pending ({statusCounts.pending})
                    </button>
                    <button
                      onClick={() => dispatch(setStatusFilter('approved'))}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        statusFilter === 'approved'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Approved ({statusCounts.approved})
                    </button>
                    <button
                      onClick={() => dispatch(setStatusFilter('rejected'))}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        statusFilter === 'rejected'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Rejected ({statusCounts.rejected})
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => dispatch(setStatusFilter('pending'))}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        statusFilter === 'pending'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Pending ({statusCounts.pending})
                    </button>
                    <button
                      onClick={() => dispatch(setStatusFilter('approved'))}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        statusFilter === 'approved'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Approved ({statusCounts.approved})
                    </button>
                    <button
                      onClick={() => dispatch(setStatusFilter('rejected'))}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                        statusFilter === 'rejected'
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Rejected ({statusCounts.rejected})
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="p-6">
              <CommonTable
                data={filteredData}
                columns={getReportColumns()}
                loading={false}
                emptyMessage={`No ${statusFilter === 'all' ? '' : statusFilter + ' '}records found`}
              />
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && allData.length === 0 && reportType && !error && !(reportType === 'attendance' && !employeeId) && (
          <div className="bg-white rounded-xl shadow-md border border-gray-100 p-12 text-center">
            <AssessmentIcon className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Report Data</h3>
            <p className="text-sm text-gray-500 mb-4">
              {reportType === 'payroll' && 'Enter a pay period and click "Generate Report" to view payroll data.'}
              {reportType === 'attendance' && 'Select an employee and click "Generate Report" to view attendance data.'}
              {reportType === 'leaves' && 'Click "Generate Report" to view all leave requests.'}
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ReportsPage;
