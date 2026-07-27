export type EmployeeStatus = 'نشط' | 'إجازة' | 'موقوف' | 'متقاعد' | 'مستقيل';
export type Gender = 'ذكر' | 'أنثى';
export type MaritalStatus = 'أعزب' | 'متزوج' | 'مطلق' | 'أرمل';
export type SkillLevel = 'مبتدئ' | 'متوسط' | 'متقدم' | 'خبير';

export interface Education {
  id: string;
  degree: string;
  institution: string;
  major: string;
  startDate: string;
  gradDate: string;
  description: string;
}

export interface Experience {
  id: string;
  company: string;
  position: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
  type: string;
  level: SkillLevel;
  percentage: number;
}

export interface Contract {
  id: string;
  contractNo: string;
  type: string;
  startDate: string;
  endDate: string;
  basicSalary: number;
  workingHours: number;
  department: string;
  job: string;
  status: 'ساري' | 'منتهي' | 'ملغى';
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  status: 'سارية' | 'منتهية';
}

export interface Equipment {
  id: string;
  name: string;
  type: string;
  serialNo: string;
  deliveryDate: string;
  status: 'جيد' | 'صيانة' | 'تالف' | 'مفقود';
  notes: string;
}

export interface Document {
  id: string;
  name: string;
  type: string;
  uploadDate: string;
}

export interface AuditLog {
  id: string;
  action: string;
  user: string;
  date: string;
  details: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: string;
  startDate: string;
  endDate: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  reason: string;
}

export interface Employee {
  id: string;
  // Basic Info
  photoUrl?: string;
  fullName: string;
  jobTitle: string;
  company: string;
  tags: string[];
  workEmail: string;
  workPhone: string;
  workMobile: string;
  department: string;
  management: string;
  directManager: string;
  coach: string;

  // Work Info
  workAddress: string;
  workLocation: string; // Branch
  timeOffApprover: string;
  expensesApprover: string;
  timesheetApprover: string;
  workingHours: string;
  timezone: string;
  defaultRole: string;
  additionalRoles: string[];
  remoteWorkType: 'مكتب' | 'منزل' | 'مختلط';
  workSchedule: string;

  // Personal Info
  homeAddress: string;
  personalPhone: string;
  personalEmail: string;
  language: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  dob: string;
  placeOfBirth: string;
  nationality: string;
  childrenCount: number;
  nationalId: string;
  passportNo: string;
  visaNo: string;
  workPermitNo: string;
  visaExpiry: string;
  permitExpiry: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;

  // Collections
  educations: Education[];
  experiences: Experience[];
  skills: Skill[];
  contracts: Contract[];
  certifications: Certification[];
  equipments: Equipment[];
  documents: Document[];
  auditLogs: AuditLog[];

  // System Data
  employeeId: string;
  status: EmployeeStatus;
  linkedUser: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}
