import React, { useState, useEffect } from 'react';
import { managerAPI } from '../../services/api';
import { CommonTable, TableColumn, CommonButton, CommonSelect, SelectOption } from '../Common';
import PeopleIcon from '@mui/icons-material/People';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

interface TeamMember {
  _id: string;
  name: string;
  email: string;
  role: 'employee' | 'manager' | 'hr';
  hourlyWage?: number;
  createdAt?: string;
}

const ManageTeam: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addingEmployee, setAddingEmployee] = useState<boolean>(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchTeam();
    fetchAvailableEmployees();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await managerAPI.getTeam();
      setTeamMembers(res.data || []);
    } catch (err: any) {
      console.error('Error fetching team:', err);
      setError('Failed to load team members. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableEmployees = async () => {
    try {
      const res = await managerAPI.getAvailableEmployees();
      setAvailableEmployees(res.data || []);
    } catch (err: any) {
      console.error('Error fetching available employees:', err);
    }
  };

  const handleAddEmployee = async () => {
    if (!selectedEmployeeId) {
      setError('Please select an employee to add');
      return;
    }

    try {
      setAddingEmployee(true);
      setError(null);
      setSuccess(null);
      await managerAPI.addEmployeeToTeam(selectedEmployeeId);
      setSuccess('Employee added to team successfully');
      setSelectedEmployeeId('');
      await fetchTeam();
      await fetchAvailableEmployees();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error adding employee:', err);
      setError(err.response?.data?.message || 'Failed to add employee to team');
    } finally {
      setAddingEmployee(false);
    }
  };

  const handleRemoveEmployee = async (employeeId: string, employeeName: string) => {
    if (!window.confirm(`Are you sure you want to remove ${employeeName} from your team?`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      await managerAPI.removeEmployeeFromTeam(employeeId);
      setSuccess(`${employeeName} removed from team successfully`);
      await fetchTeam();
      await fetchAvailableEmployees();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error removing employee:', err);
      setError(err.response?.data?.message || 'Failed to remove employee from team');
    }
  };

  const getAvailableEmployeeOptions = (): SelectOption[] => {
    // Filter out employees already in the team
    const teamMemberIds = teamMembers.map(m => m._id);
    const available = availableEmployees.filter(emp => !teamMemberIds.includes(emp._id));
    
    return available.map(emp => ({
      value: emp._id,
      label: `${emp.name} (${emp.email})`
    }));
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const columns: TableColumn<TeamMember>[] = [
    {
      key: 'name',
      header: 'Team Member',
      render: (item) => (
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold">
            {item.name.charAt(0).toUpperCase()}
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{item.name}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <EmailIcon className="mr-1" style={{ fontSize: 14 }} />
              {item.email}
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'hourlyWage',
      header: 'Hourly Wage',
      render: (item) => (
        <div className="flex items-center text-sm">
          <AttachMoneyIcon className="w-4 h-4 mr-1 text-gray-400" style={{ fontSize: 16 }} />
          <span className="font-medium text-gray-900">
            {item.hourlyWage && item.hourlyWage > 0 ? `$${item.hourlyWage.toFixed(2)}` : 'Salaried'}
          </span>
        </div>
      )
    },
    {
      key: 'createdAt',
      header: 'Joined',
      render: (item) => (
        <div className="text-sm text-gray-500">
          {formatDate(item.createdAt)}
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (item) => (
        <button
          onClick={() => handleRemoveEmployee(item._id, item.name)}
          className="inline-flex items-center px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          <RemoveIcon style={{ fontSize: 16 }} className="mr-1" />
          Remove
        </button>
      )
    }
  ];

  const availableOptions = getAvailableEmployeeOptions();

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl">
              <PeopleIcon className="text-white" style={{ fontSize: 24 }} />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">Manage Team</h3>
              <p className="text-sm text-gray-500">Add or remove employees from your team</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Add Employee Section */}
      <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
        <div className="flex items-end space-x-4">
          <div className="flex-1">
            <CommonSelect
              id="employeeSelect"
              name="employeeSelect"
              label="Add Employee to Team"
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              options={availableOptions}
              placeholder={availableOptions.length === 0 ? "No available employees" : "Select an employee"}
              disabled={addingEmployee || availableOptions.length === 0}
              helperText={availableOptions.length === 0 ? "All employees are already in your team" : "Select an employee to add to your team"}
            />
          </div>
          <CommonButton
            type="button"
            variant="primary"
            onClick={handleAddEmployee}
            disabled={addingEmployee || !selectedEmployeeId || availableOptions.length === 0}
            loading={addingEmployee}
            icon={<PersonAddIcon style={{ fontSize: 16 }} />}
          >
            Add to Team
          </CommonButton>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-red-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <svg className="w-5 h-5 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="text-sm text-green-700">{success}</p>
        </div>
      )}

      {/* Team Members Table */}
      <div className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : teamMembers.length === 0 ? (
          <div className="text-center py-12">
            <PeopleIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-sm text-gray-500">No team members yet</p>
            <p className="mt-2 text-xs text-gray-400">
              Add employees using the dropdown above to build your team
            </p>
          </div>
        ) : (
          <CommonTable
            data={teamMembers}
            columns={columns}
            emptyMessage="No team members found"
          />
        )}
      </div>
    </div>
  );
};

export default ManageTeam;

