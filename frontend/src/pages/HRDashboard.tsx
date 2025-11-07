import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/Layout/DashboardLayout';
import PendingRequests from '../components/HRAdmin/PendingRequests';
import { hrAPI } from '../services/api';
import { useAppSelector } from '../store/hooks';
import { CommonButton } from '../components/Common';
import AddIcon from '@mui/icons-material/Add';
import PeopleIcon from '@mui/icons-material/People';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

const HRDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAppSelector((state) => state.auth);
  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalPayroll: 0,
    pendingRequests: 0,
    activeReports: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch dashboard statistics
    const fetchStats = async () => {
      try {
        const res = await hrAPI.getStats();
        setStats({
          totalEmployees: res.data.totalEmployees || 0,
          totalPayroll: res.data.totalPayroll || 0,
          pendingRequests: res.data.pendingRequests || 0,
          activeReports: res.data.activeReports || 0
        });
      } catch (err) {
        console.error('Error fetching stats:', err);
        // Keep default values on error
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees || '0',
      icon: <PeopleIcon className="w-8 h-8" />,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Total Payroll',
      value: `$${stats.totalPayroll.toLocaleString() || '0'}`,
      icon: <AttachMoneyIcon className="w-8 h-8" />,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'Pending Requests',
      value: stats.pendingRequests || '0',
      icon: <TrendingUpIcon className="w-8 h-8" />,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    },
    {
      title: 'Active Reports',
      value: stats.activeReports || '0',
      icon: <AssessmentIcon className="w-8 h-8" />,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    }
  ];

  return (
    <DashboardLayout title="HR Dashboard">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome back, {user?.name}!</h1>
        <p className="text-gray-600">Manage your workforce, process payroll, and generate reports.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-200 p-6 border border-gray-100"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <div className={stat.iconColor}>{stat.icon}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
        </div>
        <div className="flex flex-wrap gap-4">
          <CommonButton
            type="button"
            variant="primary"
            onClick={() => navigate('/hr/create-employee')}
            icon={<AddIcon style={{ fontSize: 20 }} />}
          >
            Create New Employee
          </CommonButton>
          <CommonButton
            type="button"
            variant="secondary"
            onClick={() => navigate('/hr/manage-employees')}
            icon={<PeopleIcon style={{ fontSize: 20 }} />}
          >
            Manage Employees
          </CommonButton>
          <CommonButton
            type="button"
            variant="success"
            onClick={() => navigate('/hr/process-payroll')}
            icon={<AttachMoneyIcon style={{ fontSize: 20 }} />}
          >
            Process Payroll
          </CommonButton>
          <CommonButton
            type="button"
            variant="outline"
            onClick={() => navigate('/hr/reports')}
            icon={<AssessmentIcon style={{ fontSize: 20 }} />}
          >
            View Reports
          </CommonButton>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6">
        <div>
          <PendingRequests />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default HRDashboard;

