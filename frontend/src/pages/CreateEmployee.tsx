import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import { managerAPI, hrAPI, CreateEmployeeData } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { CommonTextField, CommonSelect, CommonButton } from '../components/Common';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const CreateEmployeePage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [formData, setFormData] = useState<Omit<CreateEmployeeData, 'hourlyWage'> & { hourlyWage: number | '' }>({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'employee', 
    hourlyWage: '' 
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  if (!user) {
    return <div>Loading...</div>;
  }
  // Determine which API to use based on user role
  const createEmployeeAPI = user?.role === 'hr' ? hrAPI.createEmployee : managerAPI.createEmployee;
  const dashboardPath = user?.role === 'hr' ? '/hr' : '/manager';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Convert empty hourlyWage to 0 before submitting
      const submitData: CreateEmployeeData = {
        ...formData,
        hourlyWage: formData.hourlyWage === '' ? 0 : formData.hourlyWage
      };
      await createEmployeeAPI(submitData);
      setSuccess(true);
      setFormData({ name: '', email: '', password: '', role: 'employee', hourlyWage: '' });
      setTimeout(() => {
        setSuccess(false);
        navigate(dashboardPath);
      }, 2000);
    } catch (err: any) {
      console.error('Error creating employee:', err);
      const errorMessage = err.response?.data?.message || 'Failed to create user. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'hourlyWage') {
        // Allow empty string for clearing the field
        if (value === '') {
          return { ...prev, hourlyWage: '' };
        }
        const numValue = parseFloat(value);
        // Only update if it's a valid number
        return {
          ...prev,
          hourlyWage: isNaN(numValue) ? prev.hourlyWage : numValue
        };
      }
      return {
        ...prev,
        [name]: value
      };
    });
  };

  return (
    <DashboardLayout title="Create Employee">
      <div className="max-w-2xl mx-auto">
      <CommonButton
        type="button"
        variant="outline"
        onClick={() => navigate(dashboardPath)}
        icon={<ArrowBackIcon style={{ fontSize: 16 }} />}
        size="sm"
        className="mb-6"
      >
        Back to Dashboard
      </CommonButton>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
          <div className="flex items-center mb-8">
            <div className="p-4 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <PeopleIcon className="text-white" style={{ fontSize: 32 }} />
            </div>
            <div className="ml-4">
              <h2 className="text-2xl font-bold text-gray-900">Create New User</h2>
              <p className="text-sm text-gray-500 mt-1">
                {user.role === 'manager' 
                  ? 'Add a new employee, manager, or HR to the system' 
                  : 'Add a new employee to the system'}
              </p>
            </div>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <CheckCircleIcon className="text-green-500 mr-3" style={{ fontSize: 24 }} />
              <div>
                <p className="text-sm font-medium text-green-700">User created successfully!</p>
                <p className="text-xs text-green-600 mt-1">Redirecting to dashboard...</p>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <ErrorOutlineIcon className="text-red-500 mr-3" style={{ fontSize: 24 }} />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <CommonTextField
                  id="name"
                  name="name"
                  type="text"
                  label="Full Name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <CommonTextField
                  id="email"
                  name="email"
                  type="email"
                  label="Email Address"
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <CommonTextField
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="Enter password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  helperText="Minimum 6 characters"
                />
              </div>

              <div>
                <CommonSelect
                  id="role"
                  name="role"
                  label="Role"
                  value={formData.role}
                  onChange={handleChange}
                  options={[
                    { value: 'employee', label: 'Employee' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'hr', label: 'HR' }
                  ]}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <CommonTextField
                  id="hourlyWage"
                  name="hourlyWage"
                  type="number"
                  label="Hourly Wage ($)"
                  placeholder="0.00"
                  value={formData.hourlyWage}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  helperText="Leave empty or 0 for salaried employees"
                />
              </div>
            </div>

            <div className="flex space-x-4 pt-4">
              <CommonButton
                type="button"
                variant="outline"
                onClick={() => navigate(dashboardPath)}
                fullWidth
              >
                Cancel
              </CommonButton>
              <CommonButton
                type="submit"
                variant="primary"
                disabled={loading}
                loading={loading}
                fullWidth
                icon={<AddIcon style={{ fontSize: 20 }} />}
              >
                Create User
              </CommonButton>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CreateEmployeePage;
