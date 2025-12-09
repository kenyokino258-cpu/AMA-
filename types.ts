
export enum EmploymentType {
  FULL_TIME = 'دوام كامل',
  PART_TIME = 'دوام جزئي',
  CONTRACT = 'عقد محدد',
}

export enum ApplicationStatus {
  APPLIED = 'جديد',
  SCREENING = 'فرز',
  INTERVIEW = 'مقابلة',
  OFFER = 'عرض عمل',
  HIRED = 'تم التعيين',
  REJECTED = 'مرفوض',
}

export enum UserRole {
  ADMIN = 'مدير النظام',
  HR_MANAGER = 'مدير موارد بشرية',
  PAYROLL = 'محاسب رواتب',
  EMPLOYEE = 'موظف',
  VIEWER = 'قراءة فقط'
}

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  email: string;
  active: boolean;
  lastLogin: string;
  permissions?: string[];
}

export interface SystemDatabase {
  id: string;
  name: string;
  companyName: string;
  status: 'active' | 'archived';
  createdAt: string;
  usersCount: number;
}

export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  nationalId: string;
  jobTitle: string;
  department: string;
  joinDate: string;
  salary: number;
  status: 'active' | 'inactive' | 'on_leave';
  avatar: string;
  contractType: EmploymentType;
  contractStartDate?: string;
  contractEndDate?: string;
  endOfServiceDate?: string;
  // Transport Integration
  isDriver?: boolean;
  driverLicenseNumber?: string;
  driverLicenseExpiry?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  workHours: number;
  employeeCode?: string; // Optional for display
  source?: 'Fingerprint' | 'Manual' | 'Mobile'; // Track where data came from
}

export interface BiometricDevice {
  id: string;
  name: string;
  ip: string;
  port: string;
  type: 'ZK' | 'Timy' | 'Hikvision' | 'Other';
  location: string;
  status: 'online' | 'offline';
  lastSync: string;
}

export interface Candidate {
  id: string;
  name: string;
  position: string;
  experience: string;
  status: ApplicationStatus;
  rating: number; // 1-5
}

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
}

// New Types
export interface Contract {
  id: string;
  employeeName: string;
  type: 'محدد المدة' | 'غير محدد المدة' | 'عمل مؤقت';
  startDate: string;
  endDate: string;
  status: 'active' | 'expiring' | 'expired';
  fileUrl?: string;
}

export interface ContractHistory {
  id: string;
  contractId: string;
  type: string;
  details: string;
  date: string;
  changedBy: string;
  documentUrl?: string;
}

export interface InsuranceRecord {
  id: string;
  employeeName: string;
  insuranceNumber: string;
  salaryInsured: number;
  companyShare: number;
  employeeShare: number;
  status: 'active' | 'pending';
}

export interface LeaveRequest {
  id: string;
  employeeName: string;
  type: 'سنوي' | 'مرضي' | 'عارضة' | 'بدون راتب';
  startDate: string;
  endDate: string;
  days: number;
  status: 'approved' | 'pending' | 'rejected';
}

export interface LeaveBalance {
  employeeId: string;
  employeeName: string;
  annualTotal: number;
  annualUsed: number;
  sickTotal: number;
  sickUsed: number;
  casualTotal: number;
  casualUsed: number;
}

export interface PayrollRecord {
  id: string;
  employeeName: string;
  basicSalary: number;
  allowances: number;
  transportAllowance: number;
  incentives: number;
  deductions: number;
  netSalary: number;
  paymentDate: string;
  status: 'paid' | 'pending';
}

export interface LoanRecord {
  id: string;
  employeeName: string;
  type: 'سلفة' | 'خصم إداري' | 'جزاء';
  amount: number;
  date: string;
  remainingAmount: number;
  status: 'active' | 'completed' | 'pending';
  installments?: number;
  reason?: string;
  requestStatus?: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

// --- Transport Module Types ---

export interface GpsLocation {
  lat: number;
  lng: number;
  lastUpdate: string;
  speed: number;
  address?: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  type: 'سيارة' | 'شاحنة' | 'باص';
  model: string;
  status: 'active' | 'maintenance' | 'broken';
  licenseExpiry: string;
  currentOdometer: number;
  gps?: GpsLocation;
}

export interface Driver {
  id: string;
  employeeId: string;
  employeeName: string;
  licenseNumber: string;
  licenseType: string;
  licenseExpiry: string;
  status: 'active' | 'suspended';
}

export interface Trip {
  id: string;
  date: string;
  vehicleId: string;
  plateNumber: string;
  driverId: string;
  driverName: string;
  startOdometer: number;
  endOdometer: number;
  distance: number;
  route: string;
  status: 'completed' | 'active';
}

export interface MaintenanceLog {
  id: string;
  vehicleId: string;
  plateNumber: string;
  date: string;
  description: string;
  cost: number;
  type: 'دورية' | 'إصلاح' | 'تغيير زيت';
}