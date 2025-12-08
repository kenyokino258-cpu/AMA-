
export type Language = 'ar' | 'en';
export type ThemeColor = 'indigo' | 'emerald' | 'violet' | 'rose' | 'amber' | 'slate';

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

// --- Master Data Definitions ---
export interface PublicHoliday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
}

export interface SystemDefinition {
  id: string;
  name: string;
  type: 'job_title' | 'asset_type' | 'document_type';
}

// --- Performance Module ---
export interface KPI {
  id: string;
  name: string;
  targetValue: number;
  actualValue: number;
  weight: number; 
  score: number; 
  unit: string; 
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string; 
  kpis: KPI[];
  totalScore: number;
  status: 'draft' | 'submitted' | 'approved';
  feedback?: string;
  evaluationDate: string;
}

// --- Payroll Config ---
export interface PayrollConfig {
  taxPercentage: number;
  insuranceCompanyPercentage: number;
  insuranceEmployeePercentage: number;
  housingAllowancePercentage: number;
  transportAllowancePercentage: number;
}

export interface RoleDefinition {
  id: string;
  name: string; 
  isSystem?: boolean; 
  permissions: string[]; 
}

export interface SystemUser {
  id: string;
  username: string;
  fullName: string;
  role: string; 
  email: string;
  active: boolean;
  lastLogin: string;
  permissions?: string[];
  linkedEmployeeId?: string; 
}

export interface SystemDatabase {
  id: string;
  name: string;
  companyName: string;
  status: 'active' | 'archived';
  createdAt: string;
  usersCount: number;
}

// --- Shift Management ---
export interface Shift {
  id: string;
  name: string;
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  days: string[];    // Array of days e.g. ['Sunday', 'Monday']
}

// --- Master Data Extended Types ---
export interface CustodyItem {
  id: string;
  name: string; 
  type: string; // Laptop, Mobile, etc.
  serialNumber?: string;
  receivedDate: string;
  status: 'Active' | 'Returned' | 'Lost';
  returnedDate?: string;
  cost?: number;
  notes?: string;
}

export interface Dependent {
  id: string;
  name: string;
  relation: string; // Wife, Son, Daughter
  birthDate: string;
  nationalId?: string;
  isInsured?: boolean;
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
  shiftId?: string; // Link to Shift
  shiftName?: string; // Denormalized for display
  managerId?: string; // Link to another Employee (Direct Manager)
  
  // Extended Master Data
  email?: string;
  phone?: string;
  address?: string;
  gender?: 'male' | 'female';
  birthDate?: string;
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';

  // Master Data - Assets & Family
  custody?: CustodyItem[];
  dependents?: Dependent[];

  // Transport Integration
  isDriver?: boolean;
  driverLicenseNumber?: string;
  driverLicenseExpiry?: string;
  
  certificates?: { 
    id: string;
    name: string; 
    date: string; 
    fileName?: string;
    fileUrl?: string; 
  }[];
  documents?: {
    id: string;
    name: string;
    type: string;
    category?: string; // Document Type (e.g. ID, Contract)
    size: string;
    date: string;
    fileUrl?: string;
  }[];
  contractFile?: {
    fileName: string;
    fileUrl: string;
  };
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
  employeeCode?: string;
  source?: 'Fingerprint' | 'Manual' | 'Mobile';
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
  rating: number; 
  email?: string;
  phone?: string;
  appliedDate?: string;
}

export interface MenuItem {
  id: string;
  label: string;
  icon: any;
  path: string;
}

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
  status: 'approved' | 'pending' | 'rejected' | 'reviewed';
  reviewedBy?: string;
  approvedBy?: string;
  rejectionReason?: string;
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
  status: 'paid' | 'pending' | 'reviewed';
  auditedBy?: string;   
  approvedBy?: string;  
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
  requestStatus?: 'pending' | 'approved' | 'rejected' | 'reviewed';
  reviewedBy?: string;
  approvedBy?: string;
}

export interface GpsLocation {
  lat: number;
  lng: number;
  heading: number; 
  lastUpdate: string;
  speed: number;
  address?: string;
  fuelLevel?: number;
  ignition?: 'on' | 'off';
  batteryVoltage?: number;
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
  invoiceUrl?: string;
  status: 'pending' | 'reviewed' | 'approved' | 'rejected';
  createdBy?: string;
  reviewedBy?: string;
  approvedBy?: string;
}

export interface Notification {
  id: number;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

export interface AppContextType {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  isPaidVersion: boolean;
  isExpired: boolean; 
  trialDaysLeft: number;
  notifications: Notification[];
  addNotification: (title: string, desc: string) => void;
  handleLogout: () => void;
  currentUser: SystemUser | null;
  isServerOnline: boolean;
  
  // Theme & Language
  language: Language;
  setLanguage: (lang: Language) => void;
  themeColor: ThemeColor;
  setThemeColor: (color: ThemeColor) => void;
  themeMode: 'light' | 'dark';
  setThemeMode: (mode: 'light' | 'dark') => void;
  t: (key: string) => string;
}
