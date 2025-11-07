import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { hrAPI } from '../../services/api';

type ReportType = 'payroll' | 'attendance' | 'leaves';

interface ReportsState {
  reportType: ReportType;
  allData: any[];
  filteredData: any[];
  loading: boolean;
  error: string | null;
  statusFilter: 'all' | 'pending' | 'approved' | 'rejected' | 'processed';
  payrollPeriod: string;
  employeeId: string;
}

const initialState: ReportsState = {
  reportType: 'payroll',
  allData: [],
  filteredData: [],
  loading: false,
  error: null,
  statusFilter: 'all',
  payrollPeriod: '',
  employeeId: '',
};

// Async thunk for fetching payroll report
export const fetchPayrollReport = createAsyncThunk(
  'reports/fetchPayrollReport',
  async (period: string, { rejectWithValue }) => {
    try {
      const { data } = await hrAPI.getPayrollReport(period);
      return { type: 'payroll' as ReportType, data: data || [] };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payroll report');
    }
  }
);

// Async thunk for fetching attendance report
export const fetchAttendanceReport = createAsyncThunk(
  'reports/fetchAttendanceReport',
  async (employeeId: string, { rejectWithValue }) => {
    try {
      const { data } = await hrAPI.getAttendanceReport(employeeId);
      return { type: 'attendance' as ReportType, data: data || [] };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch attendance report');
    }
  }
);

// Async thunk for fetching leaves report
export const fetchLeavesReport = createAsyncThunk(
  'reports/fetchLeavesReport',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await hrAPI.getLeavesReport();
      return { type: 'leaves' as ReportType, data: data || [] };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch leaves report');
    }
  }
);

const reportsSlice = createSlice({
  name: 'reports',
  initialState,
  reducers: {
    setReportType: (state, action: PayloadAction<ReportType>) => {
      state.reportType = action.payload;
      state.statusFilter = 'all';
      state.allData = [];
      state.filteredData = [];
      state.error = null;
    },
    setStatusFilter: (state, action: PayloadAction<'all' | 'pending' | 'approved' | 'rejected' | 'processed'>) => {
      state.statusFilter = action.payload;
      // Filter data based on status
      if (action.payload === 'all') {
        state.filteredData = state.allData;
      } else {
        state.filteredData = state.allData.filter(item => item.status === action.payload);
      }
    },
    setPayrollPeriod: (state, action: PayloadAction<string>) => {
      state.payrollPeriod = action.payload;
    },
    setEmployeeId: (state, action: PayloadAction<string>) => {
      state.employeeId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload;
    },
    clearReports: (state) => {
      state.allData = [];
      state.filteredData = [];
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Payroll Report
    builder
      .addCase(fetchPayrollReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportType = action.payload.type;
        state.allData = action.payload.data;
        // Apply current filter
        if (state.statusFilter === 'all') {
          state.filteredData = action.payload.data;
        } else {
          state.filteredData = action.payload.data.filter((item: any) => item.status === state.statusFilter);
        }
        state.error = null;
      })
      .addCase(fetchPayrollReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.allData = [];
        state.filteredData = [];
      });

    // Fetch Attendance Report
    builder
      .addCase(fetchAttendanceReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportType = action.payload.type;
        state.allData = action.payload.data;
        // Apply current filter
        if (state.statusFilter === 'all') {
          state.filteredData = action.payload.data;
        } else {
          state.filteredData = action.payload.data.filter((item: any) => item.status === state.statusFilter);
        }
        state.error = null;
      })
      .addCase(fetchAttendanceReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.allData = [];
        state.filteredData = [];
      });

    // Fetch Leaves Report
    builder
      .addCase(fetchLeavesReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeavesReport.fulfilled, (state, action) => {
        state.loading = false;
        state.reportType = action.payload.type;
        state.allData = action.payload.data;
        // Apply current filter
        if (state.statusFilter === 'all') {
          state.filteredData = action.payload.data;
        } else {
          state.filteredData = action.payload.data.filter((item: any) => item.status === state.statusFilter);
        }
        state.error = null;
      })
      .addCase(fetchLeavesReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.allData = [];
        state.filteredData = [];
      });
  },
});

export const { 
  setReportType, 
  setStatusFilter, 
  setPayrollPeriod, 
  setEmployeeId, 
  clearError,
  setError,
  clearReports 
} = reportsSlice.actions;

export default reportsSlice.reducer;

