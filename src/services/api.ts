
// src/services/api.ts
import { Employee, AttendanceRecord } from '../types';

// Get Base URL
export const getBaseUrl = () => {
  // في بيئة الإنتاج، نستخدم مسار نسبي ليتم الاتصال بنفس الدومين/السيرفر
  // مثلا لو السيرفر 192.168.1.50، الطلب يروح لـ 192.168.1.50/api تلقائياً
  if (process.env.NODE_ENV === 'production' || window.location.port === '5000') {
      return '/api';
  }
  // في بيئة التطوير
  const savedUrl = localStorage.getItem('server_url');
  return savedUrl ? savedUrl.replace(/\/$/, '') : 'http://localhost:5000/api';
};

// Helper function for requests
const request = async (endpoint: string, options: RequestInit = {}) => {
  const baseUrl = getBaseUrl();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
    
    const response = await fetch(`${baseUrl}${endpoint}`, {
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || response.statusText);
    }

    return await response.json();
  } catch (error: any) {
    if (endpoint !== '/health') {
        console.warn(`Backend request failed for ${endpoint}:`, error);
    }
    throw error;
  }
};

export const api = {
  // System Health
  checkHealth: () => request('/health'),

  // --- Employees ---
  getEmployees: () => request('/employees'),
  
  saveEmployee: (employee: Employee) => request('/employees', {
      method: 'POST',
      body: JSON.stringify(employee)
  }),

  deleteEmployee: (id: string) => request(`/employees/${id}`, {
      method: 'DELETE'
  }),

  // --- Attendance ---
  getAttendance: (date?: string) => request(`/attendance${date ? `?date=${date}` : ''}`),
  
  saveAttendanceBatch: (records: AttendanceRecord[]) => request('/attendance/batch', {
      method: 'POST',
      body: JSON.stringify(records)
  }),

  // Sync Attendance from Device
  syncAttendance: (deviceIp: string, devicePort: string, deviceType: string, date: string) => 
    request('/attendance/sync', {
      method: 'POST',
      body: JSON.stringify({ ip: deviceIp, port: devicePort, type: deviceType, date: date }),
    }),

  // --- Network/GPS ---
  getVehiclesLocation: () => request('/transport/vehicles'),
  scanForDevices: () => request('/network/scan'),
};
