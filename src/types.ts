export type EmployeeStatus = 'نشط' | 'إجازة' | 'موقوف' | 'متقاعد' | 'مستقيل';
export type Gender = 'ذكر' | 'أنثى';
export type MaritalStatus = 'أعزب' | 'متزوج' | 'مطلق' | 'أرمل';
export type SkillLevel = 'مبتدئ' | 'متوسط' | 'متقدم' | 'خبير';

export interface Education {
  id: string;
  degree: string;
  institution: string;
  institutionType?: 'ليبية' | 'أجنبية';
  country?: string;
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
  curriculum?: string;
  issuer: string;
  issueDate: string;
  expiryDate: string;
  durationValue?: number;
  durationUnit?: 'ساعات' | 'أيام' | 'أسابيع';
  status: 'سارية' | 'منتهية';
}

export interface Bonus {
  id: string;
  title: string;
  amount: number;
  date: string;
  reason: string;
  status: 'مصروفة' | 'معلقة';
}

export interface PerformanceRating {
  score: number;
  level: 'ممتاز' | 'جيد جداً' | 'جيد' | 'مقبول' | 'يحتاج تحسين';
  lastEvaluationDate?: string;
  evaluator?: string;
  notes?: string;
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
  fileId?: string;
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
  passportIssueDate?: string;
  passportExpiryDate?: string;
  visaNo: string;
  visaIssueDate?: string;
  visaExpiry: string;
  workPermitNo: string;
  permitExpiry: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  emergencyContactPhone2?: string;
  emergencyContactRelativePhone?: string;

  // Collections
  educations: Education[];
  experiences: Experience[];
  skills: Skill[];
  contracts: Contract[];
  certifications: Certification[];
  equipments: Equipment[];
  documents: Document[];
  auditLogs: AuditLog[];
  bonuses?: Bonus[];

  // System Data
  employeeId: string;
  employmentCategory?: 'موظف أساسي' | 'متعاقد' | 'متعاون';
  status: EmployeeStatus;
  performanceRating?: PerformanceRating;
  linkedUser: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface RoleDef {
  id: string;
  name: string;
  permissions: string[];
}

export interface AttendanceMovement {
  id: string;
  type: 'in' | 'out';
  time: string;
  minutesFromMidnight: number;
  note?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: 'Present' | 'Late' | 'Absent' | 'Leave';
  movements: AttendanceMovement[];
}

export interface Candidate {
  id: string;
  name: string;
  position: string;
  stage: 'new' | 'screening' | 'interview' | 'offer' | 'rejected' | 'hired';
  dateAdded: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  basic: number;
  allowances: number;
  deductions: number;
  net: number;
  status: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  period: string;
  reviewer: string;
  rating: number;
  comments: string;
}
