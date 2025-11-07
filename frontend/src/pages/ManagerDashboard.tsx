import React from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import ApproveTimesheets from '../components/ManagerDashboard/ApproveTimesheets';
import TeamSchedule from '../components/ManagerDashboard/TeamSchedule';
import ManageTeam from '../components/ManagerDashboard/ManageTeam';
import { useAppSelector } from '../store/hooks';
import AddIcon from '@mui/icons-material/Add';

const ManagerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);

  return (
    <DashboardLayout title="Manager Dashboard">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Manage your team's timesheets, schedules, and leave requests.</p>
      </div>

      {/* Quick Actions */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={() => navigate('/manager/create-employee')}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-medium rounded-lg hover:from-purple-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all duration-200 shadow-md hover:shadow-lg"
        >
          <AddIcon className="w-5 h-5 mr-2" style={{ fontSize: 20 }} />
          Create New Employee
        </button>
      </div>

      {/* Manage Team Section */}
      <div className="mb-6">
        <ManageTeam />
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="lg:col-span-1">
          <ApproveTimesheets />
        </div>
        <div className="lg:col-span-1">
          <TeamSchedule />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ManagerDashboard;

