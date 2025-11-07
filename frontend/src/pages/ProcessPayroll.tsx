import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { hrAPI } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { CommonTable, TableColumn, CommonButton, CommonTextField, CommonSelect, SelectOption } from '../components/Common';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ListIcon from '@mui/icons-material/List';
import PeopleIcon from '@mui/icons-material/People';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import EmailIcon from '@mui/icons-material/Email';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import InfoIcon from '@mui/icons-material/Info';

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'hr';
  hourlyWage: number;
}

interface Payroll {
  _id: string;
  employeeId: string | { _id: string; name: string; email: string };
  period: string;
  basePay: number;
  overtimePay: number;
  deductions: number;
  totalPay: number;
  status: string;
  createdAt?: string;
}

interface ProcessPayrollData {
  employeeId: string;
  period: string;
}

const ProcessPayrollPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState<ProcessPayrollData>({ 
    employeeId: '', 
    period: '' 
  });
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetchingPayrolls, setFetchingPayrolls] = useState<boolean>(true);
  const [fetchingEmployees, setFetchingEmployees] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setFetchingEmployees(true);
      const res = await hrAPI.getEmployees();
      setEmployees(res.data || []);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees. Please try again.');
    } finally {
      setFetchingEmployees(false);
    }
  };

  const fetchPayrolls = async () => {
    try {
      setFetchingPayrolls(true);
      const res = await hrAPI.getPayrolls();
      setPayrolls(res.data || []);
    } catch (err: any) {
      console.error('Error fetching payrolls:', err);
      setError('Failed to load payrolls. Please try again.');
    } finally {
      setFetchingPayrolls(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await hrAPI.processPayroll(formData);
      setSuccess(true);
      setFormData({ employeeId: '', period: '' });
      await fetchPayrolls(); // Refresh payroll list
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      console.error('Error processing payroll:', err);
      setError(err.response?.data?.message || 'Failed to process payroll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const getEmployeeOptions = (): SelectOption[] => {
    return employees.map(emp => ({
      value: emp._id,
      label: `${emp.name} (${emp.email}) - ${emp.role.charAt(0).toUpperCase() + emp.role.slice(1)}${emp.hourlyWage > 0 ? ` - $${emp.hourlyWage}/hr` : ' - Salaried'}`
    }));
  };

  const getEmployeeName = (employeeId: string | { _id: string; name: string; email: string }): string => {
    if (typeof employeeId === 'object' && employeeId.name) {
      return employeeId.name;
    }
    return 'Unknown Employee';
  };

  const getEmployeeEmail = (employeeId: string | { _id: string; name: string; email: string }): string => {
    if (typeof employeeId === 'object' && employeeId.email) {
      return employeeId.email;
    }
    return '-';
  };

  const toggleRowExpansion = (payrollId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(payrollId)) {
        newSet.delete(payrollId);
      } else {
        newSet.add(payrollId);
      }
      return newSet;
    });
  };

  const formatPeriod = (period: string): string => {
    if (!period) return '-';
    // If period is in YYYY-MM format, format it nicely
    if (period.match(/^\d{4}-\d{2}$/)) {
      const [year, month] = period.split('-');
      const date = new Date(parseInt(year), parseInt(month) - 1);
      return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    return period;
  };

  const calculateGrossPay = (payroll: Payroll): number => {
    return (payroll.basePay || 0) + (payroll.overtimePay || 0);
  };

  const renderPayrollDetails = (payroll: Payroll) => {
    const grossPay = calculateGrossPay(payroll);
    const netPay = payroll.totalPay || 0;
    const deductions = payroll.deductions || 0;
    const employeeEmail = getEmployeeEmail(payroll.employeeId);
    const employeeName = getEmployeeName(payroll.employeeId);

    return (
      <tr key={`${payroll._id}-details`} className="bg-gray-50">
        <td colSpan={9} className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column - Employee & Period Info */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <InfoIcon className="mr-2" style={{ fontSize: 18 }} />
                  Employee Information
                </h3>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <PeopleIcon className="text-gray-400 mr-2" style={{ fontSize: 16 }} />
                    <span className="text-gray-600">Name:</span>
                    <span className="ml-2 font-medium text-gray-900">{employeeName}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <EmailIcon className="text-gray-400 mr-2" style={{ fontSize: 16 }} />
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium text-gray-900">{employeeEmail}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CalendarTodayIcon className="text-gray-400 mr-2" style={{ fontSize: 16 }} />
                    <span className="text-gray-600">Pay Period:</span>
                    <span className="ml-2 font-medium text-gray-900">{formatPeriod(payroll.period)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <CheckCircleIcon className="text-gray-400 mr-2" style={{ fontSize: 16 }} />
                    <span className="text-gray-600">Status:</span>
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {payroll.status || 'processed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Pay Breakdown */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <AccountBalanceIcon className="mr-2" style={{ fontSize: 18 }} />
                  Pay Breakdown
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <TrendingUpIcon className="mr-2 text-blue-500" style={{ fontSize: 16 }} />
                      Base Pay
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      ${(payroll.basePay || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div className="flex items-center text-sm text-gray-600">
                      <TrendingUpIcon className="mr-2 text-orange-500" style={{ fontSize: 16 }} />
                      Overtime Pay
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      ${(payroll.overtimePay || 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                    <div className="flex items-center text-sm font-medium text-gray-700">
                      Gross Pay
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                      ${grossPay.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div className="flex items-center text-sm text-red-600">
                      <RemoveCircleIcon className="mr-2" style={{ fontSize: 16 }} />
                      Deductions
                    </div>
                    <span className="text-sm font-semibold text-red-600">
                      -${deductions.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center text-base font-bold text-gray-900">
                      <AttachMoneyIcon className="mr-2 text-green-600" style={{ fontSize: 20 }} />
                      Net Pay
                    </div>
                    <span className="text-lg font-bold text-green-600">
                      ${netPay.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    );
  };

  const payrollColumns: TableColumn<Payroll>[] = [
    {
      key: 'expand',
      header: '',
      render: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleRowExpansion(item._id);
          }}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {expandedRows.has(item._id) ? (
            <ExpandLessIcon className="text-gray-600" style={{ fontSize: 20 }} />
          ) : (
            <ExpandMoreIcon className="text-gray-600" style={{ fontSize: 20 }} />
          )}
        </button>
      ),
      className: 'w-12'
    },
    {
      key: 'employeeId',
      header: 'Employee',
      render: (item) => (
        <div>
          <div className="text-sm font-medium text-gray-900">
            {getEmployeeName(item.employeeId)}
          </div>
          <div className="text-xs text-gray-500 flex items-center mt-1">
            <EmailIcon style={{ fontSize: 12 }} className="mr-1" />
            {getEmployeeEmail(item.employeeId)}
          </div>
        </div>
      )
    },
    {
      key: 'period',
      header: 'Pay Period',
      render: (item) => (
        <div className="text-sm text-gray-900">
          {formatPeriod(item.period)}
        </div>
      )
    },
    {
      key: 'basePay',
      header: 'Base Pay',
      render: (item) => (
        <div className="text-sm font-medium text-gray-900">
          ${item.basePay?.toFixed(2) || '0.00'}
        </div>
      )
    },
    {
      key: 'overtimePay',
      header: 'Overtime',
      render: (item) => (
        <div className="text-sm text-gray-900">
          ${item.overtimePay?.toFixed(2) || '0.00'}
        </div>
      )
    },
    {
      key: 'deductions',
      header: 'Deductions',
      render: (item) => (
        <div className="text-sm text-red-600 font-medium">
          -${item.deductions?.toFixed(2) || '0.00'}
        </div>
      )
    },
    {
      key: 'totalPay',
      header: 'Net Pay',
      render: (item) => (
        <div className="text-sm font-bold text-green-600">
          ${item.totalPay?.toFixed(2) || '0.00'}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          {item.status || 'processed'}
        </span>
      )
    },
    {
      key: 'createdAt',
      header: 'Processed Date',
      render: (item) => {
        if (!item.createdAt) return '-';
        const date = new Date(item.createdAt);
        return (
          <div className="text-sm text-gray-500">
            {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
            <div className="text-xs text-gray-400 mt-0.5">
              {date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        );
      }
    }
  ];

  return (
    <DashboardLayout title="Process Payroll">
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
          <div className="flex items-center mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl">
              <AttachMoneyIcon className="text-white" style={{ fontSize: 32 }} />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">Process Payroll</h1>
              <p className="text-sm text-gray-500 mt-1">
                Process employee payroll and view payroll history
              </p>
            </div>
          </div>
        </div>

        {/* Process Payroll Form */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">New Payroll Processing</h2>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircleIcon className="text-green-500 mr-3" style={{ fontSize: 24 }} />
              <p className="text-sm text-green-700 font-medium">Payroll processed successfully!</p>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CommonSelect
                id="employeeId"
                name="employeeId"
                label="Employee"
                value={formData.employeeId}
                onChange={handleChange}
                options={getEmployeeOptions()}
                placeholder={fetchingEmployees ? "Loading employees..." : "Select an employee"}
                required
                disabled={fetchingEmployees}
                helperText={fetchingEmployees ? "Loading employees..." : "Select an employee to process payroll"}
              />

              <CommonTextField
                id="period"
                name="period"
                type="month"
                label="Pay Period"
                value={formData.period}
                onChange={handleChange}
                required
                className="focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <CommonButton
              type="submit"
              variant="success"
              disabled={loading}
              loading={loading}
              icon={<CheckCircleIcon style={{ fontSize: 20 }} />}
            >
              Process Payroll
            </CommonButton>
          </form>
        </div>

        {/* Payroll History */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center">
              <ListIcon className="text-gray-600 mr-2" style={{ fontSize: 20 }} />
              <h2 className="text-lg font-semibold text-gray-900">Payroll History</h2>
            </div>
            <div className="text-sm text-gray-600">
              {payrolls.length} payroll{payrolls.length !== 1 ? 's' : ''} processed
            </div>
          </div>
          {fetchingPayrolls ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
            </div>
          ) : payrolls.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="mt-4 text-sm text-gray-500">No payrolls processed yet. Process your first payroll above.</p>
            </div>
          ) : (
            <div className="p-6">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {payrollColumns.map((column) => (
                        <th
                          key={column.key}
                          scope="col"
                          className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${
                            column.headerClassName || ''
                          }`}
                        >
                          {column.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payrolls.map((payroll, index) => (
                      <React.Fragment key={payroll._id}>
                        <tr
                          className="hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={() => toggleRowExpansion(payroll._id)}
                        >
                          {payrollColumns.map((column) => (
                            <td
                              key={column.key}
                              className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${
                                column.className || ''
                              }`}
                            >
                              {column.render
                                ? column.render(payroll, index)
                                : (payroll[column.key as keyof Payroll] !== undefined 
                                    ? String(payroll[column.key as keyof Payroll]) 
                                    : '-')}
                            </td>
                          ))}
                        </tr>
                        {expandedRows.has(payroll._id) && renderPayrollDetails(payroll)}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProcessPayrollPage;

