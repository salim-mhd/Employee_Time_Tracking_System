import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { hrAPI } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { CommonTable, TableColumn, CommonButton, CommonTextField } from '../components/Common';
import PeopleIcon from '@mui/icons-material/People';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import SaveIcon from '@mui/icons-material/Save';

interface Employee {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'hr';
  hourlyWage: number;
  createdAt?: string;
}

const ManageEmployeesPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [editFormData, setEditFormData] = useState<{ name: string; email: string; hourlyWage: number | ''; password: string }>({
    name: '',
    email: '',
    hourlyWage: '',
    password: ''
  });
  const [editLoading, setEditLoading] = useState<boolean>(false);
  const [editError, setEditError] = useState<string | null>(null);

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    // Filter employees based on search term and role
    const filtered = employees.filter(emp => {
      const matchesSearch = 
        emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch && emp.role === 'employee'; // Only show employees
    });
    setFilteredEmployees(filtered);
  }, [searchTerm, employees]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await hrAPI.getEmployees();
      setEmployees(res.data || []);
    } catch (err: any) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setEditFormData({
      name: employee.name,
      email: employee.email,
      hourlyWage: employee.hourlyWage || '',
      password: ''
    });
    setEditError(null);
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
    setEditFormData({ name: '', email: '', hourlyWage: '', password: '' });
    setEditError(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'hourlyWage') {
      setEditFormData(prev => ({ ...prev, [name]: value === '' ? '' : parseFloat(value) || '' }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Check if there are any changes
  const hasChanges = (): boolean => {
    if (!editingEmployee) return false;

    // Check name
    if (editFormData.name !== editingEmployee.name) return true;

    // Check email
    if (editFormData.email !== editingEmployee.email) return true;

    // Check hourlyWage (handle empty string vs 0)
    const currentWage = editFormData.hourlyWage === '' ? 0 : Number(editFormData.hourlyWage);
    const originalWage = editingEmployee.hourlyWage || 0;
    if (currentWage !== originalWage) return true;

    // Check password (only if provided)
    if (editFormData.password && editFormData.password.trim() !== '') return true;

    return false;
  };

  const handleSaveEdit = async () => {
    if (!editingEmployee || !hasChanges()) return;

    try {
      setEditLoading(true);
      setEditError(null);

      const updateData: { name?: string; email?: string; hourlyWage?: number; password?: string } = {};
      if (editFormData.name !== editingEmployee.name) updateData.name = editFormData.name;
      if (editFormData.email !== editingEmployee.email) updateData.email = editFormData.email;
      if (editFormData.hourlyWage !== editingEmployee.hourlyWage) {
        updateData.hourlyWage = editFormData.hourlyWage === '' ? 0 : Number(editFormData.hourlyWage);
      }
      if (editFormData.password && editFormData.password.trim() !== '') {
        updateData.password = editFormData.password;
      }

      await hrAPI.updateEmployee(editingEmployee._id, updateData);
      await fetchEmployees(); // Refresh the list
      handleCancelEdit();
    } catch (err: any) {
      console.error('Error updating employee:', err);
      setEditError(err.response?.data?.message || 'Failed to update employee. Please try again.');
    } finally {
      setEditLoading(false);
    }
  };

  const columns: TableColumn<Employee>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (item) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">
            {item.name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-500">{item.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: 'Role',
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <WorkIcon className="w-3 h-3 mr-1" style={{ fontSize: 14 }} />
          {item.role.charAt(0).toUpperCase() + item.role.slice(1)}
        </span>
      )
    },
    {
      key: 'hourlyWage',
      header: 'Hourly Wage',
      render: (item) => (
        <div className="flex items-center text-sm">
          <AttachMoneyIcon className="w-4 h-4 mr-1 text-gray-400" style={{ fontSize: 16 }} />
          <span className="font-medium text-gray-900">
            {item.hourlyWage > 0 ? `$${item.hourlyWage.toFixed(2)}` : 'Salaried'}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Joined Date',
      render: (item) => {
        if (!item.createdAt) return '-';
        const date = new Date(item.createdAt);
        return (
          <div className="text-sm text-gray-500">
            {date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleEdit(item)}
            className="inline-flex items-center px-3 py-1.5 bg-blue-500 text-white text-xs font-medium rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <EditIcon style={{ fontSize: 16 }} className="mr-1" />
            Edit
          </button>
        </div>
      )
    }
  ];

  return (
    <DashboardLayout title="Manage Employees">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
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
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <PeopleIcon className="text-white" style={{ fontSize: 32 }} />
            </div>
            <div className="ml-4">
              <h1 className="text-3xl font-bold text-gray-900">Manage Employees</h1>
              <p className="text-sm text-gray-500 mt-1">
                View and manage all employees in the system
              </p>
            </div>
          </div>
        </div>

        {/* Search and Stats Bar */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <SearchIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-gray-900">{filteredEmployees.length}</span>
                {' '}employee{filteredEmployees.length !== 1 ? 's' : ''} found
              </div>
            </div>
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

        {/* Employees Table */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Employee List</h2>
          </div>
          <div className="p-6">
            <CommonTable
              data={filteredEmployees}
              columns={columns}
              loading={loading}
              emptyMessage="No employees found. Create your first employee to get started."
            />
          </div>
        </div>

        {/* Edit Employee Modal */}
        {editingEmployee && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Edit Employee</h2>
                <button
                  onClick={handleCancelEdit}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <CloseIcon />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                {editError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
                    <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-red-700">{editError}</p>
                  </div>
                )}

                <CommonTextField
                  id="edit-name"
                  name="name"
                  label="Name"
                  type="text"
                  value={editFormData.name}
                  onChange={handleEditChange}
                  required
                />

                <CommonTextField
                  id="edit-email"
                  name="email"
                  label="Email"
                  type="email"
                  value={editFormData.email}
                  onChange={handleEditChange}
                  required
                />

                <CommonTextField
                  id="edit-hourlyWage"
                  name="hourlyWage"
                  label="Hourly Wage ($)"
                  type="number"
                  value={editFormData.hourlyWage}
                  onChange={handleEditChange}
                  helperText="Leave empty or set to 0 for salaried employees"
                />

                <CommonTextField
                  id="edit-password"
                  name="password"
                  label="New Password (Optional)"
                  type="password"
                  value={editFormData.password}
                  onChange={handleEditChange}
                  helperText="Leave empty to keep current password"
                />

                {hasChanges() && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center">
                    <svg className="w-5 h-5 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-sm text-blue-700">You have unsaved changes</p>
                  </div>
                )}

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <CommonButton
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    disabled={editLoading}
                  >
                    Cancel
                  </CommonButton>
                  <CommonButton
                    type="button"
                    variant="primary"
                    onClick={handleSaveEdit}
                    disabled={editLoading || !hasChanges()}
                    loading={editLoading}
                    icon={<SaveIcon style={{ fontSize: 16 }} />}
                  >
                    Save Changes
                  </CommonButton>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ManageEmployeesPage;

