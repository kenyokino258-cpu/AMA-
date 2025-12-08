
import { createClient } from '@supabase/supabase-js';
import { Employee, AttendanceRecord } from '../types';

// Initialize Supabase Client directly to avoid import resolution issues
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';
export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper to map DB snake_case to App camelCase
const mapEmployeeFromDB = (data: any): Employee => ({
  id: data.id,
  employeeCode: data.employee_code,
  name: data.name,
  nationalId: data.national_id,
  jobTitle: data.job_title,
  department: data.department,
  joinDate: data.join_date,
  salary: data.salary,
  status: data.status,
  avatar: data.avatar,
  contractType: data.contract_type,
  shiftId: data.shift_id,
  managerId: data.manager_id,
  email: data.email,
  phone: data.phone,
  address: data.address,
  gender: data.gender,
  birthDate: data.birth_date,
  maritalStatus: data.marital_status,
  // Extras
  contractStartDate: data.contract_start_date,
  contractEndDate: data.contract_end_date,
  endOfServiceDate: data.end_of_service_date,
  isDriver: data.is_driver,
  driverLicenseNumber: data.driver_license_number,
  driverLicenseExpiry: data.driver_license_expiry,
  // Derived or Join fields (Handling simply for now)
  shiftName: '' // Needs join with shifts table
});

const mapEmployeeToDB = (emp: Partial<Employee>) => ({
  id: emp.id,
  employee_code: emp.employeeCode,
  name: emp.name,
  national_id: emp.nationalId,
  job_title: emp.jobTitle,
  department: emp.department,
  join_date: emp.joinDate,
  salary: emp.salary,
  status: emp.status,
  avatar: emp.avatar,
  contract_type: emp.contractType,
  shift_id: emp.shiftId,
  manager_id: emp.managerId,
  email: emp.email,
  phone: emp.phone,
  address: emp.address,
  gender: emp.gender,
  birth_date: emp.birthDate,
  marital_status: emp.maritalStatus,
  contract_start_date: emp.contractStartDate,
  contract_end_date: emp.contractEndDate,
  end_of_service_date: emp.endOfServiceDate,
  is_driver: emp.isDriver,
  driver_license_number: emp.driverLicenseNumber,
  driver_license_expiry: emp.driverLicenseExpiry
});

export const api = {
  // Check Supabase Connection
  checkHealth: async () => {
    try {
      // Try Supabase first
      const { error } = await supabase.from('employees').select('id').limit(1);
      if (!error) return { status: 'ok' };
      
      // Fallback to local server check
      const res = await fetch('http://localhost:5000/api/health');
      if (res.ok) return { status: 'ok' };
      
      throw new Error("No backend connection");
    } catch (e) {
      console.error("Connection check failed", e);
      throw e;
    }
  },

  // --- Employees ---
  getEmployees: async () => {
    const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data.map(mapEmployeeFromDB);
  },
  
  saveEmployee: async (employee: Employee) => {
    const dbPayload = mapEmployeeToDB(employee);
    // Upsert works for both insert (if id new) and update (if id exists)
    const { data, error } = await supabase.from('employees').upsert(dbPayload).select();
    if (error) throw error;
    return mapEmployeeFromDB(data[0]);
  },

  deleteEmployee: async (id: string) => {
    const { error } = await supabase.from('employees').delete().match({ id });
    if (error) throw error;
    return { success: true };
  },

  // --- Attendance ---
  getAttendance: async (date?: string) => {
    let query = supabase.from('attendance').select('*');
    if (date) query = query.eq('date', date);
    
    const { data, error } = await query;
    if (error) throw error;

    return data.map((r: any) => ({
       id: r.id,
       employeeId: r.employee_id,
       date: r.date,
       checkIn: r.check_in,
       checkOut: r.check_out,
       status: r.status,
       source: r.source,
       workHours: r.work_hours,
       // In a full implementation, we would join with employees table to get these
       employeeName: 'Loading...', 
       employeeCode: '' 
    }));
  },
  
  saveAttendanceBatch: async (records: AttendanceRecord[]) => {
    const dbRecords = records.map(r => ({
        id: r.id,
        employee_id: r.employeeId,
        date: r.date,
        check_in: r.checkIn,
        check_out: r.checkOut,
        status: r.status,
        source: r.source,
        work_hours: r.workHours
    }));
    const { error } = await supabase.from('attendance').upsert(dbRecords);
    if (error) throw error;
    return { success: true };
  },

  syncAttendance: async (deviceIp: string, devicePort: string, deviceType: string, date: string) => {
     try {
       // Attempt to call the local backend server (server.js)
       const response = await fetch('http://localhost:5000/api/attendance/sync', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ ip: deviceIp, port: devicePort, type: deviceType, date })
       });

       if (response.ok) {
         const result = await response.json();
         // Ensure data property exists
         return { success: true, data: result.data || [], message: 'Sync successful' };
       }
     } catch (e) {
       console.warn("Backend server sync failed", e);
     }

     // Hardware sync requires an Edge Function or Node.js middleware.
     // Browser cannot connect to TCP devices directly.
     console.warn("Direct device sync requires backend middleware.");
     return { success: false, message: 'Hardware sync requires backend middleware', data: [] };
  },

  // --- Other Services (Mock placeholders for now) ---
  getVehiclesLocation: async () => ({}),
  scanForDevices: async () => ({ success: false, devices: [] }),
  getGpsHistory: async (deviceId: string) => ([]),
};
