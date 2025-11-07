import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { hrAPI, LeaveRequest, Timesheet } from '../../services/api';

interface PendingRequestsState {
  leaveRequests: LeaveRequest[];
  timesheets: Timesheet[];
  loading: boolean;
  error: string | null;
  processingId: string | null;
}

const initialState: PendingRequestsState = {
  leaveRequests: [],
  timesheets: [],
  loading: false,
  error: null,
  processingId: null,
};

// Async thunk for fetching pending requests
export const fetchPendingRequests = createAsyncThunk(
  'pendingRequests/fetchPendingRequests',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await hrAPI.getPendingRequests();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch pending requests');
    }
  }
);

// Async thunk for approving/rejecting leave request
export const approveLeaveRequest = createAsyncThunk(
  'pendingRequests/approveLeaveRequest',
  async ({ id, approved }: { id: string; approved: boolean }, { rejectWithValue, dispatch }) => {
    try {
      await hrAPI.approveLeave(id, approved);
      // Refresh pending requests after approval
      await dispatch(fetchPendingRequests());
      return { id, approved };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update leave request');
    }
  }
);

// Async thunk for approving/rejecting timesheet
export const approveTimesheet = createAsyncThunk(
  'pendingRequests/approveTimesheet',
  async ({ id, approved }: { id: string; approved: boolean }, { rejectWithValue, dispatch }) => {
    try {
      await hrAPI.approveTimesheet(id, approved);
      // Refresh pending requests after approval
      await dispatch(fetchPendingRequests());
      return { id, approved };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update timesheet');
    }
  }
);

const pendingRequestsSlice = createSlice({
  name: 'pendingRequests',
  initialState,
  reducers: {
    setProcessingId: (state, action: PayloadAction<string | null>) => {
      state.processingId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch pending requests
    builder
      .addCase(fetchPendingRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPendingRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.leaveRequests = action.payload.leaveRequests || [];
        state.timesheets = action.payload.timesheets || [];
        state.error = null;
      })
      .addCase(fetchPendingRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Approve/Reject leave request
    builder
      .addCase(approveLeaveRequest.pending, (state, action) => {
        state.processingId = action.meta.arg.id;
        state.error = null;
      })
      .addCase(approveLeaveRequest.fulfilled, (state) => {
        state.processingId = null;
        state.error = null;
      })
      .addCase(approveLeaveRequest.rejected, (state, action) => {
        state.processingId = null;
        state.error = action.payload as string;
      });

    // Approve/Reject timesheet
    builder
      .addCase(approveTimesheet.pending, (state, action) => {
        state.processingId = action.meta.arg.id;
        state.error = null;
      })
      .addCase(approveTimesheet.fulfilled, (state) => {
        state.processingId = null;
        state.error = null;
      })
      .addCase(approveTimesheet.rejected, (state, action) => {
        state.processingId = null;
        state.error = action.payload as string;
      });
  },
});

export const { setProcessingId, clearError } = pendingRequestsSlice.actions;
export default pendingRequestsSlice.reducer;

