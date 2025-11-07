import React, { useState, useEffect } from 'react';
import { employeeAPI } from '../../services/api';

type ClockStatus = 'idle' | 'clocked-in' | 'clocked-out';

const ClockInOut: React.FC = () => {
  const [status, setStatus] = useState<ClockStatus>('idle');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    employeeAPI.getTimesheets()
      .then(res => {
        const active = res.data.find(ts => !ts.clockOut);
        if (active) setStatus('clocked-in');
        else setStatus('clocked-out');
      })
      .catch(err => {
        console.error('Error fetching timesheets:', err);
        setStatus('idle');
      });
  }, []);

  const getLocation = (): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by your browser'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        pos => {
          resolve(`${pos.coords.latitude},${pos.coords.longitude}`);
        },
        err => {
          reject(err);
        }
      );
    });
  };

  const handleClockIn = async (): Promise<void> => {
    setLoading(true);
    try {
      let location: string | undefined;
      try {
        location = await getLocation();
      } catch (err) {
        console.warn('Could not get location:', err);
      }
      await employeeAPI.clockIn({ 
        date: new Date().toISOString().split('T')[0], 
        location 
      });
      setStatus('clocked-in');
    } catch (err) {
      console.error('Error clocking in:', err);
      alert('Failed to clock in. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await employeeAPI.clockOut();
      setStatus('clocked-out');
    } catch (err) {
      console.error('Error clocking out:', err);
      alert('Failed to clock out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow">
      <div className="flex items-center mb-4">
        <div className={`p-3 rounded-lg ${status === 'clocked-in' ? 'bg-green-100' : 'bg-gray-100'}`}>
          <svg className={`w-6 h-6 ${status === 'clocked-in' ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-semibold text-gray-900">Clock In/Out</h3>
          <p className="text-sm text-gray-500">
            {status === 'clocked-in' ? 'Currently clocked in' : status === 'clocked-out' ? 'Ready to clock in' : 'Checking status...'}
          </p>
        </div>
      </div>
      
      {status === 'idle' || status === 'clocked-out' ? (
        <button 
          onClick={handleClockIn}
          disabled={loading}
          className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg hover:from-green-600 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Clocking in...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Clock In
            </>
          )}
        </button>
      ) : (
        <button 
          onClick={handleClockOut}
          disabled={loading}
          className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-medium rounded-lg hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
        >
          {loading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Clocking out...
            </>
          ) : (
            <>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clock Out
            </>
          )}
        </button>
      )}
    </div>
  );
};

export default ClockInOut;
