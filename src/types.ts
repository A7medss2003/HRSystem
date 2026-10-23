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

export interface CustomField {
  id: string;
  section: string;
  label: string;
  value: string;
  width?: 'half' | 'full' | '1' | '2' | '3';
  isRequired?: boolean;
  type?: 'text' | 'number' | 'date';
  scope?: 'employee' | 'global';
  employeeId?: string;
}

export interface FieldRequirementConfig {
  key: string;
  label: string;
  section: 'basic' | 'work' | 'personal' | 'bank';
  description?: string;
  defaultRequired?: boolean;
  isPermanentRequired?: boolean;
}

export type DocumentCategory = 
  | 'passport' 
  | 'national_id' 
  | 'certificate' 
  | 'contract' 
  | 'medical' 
  | 'license' 
  | 'bank' 
  | 'other';

export interface Document {
  id: string;
  name: string;
  type: string;
  category?: DocumentCategory;
  uploadDate: string;
  fileId?: string;
  documentNo?: string;
  issueDate?: string;
  expiryDate?: string;
  issuer?: string;
  notes?: string;
  source?: 'scanner' | 'camera' | 'upload';
  fileSize?: string;
  thumbnail?: string;
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
  customPermissions?: string[];
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

  // Bank Info (بيانات المصرف)
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  bankIban?: string;
  bankAccountHolder?: string;
  bankSwift?: string;
  bankAccountType?: string;
  bankCurrency?: string;
  bankNotes?: string;

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
  customFields?: CustomField[];

  // System Data
  employeeId: string;
  fingerprintId?: string; // رقم البصمة في جهاز البصمة (Enroll ID / PIN)
  employmentCategory?: 'موظف أساسي' | 'متعاقد' | 'متعاون';
  status: EmployeeStatus;
  performanceRating?: PerformanceRating;
  linkedUser: string;
  password?: string;
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
  verifyType?: string;
  deviceSn?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Late' | 'Absent' | 'Leave';
  movements: AttendanceMovement[];
  workHours?: number; // مجموع ساعات العمل
  delayMinutes?: number; // دقائق التأخير عن بداية الدوام
  earlyLeaveMinutes?: number; // دقائق المغادرة المبكرة
  notes?: string;
  source?: 'manual' | 'zkteco' | 'mobile';
}

export interface RawFingerprintPunch {
  pin: string;
  name?: string;
  timestamp: Date;
  dateStr: string;
  timeStr: string;
  state?: 'in' | 'out' | 'auto';
  verifyType?: string;
  workCode?: string;
}

export interface AttendanceImportPreviewRow {
  id: string;
  pin: string;
  matchedEmployeeId?: string;
  matchedEmployeeName?: string;
  originalNameInFile?: string;
  matchMethod: 'fingerprintId' | 'employeeId' | 'fullName' | 'nationalId' | 'manual' | 'none';
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  allTimes: string[];
  movements: AttendanceMovement[];
  totalHours: number;
  delayMinutes: number;
  status: 'Present' | 'Late' | 'Absent' | 'Leave';
  isExisting: boolean;
  existingRecordId?: string;
  action: 'create' | 'merge' | 'skip';
  error?: string;
}

export interface AttendanceImportConfig {
  workStartTime: string; // "08:30"
  workEndTime: string; // "16:30"
  lateGraceMinutes: number; // 15
  mergeStrategy: 'merge' | 'overwrite' | 'skip';
  autoLinkUnknownByEnrollId: boolean;
}

export interface AttendanceImportResult {
  totalPunches: number;
  totalDaysProcessed: number;
  newRecordsCreated: number;
  recordsUpdated: number;
  unmatchedRecords: number;
  savedRecordsCount: number;
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

export interface SystemAuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface SystemSettings {
  companyName: string;
  logoUrl?: string;
  primaryLanguage: 'ar' | 'en';
  fiscalYearStart: string;
  workStartTime?: string; // Default '08:30'
  workEndTime?: string; // Default '16:30'
  lateGracePeriodMinutes?: number; // Default 15
}

export interface GlobalCustomField {
  id: string;
  section: string;
  label: string;
  width: '1' | '2' | '3';
  isRequired?: boolean;
  type?: 'text' | 'number' | 'date';
}

export type ServerRole = 'host' | 'client' | 'standalone';

export interface NetworkInterfaceInfo {
  name: string;
  ip: string;
  type: 'ethernet' | 'wifi' | 'other';
  isEthernet: boolean;
  mac?: string;
}

export interface ServerStatusInfo {
  running: boolean;
  port: number;
  hostName: string;
  role: ServerRole;
  ethernetIp?: string;
  wifiIp?: string;
  interfaces: NetworkInterfaceInfo[];
  connectedClients?: number;
  lastSync?: string;
}
