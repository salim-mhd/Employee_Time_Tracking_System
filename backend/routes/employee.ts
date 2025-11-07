import express from 'express';
import { protect, AuthRequest } from '../middleware/auth';
import Timesheet from '../models/Timesheet';
import LeaveRequest from '../models/LeaveRequest';

interface ClockInBody {
  date: string;
  location?: string;
}

interface LeaveRequestBody {
  type: string;
  startDate: string;
  endDate: string;
  reason?: string;
}

const router = express.Router();

// Clock In
router.post('/clock-in', protect, async (req: AuthRequest<{}, {}, ClockInBody>, res) => {
  const { date, location } = req.body;
  const existing = await Timesheet.findOne({ employeeId: req.user?._id, date: new Date(date), clockOut: null });
  if (existing) return res.status(400).json({ message: 'Already clocked in' });
  const timesheet = new Timesheet({ 
    employeeId: req.user?._id, 
    date: new Date(date), 
    clockIn: new Date(), 
    location 
  });
  await timesheet.save();
  res.json(timesheet);
});

// Clock Out
router.post('/clock-out', protect, async (req: AuthRequest, res) => {
  const timesheet = await Timesheet.findOne({ employeeId: req.user?._id, clockOut: null });
  if (!timesheet) return res.status(400).json({ message: 'No active clock-in' });
  timesheet.clockOut = new Date();
  const hours = (timesheet.clockOut.getTime() - timesheet.clockIn!.getTime()) / (1000 * 60 * 60);
  timesheet.totalHours = Math.round(hours * 100) / 100;
  timesheet.overtimeHours = hours > 8 ? hours - 8 : 0;
  await timesheet.save();
  res.json(timesheet);
});

// View Timesheets
router.get('/timesheets', protect, async (req: AuthRequest, res) => {
  const timesheets = await Timesheet.find({ employeeId: req.user?._id }).sort({ date: -1 });
  res.json(timesheets);
});

// Request Time Off
router.post('/leave-request', protect, async (req: AuthRequest<{}, {}, LeaveRequestBody>, res) => {
  const leaveRequest = new LeaveRequest({ 
    ...req.body, 
    employeeId: req.user?._id,
    startDate: new Date(req.body.startDate),
    endDate: new Date(req.body.endDate)
  });
  await leaveRequest.save();
  res.json(leaveRequest);
});

export default router;