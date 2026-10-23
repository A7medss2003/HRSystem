import { Employee } from '../types';

export interface MissingFieldInfo {
  key: string;
  label: string;
  section: 'basic' | 'work' | 'personal' | 'bank';
  sectionName: string;
}

export interface DocumentExpiryInfo {
  docType: 'passport' | 'visa' | 'workPermit' | 'contract' | 'certification';
  name: string;
  date: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
  daysRemaining: number; // negative if expired, positive if days until expiry
}

export interface EmployeeAuditResult {
  isComplete: boolean;
  totalFieldsCount: number;
  filledFieldsCount: number;
  completionPercentage: number;
  missingCount: number;
  missingFields: MissingFieldInfo[];
  missingBySection: {
    basic: MissingFieldInfo[];
    work: MissingFieldInfo[];
    personal: MissingFieldInfo[];
    bank: MissingFieldInfo[];
  };
  expiredDocs: DocumentExpiryInfo[];
  expiringDocs: DocumentExpiryInfo[];
  hasExpiredDocs: boolean;
  hasExpiringDocs: boolean;
  hasIssues: boolean;
  statusBadge: {
    color: 'red' | 'amber' | 'emerald';
    text: string;
    details: string;
  };
}

// First 4 main sections fields definitions (المعلومات الأساسية، معلومات العمل، المعلومات الشخصية، بيانات المصرف)
export const KEY_FIELDS_DEFINITIONS: {
  key: keyof Employee;
  label: string;
  section: 'basic' | 'work' | 'personal' | 'bank';
  sectionName: string;
}[] = [
  // 1. المعلومات الأساسية (Basic Info)
  { key: 'fullName', label: 'الاسم الكامل', section: 'basic', sectionName: 'المعلومات الأساسية' },
  { key: 'jobTitle', label: 'المسمى الوظيفي', section: 'basic', sectionName: 'المعلومات الأساسية' },
  { key: 'company', label: 'الشركة / المؤسسة', section: 'basic', sectionName: 'المعلومات الأساسية' },
  { key: 'department', label: 'القسم / الإدارة', section: 'basic', sectionName: 'المعلومات الأساسية' },
  { key: 'workPhone', label: 'هاتف العمل', section: 'basic', sectionName: 'المعلومات الأساسية' },
  { key: 'workEmail', label: 'البريد الإلكتروني للعمل', section: 'basic', sectionName: 'المعلومات الأساسية' },
  { key: 'directManager', label: 'المدير المباشر', section: 'basic', sectionName: 'المعلومات الأساسية' },

  // 2. معلومات العمل والوظيفة (Work Info)
  { key: 'workLocation', label: 'موقع العمل (الفرع)', section: 'work', sectionName: 'معلومات العمل' },
  { key: 'workAddress', label: 'عنوان العمل', section: 'work', sectionName: 'معلومات العمل' },
  { key: 'workingHours', label: 'ساعات العمل', section: 'work', sectionName: 'معلومات العمل' },
  { key: 'remoteWorkType', label: 'نوع العمل عن بعد', section: 'work', sectionName: 'معلومات العمل' },
  { key: 'workSchedule', label: 'جدول أيام العمل', section: 'work', sectionName: 'معلومات العمل' },
  { key: 'linkedUser', label: 'اسم المستخدم للدخول', section: 'work', sectionName: 'معلومات العمل' },

  // 3. المعلومات الشخصية (Personal Info)
  { key: 'nationalId', label: 'الرقم الوطني', section: 'personal', sectionName: 'المعلومات الشخصية' },
  { key: 'dob', label: 'تاريخ الميلاد', section: 'personal', sectionName: 'المعلومات الشخصية' },
  { key: 'gender', label: 'الجنس', section: 'personal', sectionName: 'المعلومات الشخصية' },
  { key: 'maritalStatus', label: 'الحالة الاجتماعية', section: 'personal', sectionName: 'المعلومات الشخصية' },
  { key: 'nationality', label: 'الجنسية', section: 'personal', sectionName: 'المعلومات الشخصية' },
  { key: 'personalPhone', label: 'الهاتف الشخصي', section: 'personal', sectionName: 'المعلومات الشخصية' },
  { key: 'homeAddress', label: 'عنوان السكن', section: 'personal', sectionName: 'المعلومات الشخصية' },
  { key: 'passportNo', label: 'رقم جواز السفر', section: 'personal', sectionName: 'المعلومات الشخصية' },
  { key: 'passportExpiryDate', label: 'تاريخ انتهاء جواز السفر', section: 'personal', sectionName: 'المعلومات الشخصية' },
  { key: 'emergencyContactName', label: 'اسم جهة اتصال الطوارئ', section: 'personal', sectionName: 'المعلومات الشخصية' },
  { key: 'emergencyContactPhone', label: 'رقم هاتف الطوارئ', section: 'personal', sectionName: 'المعلومات الشخصية' },

  // 4. بيانات المصرف (Bank Info)
  { key: 'bankName', label: 'اسم المصرف', section: 'bank', sectionName: 'بيانات المصرف' },
  { key: 'bankBranch', label: 'فرع المصرف', section: 'bank', sectionName: 'بيانات المصرف' },
  { key: 'bankAccountNumber', label: 'رقم الحساب المصرفي', section: 'bank', sectionName: 'بيانات المصرف' },
  { key: 'bankIban', label: 'رقم الآيبان (IBAN)', section: 'bank', sectionName: 'بيانات المصرف' },
  { key: 'bankAccountHolder', label: 'اسم صاحب الحساب', section: 'bank', sectionName: 'بيانات المصرف' },
  { key: 'bankAccountType', label: 'نوع الحساب المصرفي', section: 'bank', sectionName: 'بيانات المصرف' },
  { key: 'bankCurrency', label: 'عملة الحساب', section: 'bank', sectionName: 'بيانات المصرف' },
];

/**
 * Audit an employee profile for missing required fields in the first 4 sections
 * and check documents with expiry dates (Passport, Visa, Permit, Contracts).
 */
export function auditEmployee(emp?: Employee | null, customToday?: Date): EmployeeAuditResult {
  if (!emp) {
    return {
      isComplete: false,
      totalFieldsCount: KEY_FIELDS_DEFINITIONS.length,
      filledFieldsCount: 0,
      completionPercentage: 0,
      missingCount: KEY_FIELDS_DEFINITIONS.length,
      missingFields: [],
      missingBySection: { basic: [], work: [], personal: [], bank: [] },
      expiredDocs: [],
      expiringDocs: [],
      hasExpiredDocs: false,
      hasExpiringDocs: false,
      hasIssues: true,
      statusBadge: { color: 'red', text: 'بيانات غير متوفرة', details: 'لا توجد بيانات للموظف' }
    };
  }

  const today = customToday || new Date();
  const todayTime = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();

  // 1. Audit missing fields in the 4 sections
  const missingFields: MissingFieldInfo[] = [];
  const missingBySection: EmployeeAuditResult['missingBySection'] = {
    basic: [],
    work: [],
    personal: [],
    bank: []
  };

  for (const def of KEY_FIELDS_DEFINITIONS) {
    const val = emp[def.key];
    const isEmpty = val === undefined || val === null || String(val).trim() === '';

    // Exception logic: workPhone can be satisfied by workMobile or personalPhone
    if (def.key === 'workPhone' && isEmpty) {
      if (emp.workMobile && String(emp.workMobile).trim() !== '') continue;
      if (emp.personalPhone && String(emp.personalPhone).trim() !== '') continue;
    }
    // Exception logic: bankAccountHolder default can fall back to fullName
    if (def.key === 'bankAccountHolder' && isEmpty) {
      if (emp.fullName && String(emp.fullName).trim() !== '') continue;
    }

    if (isEmpty) {
      const fieldInfo: MissingFieldInfo = {
        key: def.key as string,
        label: def.label,
        section: def.section,
        sectionName: def.sectionName
      };
      missingFields.push(fieldInfo);
      missingBySection[def.section].push(fieldInfo);
    }
  }

  const totalFieldsCount = KEY_FIELDS_DEFINITIONS.length;
  const missingCount = missingFields.length;
  const filledFieldsCount = totalFieldsCount - missingCount;
  const completionPercentage = Math.round((filledFieldsCount / totalFieldsCount) * 100);
  const isComplete = missingCount === 0;

  // 2. Audit Document Expiration Dates (Passport, Visa, Permit, Contracts, Certifications)
  const expiredDocs: DocumentExpiryInfo[] = [];
  const expiringDocs: DocumentExpiryInfo[] = [];

  const checkDoc = (docType: 'passport' | 'visa' | 'workPermit' | 'contract' | 'certification', name: string, dateStr?: string) => {
    if (!dateStr || String(dateStr).trim() === '') return;
    const docDate = new Date(dateStr);
    if (isNaN(docDate.getTime())) return;

    const docDateTime = new Date(docDate.getFullYear(), docDate.getMonth(), docDate.getDate()).getTime();
    const diffDays = Math.ceil((docDateTime - todayTime) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      expiredDocs.push({
        docType,
        name,
        date: dateStr,
        isExpired: true,
        isExpiringSoon: false,
        daysRemaining: diffDays // negative: e.g. -15 days
      });
    } else if (diffDays <= 45) { // Within 45 days warning window
      expiringDocs.push({
        docType,
        name,
        date: dateStr,
        isExpired: false,
        isExpiringSoon: true,
        daysRemaining: diffDays // positive: e.g. 12 days left
      });
    }
  };

  // Passport expiry date check
  if (emp.passportExpiryDate) {
    checkDoc('passport', 'جواز السفر', emp.passportExpiryDate);
  }

  // Visa expiry date check
  if (emp.visaExpiry) {
    checkDoc('visa', 'تأشيرة الدخول / الإقامة', emp.visaExpiry);
  }

  // Work Permit expiry date check
  if (emp.permitExpiry) {
    checkDoc('workPermit', 'تصريح العمل', emp.permitExpiry);
  }

  // Contracts expiry date check
  if (emp.contracts && emp.contracts.length > 0) {
    emp.contracts.forEach((c) => {
      if (c.status === 'ساري' && c.endDate) {
        checkDoc('contract', `عقد العمل (${c.type || 'أساسي'})`, c.endDate);
      }
    });
  }

  // Certifications expiry check
  if (emp.certifications && emp.certifications.length > 0) {
    emp.certifications.forEach((cert) => {
      if (cert.status === 'سارية' && cert.expiryDate) {
        checkDoc('certification', `شهادة: ${cert.name}`, cert.expiryDate);
      }
    });
  }

  const hasExpiredDocs = expiredDocs.length > 0;
  const hasExpiringDocs = expiringDocs.length > 0;
  const hasIssues = !isComplete || hasExpiredDocs || hasExpiringDocs;

  // 3. Status Badge logic
  let statusBadge: EmployeeAuditResult['statusBadge'];

  if (hasExpiredDocs) {
    const firstDoc = expiredDocs[0];
    const more = expiredDocs.length > 1 ? ` (+${expiredDocs.length - 1})` : '';
    statusBadge = {
      color: 'red',
      text: `${firstDoc.name} منتهي${more}`,
      details: `${firstDoc.name} منتهي الصلاحية منذ ${Math.abs(firstDoc.daysRemaining)} يوم (تاريخ: ${firstDoc.date})`
    };
  } else if (missingCount > 0) {
    statusBadge = {
      color: 'red',
      text: `بيانات ناقصة (${missingCount})`,
      details: `يوجد ${missingCount} خانة غير مسجلة في الأقسام الأربعة الأساسية والمصرفية.`
    };
  } else if (hasExpiringDocs) {
    const firstDoc = expiringDocs[0];
    statusBadge = {
      color: 'amber',
      text: `${firstDoc.name} ينتهي قريباً`,
      details: `${firstDoc.name} ينتهي خلال ${firstDoc.daysRemaining} يوم في ${firstDoc.date}.`
    };
  } else {
    statusBadge = {
      color: 'emerald',
      text: 'البيانات مكتملة 100%',
      details: 'كافة البيانات الأساسية والشخصية والمصرفية والوثائق مكتملة وسارية المفعول.'
    };
  }

  return {
    isComplete,
    totalFieldsCount,
    filledFieldsCount,
    completionPercentage,
    missingCount,
    missingFields,
    missingBySection,
    expiredDocs,
    expiringDocs,
    hasExpiredDocs,
    hasExpiringDocs,
    hasIssues,
    statusBadge
  };
}
