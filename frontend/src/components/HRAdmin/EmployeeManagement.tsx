import React, { useState } from 'react';
import { hrAPI, CreateEmployeeData } from '../../services/api';
import { CommonTextField, CommonSelect, CommonButton } from '../Common';
import AddIcon from '@mui/icons-material/Add';

const EmployeeManagement: React.FC = () => {
  const [formData, setFormData] = useState<CreateEmployeeData>({ 
    name: '', 
    email: '', 
    password: '', 
    role: 'employee', 
    hourlyWage: 0 
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await hrAPI.createEmployee(formData);
      setSuccess(true);
      setFormData({ name: '', email: '', password: '', role: 'employee', hourlyWage: 0 });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error creating employee:', err);
      setError('Failed to add employee. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: name === 'hourlyWage' ? parseFloat(value) || 0 : value 
    }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center mb-6">
        <div className="p-3 bg-purple-100 rounded-lg">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
        <h3 className="ml-4 text-lg font-semibold text-gray-900">Add Employe e</h3>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-green-700 font-medium">Employee added successfully!</p>
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <CommonTextField
          id="password"
          name="password"
          type="password"
          label="Password"
          placeholder="Enter password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <div className="grid grid-cols-2 gap-4">
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
          />
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
          />
        </div>

        <CommonButton
          type="submit"
          variant="primary"
          disabled={loading}
          loading={loading}
          fullWidth
          icon={<AddIcon style={{ fontSize: 20 }} />}
        >
          Add Employee
        </CommonButton>
      </form>
    </div>
  );
};

export default EmployeeManagement;
