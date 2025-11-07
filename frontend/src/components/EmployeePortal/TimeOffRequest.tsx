import React, { useState } from 'react';
import { employeeAPI } from '../../services/api';
import { CommonTextField, CommonSelect, CommonButton } from '../Common';

interface LeaveFormData {
  type: string;
  startDate: string;
  endDate: string;
  reason: string;
}

const TimeOffRequest: React.FC = () => {
  const [formData, setFormData] = useState<LeaveFormData>({ 
    type: '', 
    startDate: '', 
    endDate: '', 
    reason: '' 
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
      await employeeAPI.requestLeave({
        type: formData.type,
        startDate: formData.startDate,
        endDate: formData.endDate,
        reason: formData.reason || undefined
      });
      setSuccess(true);
      setFormData({ type: '', startDate: '', endDate: '', reason: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error submitting leave request:', err);
      setError('Failed to submit request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <div className="flex items-center mb-6">
        <div className="p-3 bg-purple-100 rounded-lg">
          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="ml-4 text-lg font-semibold text-gray-900">Request Time Off</h3>
      </div>

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-green-700 font-medium">Request submitted successfully!</p>
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
        <CommonSelect
          id="type"
          name="type"
          label="Leave Type"
          value={formData.type}
          onChange={handleChange}
          options={[
            { value: '', label: 'Select leave type' },
            { value: 'sick', label: 'Sick Leave' },
            { value: 'vacation', label: 'Vacation' }
          ]}
          required
        />

        <div className="grid grid-cols-2 gap-4">
          <CommonTextField
            id="startDate"
            name="startDate"
            type="date"
            label="Start Date"
            value={formData.startDate}
            onChange={handleChange}
            required
          />
          <CommonTextField
            id="endDate"
            name="endDate"
            type="date"
            label="End Date"
            value={formData.endDate}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
            Reason (Optional)
          </label>
          <textarea 
            id="reason"
            name="reason"
            value={formData.reason} 
            onChange={handleChange} 
            placeholder="Enter reason for leave request..."
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors resize-none"
          />
        </div>

        <CommonButton
          type="submit"
          variant="primary"
          disabled={loading}
          loading={loading}
          fullWidth
        >
          Submit Request
        </CommonButton>
      </form>
    </div>
  );
};

export default TimeOffRequest;
