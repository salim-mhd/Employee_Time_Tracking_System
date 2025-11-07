import React from 'react';
import DashboardLayout from '../components/Layout/DashboardLayout';
import ClockInOut from '../components/EmployeePortal/ClockInOut';
import TimesheetView from '../components/EmployeePortal/TimesheetView';
import TimeOffRequest from '../components/EmployeePortal/TimeOffRequest';

const EmployeeDashboard: React.FC = () => {
  return (
    <DashboardLayout title="Employee Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <ClockInOut />
        </div>
        <div className="lg:col-span-1">
          <TimeOffRequest />
        </div>
        <div className="lg:col-span-1">
          {/* This will be moved to full width below */}
        </div>
      </div>
      
      {/* Timesheet View - Full Width */}
      <div className="mt-6">
        <TimesheetView />
      </div>
    </DashboardLayout>
  );
};

export default EmployeeDashboard;

