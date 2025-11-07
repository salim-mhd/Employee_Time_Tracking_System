import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import pendingRequestsReducer from './slices/pendingRequestsSlice';
import reportsReducer from './slices/reportsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    pendingRequests: pendingRequestsReducer,
    reports: reportsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

