import express from 'express';
import mongoose from 'mongoose';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import Timesheet from '../models/Timesheet';
import LeaveRequest from '../models/LeaveRequest';
import Employee from '../models/Employee';

interface CreateEmployeeBody {
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'manager' | 'hr';
  hourlyWage: number;
}

const router = express.Router();

// Create Employee (Manager only - can create employees, managers, and HR)
router.post('/employees', protect, authorize('manager'), async (req: AuthRequest<{}, {}, CreateEmployeeBody>, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { name, email, password, role, hourlyWage } = req.body;

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Create new employee/user
    // Only assign managerId if creating an employee, not for managers or HR
    const employeeData: any = {
      name,
      email,
      password,
      role,
      hourlyWage: hourlyWage || 0
    };

    // Only assign to manager's team if it's an employee
    if (role === 'employee') {
      employeeData.managerId = req.user._id;
    }

    const employee = new Employee(employeeData);
    await employee.save();

    res.status(201).json({
      id: (employee._id as mongoose.Types.ObjectId).toString(),
      name: employee.name,
      email: employee.email,
      role: employee.role,
      hourlyWage: employee.hourlyWage
    });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }
    res.status(500).json({ message: 'Error creating employee' });
  }
});

// Get Team Members (Manager only)
router.get('/team', protect, authorize('manager'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const managerId = req.user._id instanceof mongoose.Types.ObjectId 
      ? req.user._id 
      : new mongoose.Types.ObjectId(req.user._id as string);

    // Find all employees managed by this manager
    // Use explicit ObjectId comparison
    const teamMembers = await Employee.find({ 
      managerId: managerId 
    })
      .select('_id name email role hourlyWage createdAt')
      .sort({ name: 1 });

    console.log(`[DEBUG] Manager ${managerId.toString()} team members:`, teamMembers.map(m => ({
      _id: (m._id as mongoose.Types.ObjectId).toString(),
      name: m.name,
      email: m.email
    })));

    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Error fetching team members' });
  }
});

// Get Available Employees (Manager only) - employees without a manager or already assigned to this manager
router.get('/available-employees', protect, authorize('manager'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const managerId = req.user._id instanceof mongoose.Types.ObjectId 
      ? req.user._id 
      : new mongoose.Types.ObjectId(req.user._id as string);

    // Find employees that are either:
    // 1. Not assigned to any manager (managerId is null/undefined)
    // 2. Already assigned to this manager
    const availableEmployees = await Employee.find({
      role: 'employee',
      $or: [
        { managerId: null },
        { managerId: { $exists: false } },
        { managerId: managerId }
      ]
    })
    .select('_id name email role hourlyWage managerId createdAt')
    .sort({ name: 1 });

    res.json(availableEmployees);
  } catch (error) {
    console.error('Error fetching available employees:', error);
    res.status(500).json({ message: 'Error fetching available employees' });
  }
});

// Add Employee to Team (Manager only)
router.put('/team/:employeeId/add', protect, authorize('manager'), async (req: AuthRequest<{ employeeId: string }>, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { employeeId } = req.params;
    const managerId = req.user._id instanceof mongoose.Types.ObjectId 
      ? req.user._id 
      : new mongoose.Types.ObjectId(req.user._id as string);

    // Find the employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (employee.role !== 'employee') {
      return res.status(400).json({ message: 'Only employees can be added to a team' });
    }

    // Check if employee is already assigned to another manager
    if (employee.managerId && employee.managerId.toString() !== managerId.toString()) {
      return res.status(400).json({ message: 'Employee is already assigned to another manager' });
    }

    // Assign to this manager
    employee.managerId = managerId;
    await employee.save();

    res.json({
      message: 'Employee added to team successfully',
      employee: {
        id: (employee._id as mongoose.Types.ObjectId).toString(),
        name: employee.name,
        email: employee.email,
        role: employee.role
      }
    });
  } catch (error: any) {
    console.error('Error adding employee to team:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid employee ID format' });
    }
    res.status(500).json({ message: 'Error adding employee to team' });
  }
});

// Remove Employee from Team (Manager only)
router.put('/team/:employeeId/remove', protect, authorize('manager'), async (req: AuthRequest<{ employeeId: string }>, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { employeeId } = req.params;
    const managerId = req.user._id instanceof mongoose.Types.ObjectId 
      ? req.user._id 
      : new mongoose.Types.ObjectId(req.user._id as string);

    // Find the employee
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Verify employee belongs to this manager
    if (!employee.managerId || employee.managerId.toString() !== managerId.toString()) {
      return res.status(403).json({ message: 'Employee is not in your team' });
    }

    // Remove from team
    employee.managerId = undefined;
    await employee.save();

    res.json({
      message: 'Employee removed from team successfully',
      employee: {
        id: (employee._id as mongoose.Types.ObjectId).toString(),
        name: employee.name,
        email: employee.email
      }
    });
  } catch (error: any) {
    console.error('Error removing employee from team:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid employee ID format' });
    }
    res.status(500).json({ message: 'Error removing employee from team' });
  }
});

// Get Team Timesheets (Manager only)
router.get('/team-timesheets', protect, authorize('manager'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const managerId = req.user._id instanceof mongoose.Types.ObjectId 
      ? req.user._id 
      : new mongoose.Types.ObjectId(req.user._id as string);

    // Find all employees managed by this manager
    const teamMembers = await Employee.find({ managerId }).select('_id name email');
    const teamMemberIds = teamMembers.map(member => {
      // Ensure we convert to ObjectId properly
      return member._id instanceof mongoose.Types.ObjectId 
        ? member._id 
        : new mongoose.Types.ObjectId(member._id as string);
    });

    console.log(`Manager ${managerId} has ${teamMembers.length} team members`);
    console.log(`Team member IDs:`, teamMemberIds.map(id => id.toString()));

    // If no team members, return empty array
    if (teamMemberIds.length === 0) {
      console.log('No team members found for manager');
      return res.json([]);
    }

    // Get timesheets for all team members
    // Convert ObjectIds to strings for better debugging
    const timesheets = await Timesheet.find({ 
      employeeId: { $in: teamMemberIds } 
    })
    .populate('employeeId', 'name email')
    .sort({ date: -1 });

    // Debug: Check all pending timesheets in database
    const allPendingTimesheets = await Timesheet.find({ status: 'pending' })
      .select('employeeId date status')
      .lean();
    console.log(`[DEBUG] All pending timesheets in DB:`, allPendingTimesheets.map(ts => ({
      employeeId: ts.employeeId?.toString(),
      date: ts.date,
      status: ts.status
    })));

    console.log(`Found ${timesheets.length} timesheets for manager ${managerId}`);
    console.log(`Timesheet employeeIds:`, timesheets.map(ts => {
      const empId = ts.employeeId;
      if (empId instanceof mongoose.Types.ObjectId) {
        return empId.toString();
      } else if (typeof empId === 'object' && empId !== null && '_id' in empId) {
        return (empId as any)._id?.toString();
      }
      return String(empId);
    }));

    res.json(timesheets);
  } catch (error) {
    console.error('Error fetching team timesheets:', error);
    res.status(500).json({ message: 'Error fetching team timesheets' });
  }
});

// Approve/Reject Timesheet (Manager only)
router.put('/timesheets/:id/approve', protect, authorize('manager'), async (req: AuthRequest<{ id: string }, {}, { approved: boolean }>, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find the timesheet
    const timesheet = await Timesheet.findById(id).populate('employeeId', 'managerId');
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Verify that the employee belongs to this manager's team
    const employee = await Employee.findById(timesheet.employeeId);
    if (!employee || employee.managerId?.toString() !== req.user._id?.toString()) {
      return res.status(403).json({ message: 'You are not authorized to approve this timesheet' });
    }

    // Update timesheet status
    timesheet.status = approved ? 'approved' : 'rejected';
    await timesheet.save();

    res.json({ message: `Timesheet ${approved ? 'approved' : 'rejected'} successfully`, timesheet });
  } catch (error) {
    console.error('Error approving timesheet:', error);
    res.status(500).json({ message: 'Error approving timesheet' });
  }
});

// Get Team Schedules/Leave Requests (Manager only)
router.get('/team-schedules', protect, authorize('manager'), async (req: AuthRequest, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const managerId = req.user._id instanceof mongoose.Types.ObjectId 
      ? req.user._id 
      : new mongoose.Types.ObjectId(req.user._id as string);

    // Find all employees managed by this manager
    const teamMembers = await Employee.find({ managerId }).select('_id name email');
    const teamMemberIds = teamMembers.map(member => {
      // Ensure we convert to ObjectId properly
      return member._id instanceof mongoose.Types.ObjectId 
        ? member._id 
        : new mongoose.Types.ObjectId(member._id as string);
    });

    console.log(`Manager ${managerId} has ${teamMembers.length} team members for schedules`);
    console.log(`Team member IDs:`, teamMemberIds.map(id => id.toString()));

    // If no team members, return empty array
    if (teamMemberIds.length === 0) {
      console.log('No team members found for manager');
      return res.json([]);
    }

    // Get leave requests for all team members
    const leaveRequests = await LeaveRequest.find({ 
      employeeId: { $in: teamMemberIds } 
    })
    .populate('employeeId', 'name email')
    .sort({ startDate: -1 });

    console.log(`Found ${leaveRequests.length} leave requests for manager ${managerId}`);
    res.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching team schedules:', error);
    res.status(500).json({ message: 'Error fetching team schedules' });
  }
});

// Approve/Reject Leave Request (Manager only)
router.put('/leaves/:id/approve', protect, authorize('manager'), async (req: AuthRequest<{ id: string }, {}, { approved: boolean }>, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    if (!req.user) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Find the leave request
    const leaveRequest = await LeaveRequest.findById(id);
    
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Verify that the employee belongs to this manager's team
    const employee = await Employee.findById(leaveRequest.employeeId);
    if (!employee || employee.managerId?.toString() !== req.user._id?.toString()) {
      return res.status(403).json({ message: 'You are not authorized to approve this leave request' });
    }

    // Update leave request status
    leaveRequest.status = approved ? 'approved' : 'rejected';
    await leaveRequest.save();

    res.json({ message: `Leave request ${approved ? 'approved' : 'rejected'} successfully`, leaveRequest });
  } catch (error) {
    console.error('Error approving leave request:', error);
    res.status(500).json({ message: 'Error approving leave request' });
  }
});

export default router;

