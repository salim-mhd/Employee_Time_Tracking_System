import express from 'express';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import Employee, { IUser } from '../models/Employee';
import LeaveRequest from '../models/LeaveRequest';
import Timesheet from '../models/Timesheet';
import Payroll from '../models/Payroll';

interface CreateEmployeeBody {
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'manager' | 'hr';
  hourlyWage: number;
}

const router = express.Router();

// Create Employee (HR only)
router.post('/employees', protect, authorize('hr'), async (req: AuthRequest<{}, {}, CreateEmployeeBody>, res) => {
  try {
    const { name, email, password, role, hourlyWage } = req.body;

    // Check if employee already exists
    const existingEmployee = await Employee.findOne({ email });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }

    // Create new employee
    const employee = new Employee({
      name,
      email,
      password,
      role,
      hourlyWage: hourlyWage || 0
    });

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

// Get Dashboard Statistics (HR only)
router.get('/stats', protect, authorize('hr'), async (req: AuthRequest, res) => {
  try {
    const totalEmployees = await Employee.countDocuments({ role: 'employee' });
    const pendingLeaveRequests = await LeaveRequest.countDocuments({ status: 'pending' });
    const pendingTimesheets = await Timesheet.countDocuments({ status: 'pending' });
    
    // Calculate total payroll based on actual processed payrolls for current month
    const currentDate = new Date();
    const currentPeriod = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Get all processed payrolls for the current month
    const currentMonthPayrolls = await Payroll.find({ period: currentPeriod });
    let totalPayroll = currentMonthPayrolls.reduce((sum, payroll) => sum + (payroll.totalPay || 0), 0);
    
    // If no payrolls processed yet, calculate based on approved timesheets for current month
    if (totalPayroll === 0) {
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0, 23, 59, 59, 999);
      
      // Get all approved timesheets for current month
      const timesheets = await Timesheet.find({
        date: { $gte: startDate, $lte: endDate },
        status: 'approved'
      }).populate('employeeId', 'hourlyWage');
      
      // Calculate payroll for each employee based on their timesheets
      const employeePayrollMap = new Map();
      
      timesheets.forEach((timesheet: any) => {
        const employeeId = timesheet.employeeId?._id?.toString() || timesheet.employeeId?.toString();
        if (!employeeId) return;
        
        const hourlyWage = timesheet.employeeId?.hourlyWage || 0;
        if (hourlyWage === 0) return; // Skip salaried employees
        
        const regularHours = (timesheet.totalHours || 0) - (timesheet.overtimeHours || 0);
        const overtimeHours = timesheet.overtimeHours || 0;
        
        if (!employeePayrollMap.has(employeeId)) {
          employeePayrollMap.set(employeeId, { regularHours: 0, overtimeHours: 0, hourlyWage });
        }
        
        const current = employeePayrollMap.get(employeeId);
        current.regularHours += regularHours;
        current.overtimeHours += overtimeHours;
      });
      
      // Calculate total payroll
      employeePayrollMap.forEach((data) => {
        const basePay = data.regularHours * data.hourlyWage;
        const overtimePay = data.overtimeHours * data.hourlyWage * 1.5;
        totalPayroll += basePay + overtimePay;
      });
    }
    
    res.json({
      totalEmployees,
      totalPayroll: Math.round(totalPayroll * 100) / 100, // Round to 2 decimal places
      pendingRequests: pendingLeaveRequests + pendingTimesheets,
      activeReports: 0 // Can be updated when reports are implemented
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
});

// Get all employees (HR only) - returns only employees, not managers or HR
router.get('/employees', protect, authorize('hr'), async (req: AuthRequest, res) => {
  try {
    const employees = await Employee.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Error fetching employees' });
  }
});

// Update Employee (HR only)
router.put('/employees/:id', protect, authorize('hr'), async (req: AuthRequest<{ id: string }, {}, { name?: string; email?: string; hourlyWage?: number; password?: string }>, res) => {
  try {
    const { id } = req.params;
    const { name, email, hourlyWage, password } = req.body;

    // Find employee
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if email is being changed and if it already exists
    if (email && email !== employee.email) {
      const existingEmployee = await Employee.findOne({ email });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Employee with this email already exists' });
      }
      employee.email = email;
    }

    // Update fields
    if (name) employee.name = name;
    if (hourlyWage !== undefined) employee.hourlyWage = hourlyWage;
    if (password) {
      // Set plain password - the pre-save hook will hash it automatically
      employee.password = password;
      // Mark password as modified to ensure the pre-save hook runs
      employee.markModified('password');
    }

    await employee.save();

    res.json({
      id: (employee._id as mongoose.Types.ObjectId).toString(),
      name: employee.name,
      email: employee.email,
      role: employee.role,
      hourlyWage: employee.hourlyWage
    });
  } catch (error: any) {
    console.error('Error updating employee:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Employee with this email already exists' });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid employee ID format' });
    }
    res.status(500).json({ message: 'Error updating employee' });
  }
});

// Get Pending Requests (HR only) - Leave requests and timesheets
router.get('/pending-requests', protect, authorize('hr'), async (req: AuthRequest, res) => {
  try {
    const pendingLeaveRequests = await LeaveRequest.find({ status: 'pending' })
      .populate('employeeId', 'name email')
      .sort({ createdAt: -1 });
    
    const pendingTimesheets = await Timesheet.find({ status: 'pending' })
      .populate('employeeId', 'name email')
      .sort({ date: -1 });

    res.json({
      leaveRequests: pendingLeaveRequests,
      timesheets: pendingTimesheets
    });
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    res.status(500).json({ message: 'Error fetching pending requests' });
  }
});

// Get all payrolls (HR only)
router.get('/payrolls', protect, authorize('hr'), async (req: AuthRequest, res) => {
  try {
    const payrolls = await Payroll.find()
      .populate('employeeId', 'name email')
      .sort({ createdAt: -1 });
    res.json(payrolls);
  } catch (error) {
    console.error('Error fetching payrolls:', error);
    res.status(500).json({ message: 'Error fetching payrolls' });
  }
});

// Process Payroll (HR only)
router.post('/payroll', protect, authorize('hr'), async (req: AuthRequest<{}, {}, { employeeId: string; period: string }>, res) => {
  try {
    const { employeeId, period } = req.body;

    // Validate inputs
    if (!employeeId || !period) {
      return res.status(400).json({ message: 'Employee ID and period are required' });
    }

    // Validate period format (YYYY-MM)
    if (!period.match(/^\d{4}-\d{2}$/)) {
      return res.status(400).json({ message: 'Period must be in YYYY-MM format' });
    }

    // Check if employee exists
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if payroll already exists for this employee and period
    const existingPayroll = await Payroll.findOne({ employeeId, period });
    if (existingPayroll) {
      return res.status(400).json({ message: 'Payroll already processed for this employee and period' });
    }

    // Parse period to get start and end dates
    const [year, month] = period.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month

    // Find all approved timesheets for this employee in the given period
    const timesheets = await Timesheet.find({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      date: { $gte: startDate, $lte: endDate },
      status: 'approved'
    });

    // Calculate payroll
    let totalRegularHours = 0;
    let totalOvertimeHours = 0;

    timesheets.forEach(timesheet => {
      const regularHours = (timesheet.totalHours || 0) - (timesheet.overtimeHours || 0);
      totalRegularHours += regularHours;
      totalOvertimeHours += timesheet.overtimeHours || 0;
    });

    const hourlyWage = employee.hourlyWage || 0;
    const basePay = totalRegularHours * hourlyWage;
    const overtimePay = totalOvertimeHours * hourlyWage * 1.5; // Overtime is typically 1.5x
    const deductions = 0; // Can be calculated based on tax, insurance, etc.
    const totalPay = basePay + overtimePay - deductions;

    // Create payroll record
    const payroll = new Payroll({
      employeeId: new mongoose.Types.ObjectId(employeeId),
      period,
      basePay: Math.round(basePay * 100) / 100, // Round to 2 decimal places
      overtimePay: Math.round(overtimePay * 100) / 100,
      deductions: Math.round(deductions * 100) / 100,
      totalPay: Math.round(totalPay * 100) / 100,
      status: 'processed'
    });

    await payroll.save();

    // Populate employeeId for response
    await payroll.populate('employeeId', 'name email');

    res.status(201).json({
      message: 'Payroll processed successfully',
      payroll: {
        _id: payroll._id,
        employeeId: payroll.employeeId,
        period: payroll.period,
        basePay: payroll.basePay,
        overtimePay: payroll.overtimePay,
        deductions: payroll.deductions,
        totalPay: payroll.totalPay,
        status: payroll.status,
        createdAt: (payroll as any).createdAt
      }
    });
  } catch (error: any) {
    console.error('Error processing payroll:', error);
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid employee ID format' });
    }
    res.status(500).json({ message: 'Error processing payroll' });
  }
});

// Get Payroll Report (HR only)
router.get('/reports/payroll', protect, authorize('hr'), async (req: AuthRequest<{}, {}, {}, { period?: string }>, res) => {
  try {
    const { period } = req.query;
    
    if (!period) {
      return res.status(400).json({ message: 'Period parameter is required' });
    }

    // Validate period format (YYYY-MM)
    if (!period.match(/^\d{4}-\d{2}$/)) {
      return res.status(400).json({ message: 'Period must be in YYYY-MM format' });
    }

    // Find all payrolls for the given period
    const payrolls = await Payroll.find({ period })
      .populate('employeeId', 'name email')
      .sort({ createdAt: -1 });

    res.json(payrolls);
  } catch (error) {
    console.error('Error fetching payroll report:', error);
    res.status(500).json({ message: 'Error fetching payroll report' });
  }
});

// Get Attendance Report (HR only)
router.get('/reports/attendance', protect, authorize('hr'), async (req: AuthRequest<{}, {}, {}, { employeeId?: string }>, res) => {
  try {
    const { employeeId } = req.query;
    
    if (!employeeId) {
      return res.status(400).json({ message: 'Employee ID parameter is required' });
    }

    // Validate employeeId format
    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({ message: 'Invalid employee ID format' });
    }

    // Find all timesheets for the given employee
    const timesheets = await Timesheet.find({ 
      employeeId: new mongoose.Types.ObjectId(employeeId) 
    })
      .populate('employeeId', 'name email')
      .sort({ date: -1 });

    res.json(timesheets);
  } catch (error) {
    console.error('Error fetching attendance report:', error);
    res.status(500).json({ message: 'Error fetching attendance report' });
  }
});

// Approve/Reject Leave Request (HR only)
router.put('/leaves/:id/approve', protect, authorize('hr'), async (req: AuthRequest<{ id: string }, {}, { approved: boolean }>, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    // Find the leave request
    const leaveRequest = await LeaveRequest.findById(id);
    
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    // Update leave request status (HR can approve any leave request)
    leaveRequest.status = approved ? 'approved' : 'rejected';
    await leaveRequest.save();

    res.json({ message: `Leave request ${approved ? 'approved' : 'rejected'} successfully`, leaveRequest });
  } catch (error) {
    console.error('Error approving leave request:', error);
    res.status(500).json({ message: 'Error approving leave request' });
  }
});

// Approve/Reject Timesheet (HR only)
router.put('/timesheets/:id/approve', protect, authorize('hr'), async (req: AuthRequest<{ id: string }, {}, { approved: boolean }>, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;

    // Find the timesheet
    const timesheet = await Timesheet.findById(id);
    
    if (!timesheet) {
      return res.status(404).json({ message: 'Timesheet not found' });
    }

    // Update timesheet status (HR can approve any timesheet)
    timesheet.status = approved ? 'approved' : 'rejected';
    await timesheet.save();

    res.json({ message: `Timesheet ${approved ? 'approved' : 'rejected'} successfully`, timesheet });
  } catch (error) {
    console.error('Error approving timesheet:', error);
    res.status(500).json({ message: 'Error approving timesheet' });
  }
});

// Get Leaves Report (HR only)
router.get('/reports/leaves', protect, authorize('hr'), async (req: AuthRequest, res) => {
  try {
    // Find all leave requests
    const leaveRequests = await LeaveRequest.find()
      .populate('employeeId', 'name email')
      .sort({ createdAt: -1 });

    res.json(leaveRequests);
  } catch (error) {
    console.error('Error fetching leaves report:', error);
    res.status(500).json({ message: 'Error fetching leaves report' });
  }
});

export default router;

