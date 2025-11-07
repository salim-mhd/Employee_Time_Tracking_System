import React, { useState } from 'react';
import { hrAPI, ProcessPayrollData } from '../../services/api';
import { CommonTextField, CommonButton } from '../Common';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const PayrollProcessing: React.FC = () => {
  const [formData, setFormData] = useState<ProcessPayrollData>({ 
    employeeId: '', 
    period: '' 
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
      await hrAPI.processPayroll(formData);
      setSuccess(true);
      setFormData({ employeeId: '', period: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error processing payroll:', err);
      setError('Failed to process payroll. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center mb-6">
        <div className="p-3 bg-green-100 rounded-lg">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="ml-4 text-lg font-semibold text-gray-900">Process Payroll</h3>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-green-700 font-medium">Payroll processed successfully!</p>
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
          id="employeeId"
          name="employeeId"
          type="text"
          label="Employee ID"
          placeholder="Enter employee ID"
          value={formData.employeeId}
          onChange={handleChange}
          required
          className="focus:ring-green-500 focus:border-green-500"
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

        <CommonButton
          type="submit"
          variant="success"
          disabled={loading}
          loading={loading}
          fullWidth
          icon={<CheckCircleIcon style={{ fontSize: 20 }} />}
        >
          Process Payroll
        </CommonButton>
      </form>
    </div>
  );
};

export default PayrollProcessing;
