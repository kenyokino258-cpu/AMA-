
import { Employee, EmploymentType, Candidate, ApplicationStatus, AttendanceRecord, Contract, ContractHistory, InsuranceRecord, LeaveRequest, PayrollRecord, LoanRecord, LeaveBalance, SystemUser, UserRole, SystemDatabase, Vehicle, Driver, Trip, MaintenanceLog, BiometricDevice } from './types';

export const MOCK_USERS: SystemUser[] = [
  { id: 'U1', username: 'admin', fullName: 'مدير النظام', role: UserRole.ADMIN, email: 'admin@company.com', active: true, lastLogin: '2023-10-25 09:00' },
  { id: 'U2', username: 'hr_manager', fullName: 'سارة يوسف', role: UserRole.HR_MANAGER, email: 'sara@company.com', active: true, lastLogin: '2023-10-25 08:30' },
  { id: 'U3', username: 'acc_payroll', fullName: 'محمد حسن', role: UserRole.PAYROLL, email: 'mohamed@company.com', active: true, lastLogin: '2023-10-24 16:00' },
  { id: 'U4', username: 'viewer', fullName: 'مراقب خارجي', role: UserRole.VIEWER, email: 'audit@external.com', active: false, lastLogin: '2023-10-01 10:00' },
];

export const MOCK_DATABASES: SystemDatabase[] = [
  { id: 'DB1', name: 'hr_main_db', companyName: 'الشركة الرئيسية', status: 'active', createdAt: '2022-01-01', usersCount: 15 },
  { id: 'DB2', name: 'hr_branch_alex', companyName: 'فرع الإسكندرية', status: 'active', createdAt: '2023-05-15', usersCount: 5 },
  { id: 'DB3', name: 'hr_archive_2021', companyName: 'أرشيف 2021', status: 'archived', createdAt: '2021-01-01', usersCount: 0 },
];

export const MOCK_EMPLOYEES: Employee[] = [
  {
    id: 'E001',
    employeeCode: 'EMP-1001',
    name: 'أحمد محمد علي',
    nationalId: '29010101234567',
    jobTitle: 'مهندس برمجيات',
    department: 'تكنولوجيا المعلومات',
    joinDate: '2022-03-15',
    salary: 15000,
    status: 'active',
    avatar: 'https://picsum.photos/id/1005/100/100',
    contractType: EmploymentType.FULL_TIME,
    contractStartDate: '2023-01-01',
    contractEndDate: '2024-01-01',
  },
  {
    id: 'E002',
    employeeCode: 'EMP-1002',
    name: 'سارة يوسف',
    nationalId: '29505051234567',
    jobTitle: 'مدير موارد بشرية',
    department: 'الموارد البشرية',
    joinDate: '2021-01-10',
    salary: 18000,
    status: 'active',
    avatar: 'https://picsum.photos/id/1011/100/100',
    contractType: EmploymentType.FULL_TIME,
    contractStartDate: '2021-01-10',
    contractEndDate: '-',
  },
  {
    id: 'E003',
    employeeCode: 'EMP-1003',
    name: 'خالد عمر',
    nationalId: '28809091234567',
    jobTitle: 'محاسب',
    department: 'المالية',
    joinDate: '2023-06-01',
    salary: 9000,
    status: 'on_leave',
    avatar: 'https://picsum.photos/id/1025/100/100',
    contractType: EmploymentType.CONTRACT,
    contractStartDate: '2023-06-01',
    contractEndDate: '2023-12-31',
  },
  {
    id: 'E004',
    employeeCode: 'EMP-1004',
    name: 'منى كامل',
    nationalId: '29212121234567',
    jobTitle: 'أخصائي تسويق',
    department: 'التسويق',
    joinDate: '2023-02-20',
    salary: 11000,
    status: 'active',
    avatar: 'https://picsum.photos/id/1027/100/100',
    contractType: EmploymentType.FULL_TIME,
    contractStartDate: '2023-02-20',
    contractEndDate: '2024-02-20',
  },
  {
    id: 'E005',
    employeeCode: 'EMP-1005',
    name: 'سعيد الصاوي',
    nationalId: '28501011234567',
    jobTitle: 'سائق',
    department: 'النقل والحركة',
    joinDate: '2020-01-01',
    salary: 6000,
    status: 'active',
    avatar: 'https://picsum.photos/id/1060/100/100',
    contractType: EmploymentType.FULL_TIME,
    contractStartDate: '2023-01-01',
    contractEndDate: '2024-01-01',
    isDriver: true,
    driverLicenseNumber: 'DL-885522',
    driverLicenseExpiry: '2026-05-20'
  },
];

export const MOCK_CANDIDATES: Candidate[] = [
  { id: 'C01', name: 'ياسر جلال', position: 'مصمم جرافيك', experience: '3 سنوات', status: ApplicationStatus.APPLIED, rating: 0 },
  { id: 'C02', name: 'هدى حسين', position: 'محاسب', experience: '5 سنوات', status: ApplicationStatus.INTERVIEW, rating: 4 },
  { id: 'C03', name: 'رامي سعيد', position: 'مهندس برمجيات', experience: 'سنتين', status: ApplicationStatus.OFFER, rating: 5 },
  { id: 'C04', name: 'نور الشريف', position: 'مدير مبيعات', experience: '10 سنوات', status: ApplicationStatus.SCREENING, rating: 3 },
];

export const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'A01', employeeId: 'E001', employeeName: 'أحمد محمد علي', date: '2023-10-25', checkIn: '08:00', checkOut: '16:00', status: 'present', workHours: 8, source: 'Fingerprint' },
  { id: 'A02', employeeId: 'E002', employeeName: 'سارة يوسف', date: '2023-10-25', checkIn: '08:15', checkOut: '16:15', status: 'present', workHours: 8, source: 'Fingerprint' },
  { id: 'A03', employeeId: 'E003', employeeName: 'خالد عمر', date: '2023-10-25', checkIn: '-', checkOut: '-', status: 'absent', workHours: 0, source: 'Manual' },
  { id: 'A04', employeeId: 'E004', employeeName: 'منى كامل', date: '2023-10-25', checkIn: '09:30', checkOut: '16:00', status: 'late', workHours: 6.5, source: 'Fingerprint' },
];

export const MOCK_DEVICES: BiometricDevice[] = [
  { id: 'DEV1', name: 'المدخل الرئيسي', ip: '192.168.1.201', port: '4370', type: 'ZK', location: 'الاستقبال', status: 'online', lastSync: '2023-10-25 08:05' },
  { id: 'DEV2', name: 'بوابة المصنع', ip: '192.168.1.202', port: '4370', type: 'Timy', location: 'المصنع', status: 'online', lastSync: '2023-10-25 08:00' },
  { id: 'DEV3', name: 'بوابة الإدارة', ip: '192.168.1.203', port: '5005', type: 'ZK', location: 'الدور الثاني', status: 'offline', lastSync: '2023-10-24 17:00' },
];

export const MOCK_CONTRACTS: Contract[] = [
  { id: 'CN01', employeeName: 'أحمد محمد علي', type: 'محدد المدة', startDate: '2023-01-01', endDate: '2024-01-01', status: 'expiring' },
  { id: 'CN02', employeeName: 'سارة يوسف', type: 'غير محدد المدة', startDate: '2021-01-10', endDate: '-', status: 'active' },
  { id: 'CN03', employeeName: 'خالد عمر', type: 'عمل مؤقت', startDate: '2023-06-01', endDate: '2023-12-31', status: 'active' },
];

export const MOCK_CONTRACT_HISTORY: ContractHistory[] = [
  { id: 'CH01', contractId: 'CN01', type: 'تجديد', details: 'تجديد العقد لمدة سنة', date: '2023-01-01', changedBy: 'Admin System' },
  { id: 'CH02', contractId: 'CN01', type: 'تعديل مسمى', details: 'تغيير المسمى الوظيفي إلى مهندس أول', date: '2023-06-01', changedBy: 'HR Manager' }
];

export const MOCK_INSURANCE: InsuranceRecord[] = [
  { id: 'INS01', employeeName: 'أحمد محمد علي', insuranceNumber: '11223344', salaryInsured: 5000, companyShare: 900, employeeShare: 550, status: 'active' },
  { id: 'INS02', employeeName: 'سارة يوسف', insuranceNumber: '55667788', salaryInsured: 6500, companyShare: 1170, employeeShare: 715, status: 'active' },
];

export const MOCK_LEAVES: LeaveRequest[] = [
  { id: 'L01', employeeName: 'خالد عمر', type: 'سنوي', startDate: '2023-11-01', endDate: '2023-11-05', days: 5, status: 'approved' },
  { id: 'L02', employeeName: 'منى كامل', type: 'مرضي', startDate: '2023-10-20', endDate: '2023-10-21', days: 2, status: 'pending' },
];

export const MOCK_LEAVE_BALANCES: LeaveBalance[] = [
  { employeeId: 'E001', employeeName: 'أحمد محمد علي', annualTotal: 21, annualUsed: 5, sickTotal: 10, sickUsed: 0, casualTotal: 7, casualUsed: 2 },
  { employeeId: 'E002', employeeName: 'سارة يوسف', annualTotal: 30, annualUsed: 12, sickTotal: 10, sickUsed: 1, casualTotal: 7, casualUsed: 0 },
  { employeeId: 'E003', employeeName: 'خالد عمر', annualTotal: 21, annualUsed: 20, sickTotal: 10, sickUsed: 3, casualTotal: 7, casualUsed: 5 },
  { employeeId: 'E004', employeeName: 'منى كامل', annualTotal: 21, annualUsed: 2, sickTotal: 10, sickUsed: 2, casualTotal: 7, casualUsed: 0 },
];

export const MOCK_PAYROLL: PayrollRecord[] = [
  { 
    id: 'P01', 
    employeeName: 'أحمد محمد علي', 
    basicSalary: 15000, 
    allowances: 2000, 
    transportAllowance: 0,
    incentives: 1500,
    deductions: 500, 
    netSalary: 18000, 
    paymentDate: '2023-10-30', 
    status: 'paid' 
  },
  { 
    id: 'P02', 
    employeeName: 'خالد عمر', 
    basicSalary: 9000, 
    allowances: 500, 
    transportAllowance: 0,
    incentives: 0,
    deductions: 0, 
    netSalary: 9500, 
    paymentDate: '2023-10-30', 
    status: 'pending' 
  },
  { 
    id: 'P03', 
    employeeName: 'سعيد الصاوي', 
    basicSalary: 6000, 
    allowances: 0, 
    transportAllowance: 1500, 
    incentives: 200,
    deductions: 0, 
    netSalary: 7700, 
    paymentDate: '2023-10-30', 
    status: 'pending' 
  },
];

export const MOCK_LOANS: LoanRecord[] = [
  { 
    id: 'LN01', employeeName: 'خالد عمر', type: 'سلفة', amount: 5000, date: '2023-08-15', 
    remainingAmount: 2000, status: 'active', requestStatus: 'approved', installments: 5, reason: 'زواج', approvedBy: 'Admin' 
  },
  { 
    id: 'LN02', employeeName: 'منى كامل', type: 'جزاء', amount: 200, date: '2023-09-10', 
    remainingAmount: 0, status: 'completed', requestStatus: 'approved', reason: 'تأخير متكرر', approvedBy: 'Admin' 
  },
  { 
    id: 'LN03', employeeName: 'أحمد محمد علي', type: 'سلفة', amount: 3000, date: '2023-10-26', 
    remainingAmount: 3000, status: 'pending', requestStatus: 'pending', installments: 3, reason: 'ظروف طارئة' 
  },
  { 
    id: 'LN04', employeeName: 'سارة يوسف', type: 'جزاء', amount: 150, date: '2023-10-27', 
    remainingAmount: 150, status: 'pending', requestStatus: 'pending', reason: 'عدم الالتزام بالزي' 
  }
];

// --- Transport Mock Data ---

export const MOCK_VEHICLES: Vehicle[] = [
  { 
    id: 'V01', 
    plateNumber: 'أ ب ج 123', 
    type: 'سيارة', 
    model: 'تويوتا كورولا 2022', 
    status: 'active', 
    licenseExpiry: '2025-01-01', 
    currentOdometer: 25000,
    gps: { lat: 30.0444, lng: 31.2357, lastUpdate: 'الآن', speed: 45, address: 'وسط البلد، القاهرة' } 
  },
  { 
    id: 'V02', 
    plateNumber: 'س ص ع 456', 
    type: 'باص', 
    model: 'ميتسوبيشي روزا 2020', 
    status: 'maintenance', 
    licenseExpiry: '2024-12-15', 
    currentOdometer: 150000,
    gps: { lat: 30.0131, lng: 31.2089, lastUpdate: 'منذ 5 دقائق', speed: 0, address: 'الجيزة، الورشة المركزية' }
  },
  { 
    id: 'V03', 
    plateNumber: 'د هـ و 789', 
    type: 'شاحنة', 
    model: 'مرسيدس اكتروس', 
    status: 'active', 
    licenseExpiry: '2025-06-30', 
    currentOdometer: 340000,
    gps: { lat: 31.2001, lng: 29.9187, lastUpdate: 'الآن', speed: 80, address: 'طريق الإسكندرية الصحراوي' }
  },
];

export const MOCK_DRIVERS: Driver[] = [
  { id: 'D01', employeeId: 'E005', employeeName: 'سعيد الصاوي', licenseNumber: 'DL-885522', licenseType: 'درجة أولى', licenseExpiry: '2026-05-20', status: 'active' },
];

export const MOCK_TRIPS: Trip[] = [
  { id: 'T01', date: '2023-10-25', vehicleId: 'V01', plateNumber: 'أ ب ج 123', driverId: 'D01', driverName: 'سعيد الصاوي', startOdometer: 25000, endOdometer: 25150, distance: 150, route: 'القاهرة - الإسكندرية', status: 'completed' },
];

export const MOCK_MAINTENANCE: MaintenanceLog[] = [
  { id: 'M01', vehicleId: 'V02', plateNumber: 'س ص ع 456', date: '2023-10-20', description: 'تغيير زيت وفلاتر', cost: 1500, type: 'تغيير زيت' },
];

export const DEPARTMENTS = ['الموارد البشرية', 'المالية', 'تكنولوجيا المعلومات', 'التسويق', 'المبيعات', 'العمليات', 'النقل والحركة'];
