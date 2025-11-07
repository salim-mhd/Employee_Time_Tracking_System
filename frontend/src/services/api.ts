import axios, { AxiosInstance } from 'axios';

const API: AxiosInstance = axios.create({ 
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5001/api' 
});

API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) req.headers.Authorization = `Bearer ${token}`;
  return req;
});

// Types
export interface User {
  id: string;
  name: string;
  role: 'employee' | 'manager' | 'hr';
}

export interface LoginData {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface Timesheet {
  _id: string;
  date: string;
  clockIn?: string;
  clockOut?: string;
  totalHours: number;
  overtimeHours?: number;
  status: 'pending' | 'approved' | 'rejected';
  location?: string;
  employeeId?: string | { _id: string; name: string; email?: string };
}

export interface LeaveRequest {
  _id: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  employeeId?: string | { _id: string; name: string; email?: string };
}

// APIs
export const authAPI = {
  login: (data: LoginData) => API.post<LoginResponse>('/auth/login', data),
  getMe: () => API.get<User>('/auth/me')
};

export const employeeAPI = {
  clockIn: (data: { date: string; location?: string }) => API.post<Timesheet>('/employee/clock-in', data),
  clockOut: () => API.post<Timesheet>('/employee/clock-out'),
  getTimesheets: () => API.get<Timesheet[]>('/employee/timesheets'),
  requestLeave: (data: { type: string; startDate: string; endDate: string; reason?: string }) => API.post<LeaveRequest>('/employee/leave-request', data)
};

// Similar for managerAPI, hrAPI...
export const managerAPI = {
  createEmployee: (data: CreateEmployeeData) => API.post<User>('/manager/employees', data),
  getTeam: () => API.get<any[]>('/manager/team'),
  getAvailableEmployees: () => API.get<any[]>('/manager/available-employees'),
  addEmployeeToTeam: (employeeId: string) => API.put(`/manager/team/${employeeId}/add`),
  removeEmployeeFromTeam: (employeeId: string) => API.put(`/manager/team/${employeeId}/remove`),
  approveTimesheet: (id: string, approved: boolean) => API.put(`/manager/timesheets/${id}/approve`, { approved }),
  getTeamTimesheets: () => API.get<Timesheet[]>('/manager/team-timesheets'),
  getTeamSchedules: () => API.get<LeaveRequest[]>('/manager/team-schedules'),
  approveLeave: (id: string, approved: boolean) => API.put(`/manager/leaves/${id}/approve`, { approved }),
};

export interface CreateEmployeeData {
  name: string;
  email: string;
  password: string;
  role: 'employee' | 'manager' | 'hr';
  hourlyWage: number;
}

export interface ProcessPayrollData {
  employeeId: string;
  period: string;
}

export interface Payroll {
  _id: string;
  employeeId: string | { _id: string; name: string; email: string };
  period: string;
  basePay: number;
  overtimePay: number;
  deductions: number;
  totalPay: number;
  status: string;
  createdAt?: string;
}

export interface PendingRequest {
  leaveRequests: LeaveRequest[];
  timesheets: Timesheet[];
}

export const hrAPI = {
  createEmployee: (data: CreateEmployeeData) => API.post<User>('/hr/employees', data),
  getEmployees: () => API.get('/hr/employees'),
  updateEmployee: (id: string, data: { name?: string; email?: string; hourlyWage?: number; password?: string }) => API.put<User>(`/hr/employees/${id}`, data),
  getStats: () => API.get('/hr/stats'),
  getPendingRequests: () => API.get<PendingRequest>('/hr/pending-requests'),
  getPayrolls: () => API.get<Payroll[]>('/hr/payrolls'),
  processPayroll: (data: ProcessPayrollData) => API.post('/hr/payroll', data),
  approveLeave: (id: string, approved: boolean) => API.put(`/hr/leaves/${id}/approve`, { approved }),
  approveTimesheet: (id: string, approved: boolean) => API.put(`/hr/timesheets/${id}/approve`, { approved }),
  getPayrollReport: (period: string) => API.get(`/hr/reports/payroll?period=${period}`),
  getAttendanceReport: (employeeId: string) => API.get(`/hr/reports/attendance?employeeId=${employeeId}`),
  getLeavesReport: () => API.get('/hr/reports/leaves'),
};