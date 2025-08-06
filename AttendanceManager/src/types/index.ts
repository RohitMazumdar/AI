export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'employee';
  profileImage?: string;
  createdAt: string;
}

export interface Organization {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  radius: number; // in meters
  workingHours: {
    start: string;
    end: string;
  };
  workingDays: number[]; // 0-6, Sunday to Saturday
  createdAt: string;
}

export interface Employee {
  id: string;
  organizationId: string;
  email: string;
  name: string;
  employeeId: string;
  department: string;
  position: string;
  profileImage?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  organizationId: string;
  date: string; // YYYY-MM-DD
  checkIn?: {
    time: string;
    latitude: number;
    longitude: number;
    photo?: string;
  };
  checkOut?: {
    time: string;
    latitude: number;
    longitude: number;
    photo?: string;
  };
  status: 'present' | 'absent' | 'late' | 'partial';
  workingHours?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  organizationId: string;
  startDate: string;
  endDate: string;
  type: 'sick' | 'vacation' | 'personal' | 'other';
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface AttendanceStats {
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  attendanceRate: number;
  averageWorkingHours: number;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Dashboard: undefined;
  MarkAttendance: undefined;
  AttendanceHistory: undefined;
  Employees: undefined;
  AddEmployee: undefined;
  EditEmployee: { employeeId: string };
  Reports: undefined;
  Settings: undefined;
  Profile: undefined;
  Organization: undefined;
};

export type TabParamList = {
  Dashboard: undefined;
  Attendance: undefined;
  Employees: undefined;
  Reports: undefined;
  Settings: undefined;
};