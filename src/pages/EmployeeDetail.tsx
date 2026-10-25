import { useState } from 'react';
import { ArrowRight, Shield, Save, X, Building, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, FileText, Monitor, Clock, User as UserIcon, Contact, Trash2, Plus, Star, Gift, Download, Printer, SlidersHorizontal, Landmark, CreditCard, AlertCircle, AlertTriangle, CheckCircle2, Scan, Eye, Camera, UploadCloud } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Employee, Education, Experience, Skill, Contract, Certification, Equipment, Document, DocumentCategory, AuditLog, CustomField, GlobalCustomField } from '../types';
import { toast } from '../components/Toast';
import { validatePassword } from '../lib/validators';
import { useStore } from '../store';
import { employeeSchema } from '../schema';
import { SYSTEM_FIELDS_CONFIG } from '../lib/fieldConfig';
import FieldRequirementsModal from '../components/FieldRequirementsModal';
import CustomFieldModal from '../components/CustomFieldModal';
import EmployeePrintModal from '../components/EmployeePrintModal';
import DocumentScannerModal from '../components/DocumentScannerModal';
import DocumentViewerModal from '../components/DocumentViewerModal';
import NameAndUploadDocumentModal from '../components/NameAndUploadDocumentModal';
import DirectScannerModal from '../components/DirectScannerModal';
import { z } from 'zod';
import { auditEmployee } from '../lib/employeeAudit';
import { isManagerEmployee } from '../lib/managerGuard';

interface EmployeeDetailProps {
  user?: { role: string, username: string, permissions: string[] };
  readOnly?: boolean;
  employee: Employee | null;
  onBack: () => void;
  onSave: (employee: Employee) => void;
  initialCategory?: 'موظف أساسي' | 'متعاقد' | 'متعاون';
}

const checkDateExpiry = (valStr: string) => {
  if (!valStr || String(valStr).trim() === '') return null;
  const d = new Date(valStr);
  if (isNaN(d.getTime())) return null;
  const todayZero = new Date(new Date().setHours(0,0,0,0)).getTime();
  const dZero = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.ceil((dZero - todayZero) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { isExpired: true, days: Math.abs(diffDays) };
  if (diffDays <= 30) return { isExpiring: true, days: diffDays };
  return { isValid: true, days: diffDays };
};

const defaultEmployee: Employee = {
  id: 'emp-' + Date.now(),
  employeeId: 'HR-' + Math.floor(Math.random() * 10000),
  fullName: '',
  jobTitle: '',
  company: 'الشركة الليبية للتقنية',
  tags: [],
  workEmail: '',
  workPhone: '',
  workMobile: '',
  department: '',
  management: '',
  directManager: '',
  coach: '',
  workAddress: '',
  workLocation: '',
  timeOffApprover: '',
  expensesApprover: '',
  timesheetApprover: '',
  workingHours: '',
  timezone: 'Africa/Tripoli',
  defaultRole: '',
  additionalRoles: [],
  remoteWorkType: 'مكتب',
  workSchedule: '',
  homeAddress: '',
  personalPhone: '',
  personalEmail: '',
  language: 'العربية',
  gender: 'ذكر',
  maritalStatus: 'أعزب',
  dob: '',
  placeOfBirth: '',
  nationality: 'ليبي',
  childrenCount: 0,
  nationalId: '',
  passportNo: '',
  visaNo: '',
  workPermitNo: '',
  visaExpiry: '',
  permitExpiry: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContactPhone: '',
  bankName: '',
  bankBranch: '',
  bankAccountNumber: '',
  bankIban: '',
  bankAccountHolder: '',
  bankSwift: '',
  bankAccountType: 'حساب جاري',
  bankCurrency: 'دينار ليبي (LYD)',
  bankNotes: '',
  status: 'نشط',
  linkedUser: '',
  password: '1234',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'admin',
  educations: [],
  experiences: [],
  skills: [],
  contracts: [],
  certifications: [],
  equipments: [],
  documents: [],
  auditLogs: [],
  customFields: [],
};

const InputField = ({ 
  label, 
  value, 
  onChange, 
  icon: Icon, 
  dir = 'rtl', 
  className = '', 
  type = 'text', 
  placeholder = '', 
  readOnly = false, 
  isRequired = false,
  fieldKey,
  isAdmin = false,
  onToggleRequired,
  isPermanentRequired = false
}: any) => {
  const isUnfilled = value === undefined || value === null || String(value).trim() === '';
  const expiryStatus = (type === 'date' || fieldKey?.toLowerCase().includes('expiry')) ? checkDateExpiry(value) : null;

  return (
  <div className={className}>
    {label && (
      <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="text-xs font-semibold text-slate-700">
            {label}
          </label>

          {/* علامة حمراء مميزة في حال كانت الخانة غير مدرجة / فارغة */}
          {isUnfilled ? (
            <span className="text-[10px] font-bold text-red-600 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-pulse" title="هذه الخانة غير مدرجة وبحاجة لإدخال البيانات">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              ⚠️ خانة غير مدرجة (فارغة)
            </span>
          ) : expiryStatus?.isExpired ? (
            <span className="text-[10px] font-bold text-red-700 bg-red-100 border border-red-300 px-2 py-0.5 rounded-md flex items-center gap-1 animate-pulse" title="هذه الوثيقة منتهية الصلاحية">
              🚨 منتهي الصلاحية (منذ {expiryStatus.days} يوم)
            </span>
          ) : expiryStatus?.isExpiring ? (
            <span className="text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md flex items-center gap-1" title="هذه الوثيقة توشك على الانتهاء">
              ⏳ يوشك على الانتهاء (خلال {expiryStatus.days} يوم)
            </span>
          ) : null}

          {/* أمام كل حقل: يظهر للمدير زر تحكم فوري بين إجباري واختياري */}
          {isPermanentRequired ? (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded flex items-center gap-1" title="حقل إجباري دائم في النظام">
              <span className="text-red-500 font-bold">*</span>
              إجباري دائم
            </span>
          ) : isAdmin && onToggleRequired && fieldKey ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleRequired(fieldKey, label);
              }}
              className={clsx(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all shadow-2xs border cursor-pointer select-none",
                isRequired
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-800"
              )}
              title={isRequired ? `حقل "${label}": إجباري حالياً (انقر لجعله اختياري)` : `حقل "${label}": اختياري حالياً (انقر لجعله إجباري)`}
            >
              <span className={clsx("w-2 h-2 rounded-full", isRequired ? "bg-red-500" : "bg-slate-400")} />
              <span>{isRequired ? "* إجباري (تغيير)" : "اختياري (تغيير)"}</span>
              <SlidersHorizontal size={10} className="opacity-60" />
            </button>
          ) : (
            /* الموظف المتخصص بتعبئة البيانات: يرى فقط النتيجة بعد تعديل المدير */
            isRequired ? (
              <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5" title="حقل مطلوب إجباري">
                <span className="text-red-500 font-bold">*</span>
                مطلوب
              </span>
            ) : (
              <span className="text-slate-400 font-normal text-[11px]">(اختياري)</span>
            )
          )}
        </div>

        {isAdmin && fieldKey && !isPermanentRequired && (
          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
            تحكم الإدارة
          </span>
        )}
      </div>
    )}
    <div className="relative flex items-center">
      {Icon && <Icon size={16} className={clsx("absolute text-slate-400", dir === 'ltr' ? 'left-3' : 'right-3')} />}
      <input 
        type={type}
        value={value || ''}
        placeholder={placeholder || (isUnfilled ? '⚠️ هذه الخانة فارغة - يرجى كتابة البيانات...' : '')}
        readOnly={readOnly}
        onChange={e => !readOnly && onChange(e.target.value)}
        dir={dir}
        className={clsx(
          "w-full border rounded-lg focus:ring-2 outline-none text-sm py-2 transition-all",
          isUnfilled 
            ? "border-red-400 bg-red-50/30 text-slate-800 ring-1 ring-red-200 focus:border-red-500 focus:ring-red-200" 
            : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500",
          Icon ? (dir === 'ltr' ? "pl-9 pr-3" : "pr-9 pl-3") : "px-3",
          readOnly && "opacity-80 cursor-not-allowed bg-slate-100"
        )}
      />
    </div>
  </div>
  );
};

const SelectField = ({ 
  label, 
  value, 
  onChange, 
  options, 
  icon: Icon, 
  className = '', 
  readOnly = false, 
  isRequired = false, 
  fieldKey,
  isAdmin = false,
  onToggleRequired,
  isPermanentRequired = false
}: any) => {
  const isUnfilled = !value || String(value).trim() === '';

  return (
  <div className={className}>
    {label && (
      <div className="flex items-center justify-between mb-1.5 gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <label className="text-xs font-semibold text-slate-700">
            {label}
          </label>

          {/* علامة حمراء مميزة في حال كانت الخانة غير مدرجة / فارغة */}
          {isUnfilled && (
            <span className="text-[10px] font-bold text-red-600 bg-red-100 border border-red-300 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs animate-pulse" title="هذه الخانة غير مدرجة وبحاجة لإدخال البيانات">
              <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              ⚠️ خانة غير مدرجة (فارغة)
            </span>
          )}

          {/* أمام كل حقل: يظهر للمدير زر تحكم فوري بين إجباري واختياري */}
          {isPermanentRequired ? (
            <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded flex items-center gap-1" title="حقل إجباري دائم في النظام">
              <span className="text-red-500 font-bold">*</span>
              إجباري دائم
            </span>
          ) : isAdmin && onToggleRequired && fieldKey ? (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleRequired(fieldKey, label);
              }}
              className={clsx(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all shadow-2xs border cursor-pointer select-none",
                isRequired
                  ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300"
                  : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-800"
              )}
              title={isRequired ? `حقل "${label}": إجباري حالياً (انقر لجعله اختياري)` : `حقل "${label}": اختياري حالياً (انقر لجعله إجباري)`}
            >
              <span className={clsx("w-2 h-2 rounded-full", isRequired ? "bg-red-500" : "bg-slate-400")} />
              <span>{isRequired ? "* إجباري (تغيير)" : "اختياري (تغيير)"}</span>
              <SlidersHorizontal size={10} className="opacity-60" />
            </button>
          ) : (
            /* الموظف المتخصص بتعبئة البيانات: يرى فقط النتيجة بعد تعديل المدير */
            isRequired ? (
              <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5" title="حقل مطلوب إجباري">
                <span className="text-red-500 font-bold">*</span>
                مطلوب
              </span>
            ) : (
              <span className="text-slate-400 font-normal text-[11px]">(اختياري)</span>
            )
          )}
        </div>

        {isAdmin && fieldKey && !isPermanentRequired && (
          <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">
            تحكم الإدارة
          </span>
        )}
      </div>
    )}
    <div className="relative flex items-center">
      {Icon && <Icon size={16} className="absolute right-3 text-slate-400" />}
      <select 
        value={value || ''}
        disabled={readOnly}
        onChange={e => !readOnly && onChange(e.target.value)}
        className={clsx(
          "w-full border rounded-lg focus:ring-2 outline-none text-sm py-2 transition-all",
          isUnfilled 
            ? "border-red-300 bg-red-50/20 focus:border-red-500 focus:ring-red-200" 
            : "border-slate-200 bg-slate-50 focus:border-blue-500 focus:ring-blue-500",
          Icon ? "pr-9 pl-3" : "px-3",
          readOnly && "opacity-80 cursor-not-allowed bg-slate-100 appearance-none"
        )}
      >
        <option value="">-- اختر من القائمة --</option>
        {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  </div>
  );
};

const Section = ({ title, children }: any) => (
  <div className="border border-slate-100 rounded-xl p-5 bg-slate-50/50">
    <h3 className="font-bold text-slate-800 mb-4">{title}</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
      {children}
    </div>
  </div>
);

const EmptyState = ({ message }: { message: string }) => (
  <div className="py-12 flex flex-col items-center justify-center text-slate-400">
    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
      <FileText size={24} className="text-slate-300" />
    </div>
    <p>{message}</p>
  </div>
);

import { saveFileToLocal, getFileFromLocal, deleteFileFromLocal } from '../lib/fileStorage';
import FileImage from '../components/FileImage';

export default function EmployeeDetail({ employee, onBack, onSave, readOnly = false, hideBack = false, initialCategory, user }: EmployeeDetailProps & { hideBack?: boolean }) {
  const { employees, deleteEmployee, addSystemLog, globalCustomFields, setGlobalCustomFields, roles, requiredFields, setFieldRequired, systemSettings } = useStore();
  
  // حماية بيانات المدير ومنع ظهورها أو تعديلها من الموظف العادي أو مدخل البيانات
  const isUserAdmin = user?.role === 'admin' || user?.role === 'developer' || user?.permissions?.includes('all');

  if (!isUserAdmin && isManagerEmployee(employee)) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 shadow-sm max-w-lg mx-auto my-12" dir="rtl">
        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
          <Shield size={32} />
        </div>
        <h3 className="text-xl font-bold text-slate-800 mb-2">غير مصرح لك بالوصول</h3>
        <p className="text-sm text-slate-500 mb-6 leading-relaxed">
          بيانات المدير العام / مدير النظام محمية ومخصصة للإدارة العليا فقط، ولا يمكن استعراضها أو الاطلاع عليها أو تعديلها من قبل مسجل البيانات.
        </p>
        <button
          onClick={onBack}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-colors cursor-pointer shadow-sm shadow-blue-200"
        >
          العودة لدليل الموظفين
        </button>
      </div>
    );
  }

  const generateNextEmployeeId = () => {
    if (employee) return employee.employeeId;
    
    let maxId = 0;
    const currentYear = new Date().getFullYear();
    
    employees.forEach(emp => {
      // Look for format like HR-2026-0001 or HR-001
      const match = emp.employeeId.match(/HR(?:-\d{4})?-(\d+)/i) || emp.employeeId.match(/-(\d+)$/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    });
    
    return `HR-${currentYear}-${String(maxId + 1).padStart(4, '0')}`;
  };

  const [activeTab, setActiveTab] = useState('basic');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showFieldRequirementsModal, setShowFieldRequirementsModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [customModalSection, setCustomModalSection] = useState('basic');

  // Scanner & Document Viewer Modals State
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerCategory, setScannerCategory] = useState<DocumentCategory>('passport');
  const [scannerInitialTitle, setScannerInitialTitle] = useState<string>('');
  const [selectedViewingDoc, setSelectedViewingDoc] = useState<Document | null>(null);
  const [showViewerModal, setShowViewerModal] = useState(false);
  const [pendingUploadFile, setPendingUploadFile] = useState<File | null>(null);
  const [showNameDocModal, setShowNameDocModal] = useState(false);
  const [showDirectScannerModal, setShowDirectScannerModal] = useState(false);

  const handleOpenScanner = (category: DocumentCategory = 'passport', title: string = '') => {
    setScannerCategory(category);
    setScannerInitialTitle(title);
    setShowScannerModal(true);
  };

  const handleSaveScannedDocument = (newDoc: Document, syncData?: any) => {
    setFormData(prev => {
      let updated = {
        ...prev,
        documents: [...prev.documents, newDoc]
      };

      if (syncData) {
        if (syncData.passportNo !== undefined) updated.passportNo = syncData.passportNo;
        if (syncData.passportIssueDate !== undefined) updated.passportIssueDate = syncData.passportIssueDate;
        if (syncData.passportExpiryDate !== undefined) updated.passportExpiryDate = syncData.passportExpiryDate;
        if (syncData.nationalId !== undefined) updated.nationalId = syncData.nationalId;
        if (syncData.photoUrl !== undefined) updated.photoUrl = syncData.photoUrl;
        if (syncData.certificate) {
          const newCert: Certification = {
            id: 'cert-' + Date.now(),
            name: syncData.certificate.name,
            issuer: syncData.certificate.issuer,
            issueDate: syncData.certificate.issueDate,
            expiryDate: syncData.certificate.expiryDate,
            status: syncData.certificate.status
          };
          updated.certifications = [...prev.certifications, newCert];
        }
      }

      return updated;
    });
  };

  const [formData, setFormData] = useState<Employee>(() => {
    if (employee) return { ...employee };
    return {
      ...defaultEmployee,
      id: 'emp-' + Date.now(),
      employeeId: generateNextEmployeeId(),
      employmentCategory: initialCategory || 'موظف أساسي'
    };
  });
  const [initialBonus, setInitialBonus] = useState<string>('');
  
  const isAdmin = user?.role === 'admin' || user?.role === 'developer' || user?.permissions?.includes('all');

  const isReq = (fieldKey: string) => {
    if (fieldKey === 'fullName') return true;
    return !!(requiredFields && requiredFields[fieldKey]);
  };

  const toggleFieldReq = (fieldKey: string, fieldLabel?: string) => {
    if (!isAdmin) return;
    if (fieldKey === 'fullName') {
      toast('حقل الاسم الكامل إجباري دائماً في المنظومة ولا يمكن جعله اختيارياً');
      return;
    }
    const currentStatus = isReq(fieldKey);
    const nextStatus = !currentStatus;
    setFieldRequired(fieldKey, nextStatus);
    const label = fieldLabel || fieldKey;
    if (nextStatus) {
      toast(`تم تعيين الحقل "${label}" كـ [إجباري مطلوب] عند تعبئة البيانات`);
    } else {
      toast(`تم تعيين الحقل "${label}" كـ [اختياري]`);
    }
  };

  const handleToggleCustomFieldRequired = (id: string, scope: 'global' | 'employee') => {
    if (!isAdmin) return;
    if (scope === 'global') {
      const updated = (globalCustomFields || []).map(g => {
        if (g.id === id) {
          const next = !g.isRequired;
          toast(next ? `تم تعيين الحقل العام "${g.label}" كـ [إجباري مطلوب]` : `تم تعيين الحقل العام "${g.label}" كـ [اختياري]`);
          return { ...g, isRequired: next };
        }
        return g;
      });
      setGlobalCustomFields(updated);
    } else {
      const updated = (formData.customFields || []).map(cf => {
        if (cf.id === id) {
          const next = !cf.isRequired;
          toast(next ? `تم تعيين الحقل الخاص "${cf.label}" كـ [إجباري مطلوب]` : `تم تعيين الحقل الخاص "${cf.label}" كـ [اختياري]`);
          return { ...cf, isRequired: next };
        }
        return cf;
      });
      setFormData(prev => ({ ...prev, customFields: updated }));
    }
  };

  const handleOpenFieldModal = (section: string) => {
    setCustomModalSection(section);
    setShowCustomModal(true);
  };

  const handleSaveCustomField = (data: {
    label: string;
    section: string;
    scope: 'employee' | 'global';
    isRequired: boolean;
    type: 'text' | 'number' | 'date';
    width: '1' | '2' | '3';
    initialValue?: string;
  }) => {
    const newId = 'cf-' + Date.now();
    if (data.scope === 'global') {
      const globalField: GlobalCustomField = {
        id: newId,
        section: data.section,
        label: data.label,
        width: data.width,
        isRequired: data.isRequired,
        type: data.type,
      };
      setGlobalCustomFields([...(globalCustomFields || []), globalField]);
      
      setFormData(prev => ({
        ...prev,
        customFields: [
          ...(prev.customFields || []).filter(f => f.id !== newId),
          {
            id: newId,
            section: data.section,
            label: data.label,
            value: data.initialValue || '',
            width: data.width,
            isRequired: data.isRequired,
            type: data.type,
            scope: 'global'
          }
        ]
      }));
    } else {
      const empField: CustomField = {
        id: newId,
        section: data.section,
        label: data.label,
        value: data.initialValue || '',
        width: data.width,
        isRequired: data.isRequired,
        type: data.type,
        scope: 'employee',
        employeeId: formData.id
      };
      setFormData(prev => ({
        ...prev,
        customFields: [...(prev.customFields || []), empField]
      }));
    }
  };

  const handleDeleteCustomField = (id: string, scope: 'global' | 'employee') => {
    if (scope === 'global') {
      if (confirm('هل أنت متأكد من حذف هذا الحقل العام لجميع الموظفين؟')) {
        setGlobalCustomFields((globalCustomFields || []).filter(f => f.id !== id));
        setFormData(prev => ({
          ...prev,
          customFields: (prev.customFields || []).filter(f => f.id !== id)
        }));
        toast('تم حذف الحقل العام');
      }
    } else {
      if (confirm('هل أنت متأكد من حذف هذا الحقل الخاص بهذا الموظف؟')) {
        setFormData(prev => ({
          ...prev,
          customFields: (prev.customFields || []).filter(f => f.id !== id)
        }));
        toast('تم حذف الحقل بنجاح');
      }
    }
  };

  const handleTogglePermission = (permId: string) => {
    if (readOnly || !isAdmin) return;
    setFormData(prev => {
      const current = prev.customPermissions || [];
      const updated = current.includes(permId) 
        ? current.filter(p => p !== permId) 
        : [...current, permId];
      return { ...prev, customPermissions: updated };
    });
  };

  const handleUpdateCustomFieldValue = (
    fieldId: string, 
    val: string, 
    fieldScope: 'global' | 'employee', 
    label: string, 
    section: string, 
    isRequired?: boolean, 
    type?: 'text' | 'number' | 'date'
  ) => {
    if (readOnly) return;
    setFormData(prev => {
      let currentFields = prev.customFields || [];
      const exists = currentFields.find(cf => cf.id === fieldId);
      if (exists) {
        currentFields = currentFields.map(cf => cf.id === fieldId ? { ...cf, value: val } : cf);
      } else {
        currentFields = [
          ...currentFields, 
          { 
            id: fieldId, 
            section, 
            label, 
            value: val, 
            scope: fieldScope, 
            isRequired, 
            type 
          }
        ];
      }
      return { ...prev, customFields: currentFields };
    });
  };

  const renderCustomFields = (section: string) => {
    const globals = (globalCustomFields || []).filter(cf => cf.section === section);
    const specifics = (formData.customFields || []).filter(cf => cf.section === section && cf.scope === 'employee');

    const allFieldsToRender: Array<{
      id: string;
      label: string;
      section: string;
      width?: '1' | '2' | '3' | 'half' | 'full';
      isRequired?: boolean;
      type?: 'text' | 'number' | 'date';
      scope: 'global' | 'employee';
      value: string;
    }> = [];

    globals.forEach(g => {
      const valObj = (formData.customFields || []).find(f => f.id === g.id);
      allFieldsToRender.push({
        id: g.id,
        label: g.label,
        section: g.section,
        width: g.width,
        isRequired: g.isRequired,
        type: g.type,
        scope: 'global',
        value: valObj ? valObj.value : '',
      });
    });

    specifics.forEach(s => {
      if (!allFieldsToRender.some(f => f.id === s.id)) {
        allFieldsToRender.push({
          id: s.id,
          label: s.label,
          section: s.section,
          width: s.width,
          isRequired: s.isRequired,
          type: s.type,
          scope: 'employee',
          value: s.value || '',
        });
      }
    });

    return (
      <>
        {allFieldsToRender.map(cf => {
          let colSpanClass = "col-span-1 md:col-span-1 lg:col-span-1";
          if (cf.width === '2' || cf.width === 'half') colSpanClass = "col-span-1 md:col-span-2 lg:col-span-2";
          if (cf.width === '3' || cf.width === 'full') colSpanClass = "col-span-1 md:col-span-2 lg:col-span-3";

          return (
            <div key={cf.id} className={`${colSpanClass} relative group bg-slate-50/70 p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-all`}>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <label className="text-xs font-bold text-slate-700">
                      {cf.label}
                    </label>

                    {isAdmin && !readOnly ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleToggleCustomFieldRequired(cf.id, cf.scope);
                        }}
                        className={clsx(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all shadow-2xs border cursor-pointer select-none",
                          cf.isRequired 
                            ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300" 
                            : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-800"
                        )}
                        title={cf.isRequired ? `حقل "${cf.label}": إجباري حالياً. انقر للتحويل إلى اختياري` : `حقل "${cf.label}": اختياري حالياً. انقر للتحويل إلى إجباري`}
                      >
                        <span className={clsx("w-2 h-2 rounded-full", cf.isRequired ? "bg-red-500" : "bg-slate-400")} />
                        <span>{cf.isRequired ? "* إجباري (تغيير)" : "اختياري (تغيير)"}</span>
                        <SlidersHorizontal size={10} className="opacity-60" />
                      </button>
                    ) : (
                      cf.isRequired ? (
                        <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                          <span className="text-red-500 font-bold">*</span>
                          مطلوب
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          (اختياري)
                        </span>
                      )
                    )}

                    {cf.scope === 'global' ? (
                      <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-medium" title="يظهر لجميع الموظفين في المنظومة">
                        🌐 للجميع
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-medium" title="خاص بهذا الموظف فقط">
                        👤 لهذا الشخص فقط
                      </span>
                    )}
                  </div>

                  {isAdmin && !readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomField(cf.id, cf.scope)}
                      className="text-red-400 hover:text-red-600 opacity-60 hover:opacity-100 transition-opacity p-1 flex-shrink-0"
                      title={cf.scope === 'global' ? "حذف الحقل لجميع الموظفين" : "حذف هذا الحقل الخاص"}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>

                <div className="relative">
                  <input
                    type={cf.type === 'number' ? 'number' : cf.type === 'date' ? 'date' : 'text'}
                    readOnly={readOnly}
                    value={cf.value}
                    onChange={(e) => handleUpdateCustomFieldValue(cf.id, e.target.value, cf.scope, cf.label, cf.section, cf.isRequired, cf.type)}
                    className={`w-full bg-white border rounded-lg focus:ring-2 outline-none text-sm p-2 transition-all ${
                      cf.isRequired && !cf.value ? 'border-amber-300 focus:border-red-400 focus:ring-red-200' : 'border-slate-200 focus:ring-blue-500'
                    }`}
                    placeholder={cf.type === 'number' ? 'أدخل القيمة الرقمية...' : 'القيمة...'}
                  />
                </div>
              </div>
            </div>
          );
        })}

        {isAdmin && !readOnly && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-1 mb-2">
            <button
              type="button"
              onClick={() => handleOpenFieldModal(section)}
              className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3.5 py-2 rounded-lg transition-colors shadow-2xs"
            >
              <Plus size={15} />
              إضافة حقل / زر مخصص (لهذا الموظف أو للجميع)
            </button>
          </div>
        )}
      </>
    );
  };

  const handleChange = (field: keyof Employee, value: any) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    try {
      // Validate schema (fullName is required, other fields relaxed)
      employeeSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const zodError = error as any;
        const firstError = zodError.issues[0];
        toast(`خطأ: ${firstError.message}`);
        setActiveTab('basic');
        return; // Stop saving
      }
    }

    // Dynamic manager required fields check
    for (const [key, isRequired] of Object.entries(requiredFields || {})) {
      if (isRequired) {
        const val = (formData as any)[key];
        const isEmpty = val === undefined || val === null || val === '' || (Array.isArray(val) && val.length === 0);
        if (isEmpty) {
          const fieldDef = SYSTEM_FIELDS_CONFIG.find(f => f.key === key);
          const label = fieldDef?.label || key;
          toast(`تنبيه: الحقل "${label}" إجباري وفقاً لإعدادات الإدارة، يرجى تعبئته`);
          if (fieldDef?.section) {
            setActiveTab(fieldDef.section);
          }
          return;
        }
      }
    }

    // Custom Fields required validation
    for (const g of (globalCustomFields || [])) {
      if (g.isRequired) {
        const valObj = (formData.customFields || []).find(f => f.id === g.id);
        if (!valObj || !valObj.value?.trim()) {
          toast(`تنبيه: الحقل الإضافي "${g.label}" إجباري، يرجى تعبئته`);
          if (g.section) setActiveTab(g.section);
          return;
        }
      }
    }

    for (const s of (formData.customFields || [])) {
      if (s.scope === 'employee' && s.isRequired && !s.value?.trim()) {
        toast(`تنبيه: الحقل الخاص "${s.label}" إجباري، يرجى تعبئته`);
        if (s.section) setActiveTab(s.section);
        return;
      }
    }

    let finalData = { ...formData, updatedAt: new Date().toISOString() };
    
    // Process initial bonus if category is collaborator
    if (!employee && finalData.employmentCategory === 'متعاون' && initialBonus && Number(initialBonus) > 0) {
      finalData.bonuses = [
        ...(finalData.bonuses || []),
        {
          id: 'bon-' + Date.now(),
          title: 'مكافأة الانضمام / أولية',
          amount: Number(initialBonus),
          date: new Date().toISOString().split('T')[0],
          reason: 'مكافأة أولية مضافة عند التسجيل',
          status: 'مصروفة'
        }
      ];
    }

    if (!employee) {
      finalData.auditLogs = [{
        id: 'aud-' + Date.now(),
        action: 'إنشاء ملف الموظف',
        user: 'admin',
        date: new Date().toISOString(),
        details: 'تم الإنشاء'
      }];
    } else {
      finalData.auditLogs = [...(formData.auditLogs || []), {
        id: 'aud-' + Date.now(),
        action: 'تحديث بيانات الموظف',
        user: 'admin',
        date: new Date().toISOString(),
        details: 'تحديث البيانات من واجهة النظام'
      }];
    }
    onSave(finalData);
    toast('تم حفظ بيانات الموظف بنجاح!');
  };

  const tabs = [
    { id: 'basic', label: 'المعلومات الأساسية', icon: UserIcon },
    { id: 'work', label: 'معلومات العمل', icon: Building },
    { id: 'personal', label: 'المعلومات الشخصية', icon: Contact },
    { id: 'bank', label: 'بيانات المصرف', icon: Landmark },
    { id: 'education', label: 'المؤهل العلمي', icon: GraduationCap },
    { id: 'experience', label: 'الخبرات', icon: Briefcase },
    { id: 'skills', label: 'المهارات', icon: Award },
    { id: 'contracts', label: 'العقود', icon: FileText },
    { id: 'certifications', label: 'شهادات الدورات', icon: Award },
    { id: 'equipment', label: 'العهدات', icon: Monitor },
    { id: 'documents', label: 'المستندات', icon: FileText },
    { id: 'performance', label: 'تقييم الأداء', icon: Star },
    { id: 'audit', label: 'سجل النظام', icon: Clock },
  ];

  // Helper arrays for Select options
  const roleOptions = (roles || []).map(r => ({ value: r.id, label: r.name }));
  const statusOptions = ['نشط', 'إجازة', 'موقوف', 'متقاعد', 'مستقيل'].map(v => ({ value: v, label: v }));
  const employmentCategoryOptions = ['موظف أساسي', 'متعاقد', 'متعاون'].map(v => ({ value: v, label: v }));
  const genderOptions = ['ذكر', 'أنثى'].map(v => ({ value: v, label: v }));
  const maritalOptions = ['أعزب', 'متزوج', 'مطلق', 'أرمل'].map(v => ({ value: v, label: v }));
  const remoteOptions = ['مكتب', 'منزل', 'مختلط'].map(v => ({ value: v, label: v }));
  const skillLevels = ['مبتدئ', 'متوسط', 'متقدم', 'خبير'].map(v => ({ value: v, label: v }));
  const contractStatus = ['ساري', 'منتهي', 'ملغى'].map(v => ({ value: v, label: v }));
  const certStatus = ['سارية', 'منتهية'].map(v => ({ value: v, label: v }));
  const durationUnits = ['ساعات', 'أيام', 'أسابيع'].map(v => ({ value: v, label: v }));
  const eqStatus = ['جيد', 'صيانة', 'تالف', 'مفقود'].map(v => ({ value: v, label: v }));
  const performanceLevelOptions = ['ممتاز', 'جيد جداً', 'جيد', 'مقبول', 'يحتاج تحسين'].map(v => ({ value: v, label: v }));
  const bankAccountTypeOptions = [
    { value: 'حساب جاري', label: 'حساب جاري' },
    { value: 'حساب توفير', label: 'حساب توفير' },
    { value: 'حساب مرتبات', label: 'حساب مرتبات' },
    { value: 'حساب ودائع / استثماري', label: 'حساب ودائع / استثماري' },
  ];
  const bankCurrencyOptions = [
    { value: 'دينار ليبي (LYD)', label: 'دينار ليبي (LYD)' },
    { value: 'دولار أمريكي (USD)', label: 'دولار أمريكي (USD)' },
    { value: 'يورو (EUR)', label: 'يورو (EUR)' },
    { value: 'جنيه إسترليني (GBP)', label: 'جنيه إسترليني (GBP)' },
    { value: 'دينار تونسي (TND)', label: 'دينار تونسي (TND)' },
    { value: 'درهم إماراتي (AED)', label: 'درهم إماراتي (AED)' },
  ];

  // Handlers for Collections
  const handleAddEducation = () => {
    setFormData(prev => ({
      ...prev,
      educations: [...prev.educations, {
        id: 'edu-' + Date.now(), degree: '', institution: '', major: '', startDate: '', gradDate: '', description: ''
      }]
    }));
  };

  const handleUpdateEducation = (id: string, field: keyof Education, value: string) => {
    setFormData(prev => ({
      ...prev,
      educations: prev.educations.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const handleDeleteEducation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      educations: prev.educations.filter(e => e.id !== id)
    }));
  };

  const handleAddExperience = () => {
    setFormData(prev => ({
      ...prev,
      experiences: [...prev.experiences, {
        id: 'exp-' + Date.now(), company: '', position: '', startDate: '', endDate: '', description: ''
      }]
    }));
  };

  const handleUpdateExperience = (id: string, field: keyof Experience, value: string) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const handleDeleteExperience = (id: string) => {
    setFormData(prev => ({
      ...prev,
      experiences: prev.experiences.filter(e => e.id !== id)
    }));
  };

  const handleAddSkill = () => {
    setFormData(prev => ({
      ...prev,
      skills: [...prev.skills, {
        id: 'sk-' + Date.now(), name: '', type: 'تقنية', level: 'متوسط', percentage: 50
      }]
    }));
  };

  const handleUpdateSkill = (id: string, field: keyof Skill, value: any) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const handleDeleteSkill = (id: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(e => e.id !== id)
    }));
  };

  const handleAddContract = () => {
    setFormData(prev => ({
      ...prev,
      contracts: [...prev.contracts, {
        id: 'ctr-' + Date.now(), contractNo: '', type: '', startDate: '', endDate: '', basicSalary: 0, workingHours: 40, department: '', job: '', status: 'ساري'
      }]
    }));
  };

  const handleUpdateContract = (id: string, field: keyof Contract, value: any) => {
    setFormData(prev => ({
      ...prev,
      contracts: prev.contracts.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const handleDeleteContract = (id: string) => {
    setFormData(prev => ({
      ...prev,
      contracts: prev.contracts.filter(e => e.id !== id)
    }));
  };

  const handleAddCertification = () => {
    setFormData(prev => ({
      ...prev,
      certifications: [...prev.certifications, {
        id: 'cert-' + Date.now(), name: '', curriculum: '', issuer: '', issueDate: '', expiryDate: '', durationValue: undefined, durationUnit: 'ساعات', status: 'سارية'
      }]
    }));
  };

  const handleUpdateCertification = (id: string, field: keyof Certification, value: any) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const handleDeleteCertification = (id: string) => {
    setFormData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(e => e.id !== id)
    }));
  };

  const handleAddEquipment = () => {
    setFormData(prev => ({
      ...prev,
      equipments: [...prev.equipments, {
        id: 'eq-' + Date.now(), name: '', type: '', serialNo: '', deliveryDate: '', status: 'جيد', notes: ''
      }]
    }));
  };

  const handleUpdateEquipment = (id: string, field: keyof Equipment, value: string) => {
    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const handleDeleteEquipment = (id: string) => {
    setFormData(prev => ({
      ...prev,
      equipments: prev.equipments.filter(e => e.id !== id)
    }));
  };

  const handleAddDocument = () => {
    if (readOnly) return;
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        setPendingUploadFile(file);
        setShowNameDocModal(true);
      }
    };
    input.click();
  };

  const handleSaveNamedDocument = async (docData: { name: string; type: string; category?: string; notes?: string }) => {
    if (!pendingUploadFile) return;
    try {
      const fileId = await saveFileToLocal(pendingUploadFile);
      let previewUrl: string | undefined = undefined;
      if (pendingUploadFile.type.startsWith('image/')) {
        previewUrl = await getFileFromLocal(fileId) || undefined;
      }
      const newDoc: Document = {
        id: 'doc-' + Date.now(),
        name: docData.name,
        type: docData.type || 'ملف',
        category: (docData.category as any) || 'other',
        uploadDate: new Date().toISOString(),
        fileId: fileId,
        thumbnail: previewUrl,
        notes: docData.notes
      };
      setFormData(prev => ({
        ...prev,
        documents: [newDoc, ...prev.documents]
      }));
      toast(`تم إدراج المستند بنجاح: "${docData.name}" ✅`);
    } catch (error) {
      toast('حدث خطأ أثناء حفظ الملف');
    } finally {
      setShowNameDocModal(false);
      setPendingUploadFile(null);
    }
  };

  const handleSaveDirectScannedDoc = (newDoc: Document) => {
    setFormData(prev => ({
      ...prev,
      documents: [newDoc, ...prev.documents]
    }));
    toast(`تم إدراج المستند من السكانر بنجاح: "${newDoc.name}" ✅`);
  };

  const handleDeleteDocument = (id: string) => {
    const doc = formData.documents.find(e => e.id === id);
    if (doc?.fileId) {
      deleteFileFromLocal(doc.fileId);
    }
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(e => e.id !== id)
    }));
  };

  const handlePhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        try {
          const fileId = await saveFileToLocal(file);
          setFormData(prev => ({ ...prev, photoUrl: fileId }));
        } catch (error) {
          toast('حدث خطأ أثناء حفظ الصورة');
        }
      }
    };
    input.click();
  };

  const handleUpdatePerformanceRating = (field: string, value: any) => {
    if (readOnly) return;
    setFormData(prev => ({
      ...prev,
      performanceRating: {
        score: 8.5,
        level: 'جيد جداً',
        ...(prev.performanceRating || {}),
        [field]: value
      }
    }));
  };


  const printHandoverReceipt = (equipmentName: string, equipmentDetails: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html dir="rtl">
        <head>
          <title>إيصال استلام عهدة</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
            h1 { text-align: center; color: #1e40af; margin-bottom: 5px; }
            h3 { text-align: center; color: #64748b; margin-top: 0; font-weight: normal; }
            .content { font-size: 18px; line-height: 1.8; margin-top: 50px; text-align: right; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .signatures { display: flex; justify-content: space-between; margin-top: 100px; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>إيصال استلام عهدة</h1>
          <h3>الشركة الليبية للتقنية</h3>
          <hr style="margin: 20px 0; border: 0; border-top: 2px solid #e2e8f0;" />
          
          <div class="content">
            <p>أقر أنا الموظف <strong>${formData.fullName}</strong>، الحامل للرقم الوظيفي <strong>${formData.employeeId}</strong>، بأني قد استلمت العهدة التالية بحالة جيدة للقيام بمهام عملي:</p>
            
            <div class="box">
              <strong>نوع العهدة:</strong> ${equipmentName}<br><br>
              <strong>التفاصيل:</strong> ${equipmentDetails || 'لا يوجد'}
            </div>
            
            <p>وأتعهد بالمحافظة عليها واستخدامها في أغراض العمل فقط، وإعادتها للشركة عند الطلب أو عند انتهاء فترة خدمتي.</p>
          </div>
          
          <div class="signatures">
            <div>توقيع الموظف المستلم<br><br>...........................</div>
            <div>التاريخ<br><br>${new Date().toLocaleDateString('ar-SA')}</div>
            <div>اعتماد الإدارة<br><br>...........................</div>
          </div>
          
          <script>
            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
          </script>
        </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const audit = auditEmployee(formData);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {!hideBack && (
            <button 
              onClick={onBack}
              className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"
            >
              <ArrowRight size={24} />
            </button>
          )}
          
          <div className="relative group shrink-0">
            {formData.photoUrl ? (
              <FileImage src={formData.photoUrl} alt={formData.fullName} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md group-hover:opacity-80 transition-opacity" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white group-hover:opacity-80 transition-opacity">
                {formData.fullName ? formData.fullName.charAt(0) : '?'}
              </div>
            )}
            {!readOnly && (
              <div className="absolute inset-0 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md cursor-pointer" onClick={handlePhotoUpload}>
                <CameraIcon />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                value={formData.fullName} 
                readOnly={readOnly}
                onChange={e => handleChange('fullName', e.target.value)} 
                placeholder="الاسم الكامل"
                className="text-2xl font-bold text-slate-800 bg-transparent outline-none placeholder-slate-300 w-full"
              />
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-200 shrink-0 flex items-center gap-1" title="حقل إجباري دائم في النظام لجميع الموظفين">
                <span className="text-red-500 font-bold">*</span>
                إجباري دائم
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <input 
                  type="text" 
                  value={formData.jobTitle} 
                  readOnly={readOnly}
                  onChange={e => handleChange('jobTitle', e.target.value)} 
                  placeholder="المسمى الوظيفي"
                  className="text-slate-500 font-medium bg-transparent outline-none placeholder-slate-300 w-32"
                />
                {isAdmin && !readOnly ? (
                  <button
                    type="button"
                    onClick={() => toggleFieldReq('jobTitle', 'المسمى الوظيفي')}
                    className={clsx(
                      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold transition-all border cursor-pointer select-none",
                      isReq('jobTitle') ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100" : "bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200"
                    )}
                    title={isReq('jobTitle') ? "المسمى الوظيفي: إجباري حالياً. انقر للتحويل إلى اختياري" : "المسمى الوظيفي: اختياري حالياً. انقر للتحويل إلى إجباري"}
                  >
                    <span className={clsx("w-1.5 h-1.5 rounded-full", isReq('jobTitle') ? "bg-red-500" : "bg-slate-400")} />
                    <span>{isReq('jobTitle') ? "* إجباري (تغيير)" : "اختياري (تغيير)"}</span>
                    <SlidersHorizontal size={10} className="opacity-60" />
                  </button>
                ) : (
                  isReq('jobTitle') ? (
                    <span className="text-[10px] text-red-600 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded font-bold" title="مطلوب إجباري">* مطلوب</span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">(اختياري)</span>
                  )
                )}
              </div>
              <span className="text-slate-300">•</span>
              <input 
                type="text" 
                value={formData.employeeId} 
                readOnly={readOnly}
                onChange={e => handleChange('employeeId', e.target.value)} 
                placeholder="الرقم الوظيفي"
                className="text-blue-600 font-mono text-sm bg-blue-50 px-2 py-0.5 rounded outline-none w-24"
              />
            </div>
          </div>
        </div>
        
        
        {!readOnly && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {employee && employee.id && (isAdmin || user?.permissions?.includes('delete_employees')) && (
              <button 
                onClick={() => setShowConfirmDelete(true)} 
                className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Trash2 size={18} />
                حذف الموظف
              </button>
            )}
            
            <button 
              type="button"
              onClick={() => setShowPrintModal(true)} 
              className="px-5 py-2.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 transition-colors flex items-center gap-2 text-sm font-bold print:hidden rounded-lg shadow-2xs cursor-pointer"
              title="معاينة وطباعة ملف الموظف مع اختيار البيانات التي تطبع"
            >
              <Printer size={18} className="text-blue-600" />
              معاينة وطباعة الملف
            </button>
            <button onClick={onBack} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-2 text-sm font-medium">
              <X size={18} />
              إلغاء
            </button>
            <button onClick={handleSave} className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm shadow-blue-200">
              <Save size={18} />
              حفظ التغييرات
            </button>
          </div>
        )}

      </div>

      {/* Main Content Grid */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        
        {/* Vertical Tabs */}
        <div className="w-full lg:w-64 shrink-0 bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden lg:sticky lg:top-24">
          <nav className="flex flex-col p-2 gap-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const missingCountInTab = ['basic', 'work', 'personal', 'bank'].includes(tab.id)
                ? audit.missingFields.filter(f => f.section === tab.id).length
                : 0;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-sm text-right w-full',
                    isActive 
                      ? 'bg-blue-50 text-blue-700 font-semibold' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon size={18} className={isActive ? 'text-blue-600' : 'text-slate-400'} />
                  <span className="flex-1">{tab.label}</span>
                  {missingCountInTab > 0 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200 shrink-0 shadow-2xs">
                      {missingCountInTab} ناقص
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full min-h-[500px]">
          
          {/* تنبيه اكتمال البيانات والخانات غير المدرجة للأقسام الأربعة */}
          {audit.missingFields.length > 0 || audit.hasExpiredDocs || audit.hasExpiringDocs ? (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 via-amber-50 to-white border border-red-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-in fade-in duration-200">
              <div className="flex items-start md:items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg shrink-0 mt-0.5 md:mt-0">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-slate-800 text-sm">تنبيه لمدخل البيانات (نواقص الخانات):</h4>
                    {audit.missingFields.length > 0 && (
                      <span className="text-[11px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded border border-red-200">
                        {audit.missingFields.length} خانة غير مدرجة (مميزة باللون الأحمر)
                      </span>
                    )}
                    {audit.hasExpiredDocs && (
                      <span className="text-[11px] font-bold bg-red-600 text-white px-2 py-0.5 rounded animate-pulse">
                        ⚠️ وثيقة منتهية الصلاحية
                      </span>
                    )}
                    {audit.hasExpiringDocs && (
                      <span className="text-[11px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                        ⏳ وثائق توشك على الانتهاء
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    نسبة اكتمال البيانات: <strong className="text-slate-800">{audit.completionPercentage}%</strong> • الخانات الفارغة في الأقسام الأربعة الأولى محددة بعلامة وإطار أحمر لتسهيل استكمالها.
                  </p>
                </div>
              </div>

              {audit.missingFields.length > 0 && (
                <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                  <span className="text-xs text-slate-500 font-medium">الانتقال للنواقص:</span>
                  {(['basic', 'work', 'personal', 'bank'] as const).map(sKey => {
                    const count = audit.missingFields.filter(f => f.section === sKey).length;
                    if (count === 0) return null;
                    const sName = sKey === 'basic' ? 'الأساسية' : sKey === 'work' ? 'العمل' : sKey === 'personal' ? 'الشخصية' : 'المصرف';
                    return (
                      <button
                        key={sKey}
                        type="button"
                        onClick={() => setActiveTab(sKey)}
                        className="text-xs px-2.5 py-1 bg-white hover:bg-red-50 text-red-700 font-bold border border-red-200 rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <span>{sName}</span>
                        <span className="bg-red-100 text-red-800 text-[10px] px-1.5 py-0.2 rounded-full font-mono">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="mb-6 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs flex items-center justify-between text-emerald-800">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <span>جميع البيانات الأساسية والشخصية والمصرفية والوثائق مدرجة وسارية المفعول بنسبة 100%!</span>
              </div>
              <span className="font-mono bg-white px-2 py-0.5 rounded text-emerald-700 font-bold border border-emerald-200">100% مكتمل</span>
            </div>
          )}
          
          {/* TAB: Basic Info */}
          {activeTab === 'basic' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">المعلومات الأساسية</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <SelectField readOnly={readOnly} fieldKey="status" isRequired={isReq('status')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="حالة الموظف" value={formData.status} onChange={(v: any) => handleChange('status', v)} options={statusOptions} />
                <SelectField readOnly={readOnly} fieldKey="employmentCategory" isRequired={isReq('employmentCategory')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="فئة التوظيف" value={formData.employmentCategory || 'موظف أساسي'} onChange={(v: any) => handleChange('employmentCategory', v)} options={employmentCategoryOptions} />
                
                {formData.employmentCategory === 'متعاون' && !employee && (
                  <div className="md:col-span-2 bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl">
                    <label className="text-xs font-semibold text-indigo-800 block mb-1.5 flex items-center gap-1.5">
                      <Gift size={14} className="text-indigo-600" />
                      إضافة مكافأة أولية (اختياري)
                    </label>
                    <input 
                      type="number"
                      min="0"
                      disabled={readOnly}
                      value={initialBonus}
                      onChange={(e) => setInitialBonus(e.target.value)}
                      placeholder="أدخل قيمة المكافأة بالدينار الليبي..."
                      className="w-full bg-white border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm py-2 px-3 transition-all"
                    />
                    <p className="text-[10px] text-indigo-500 mt-1.5">سيتم إضافة هذه القيمة كسجل مكافأة تلقائياً عند حفظ بيانات الموظف لأول مرة.</p>
                  </div>
                )}

                <InputField readOnly={readOnly} fieldKey="company" isRequired={isReq('company')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="الشركة" value={formData.company} onChange={(v: any) => handleChange('company', v)} />
                <InputField readOnly={readOnly} fieldKey="management" isRequired={isReq('management')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="الإدارة" value={formData.management} onChange={(v: any) => handleChange('management', v)} />
                <InputField readOnly={readOnly} fieldKey="department" isRequired={isReq('department')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="القسم" value={formData.department} onChange={(v: any) => handleChange('department', v)} />
                <InputField readOnly={readOnly} fieldKey="directManager" isRequired={isReq('directManager')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="المدير المباشر" value={formData.directManager} onChange={(v: any) => handleChange('directManager', v)} />
                <InputField readOnly={readOnly} fieldKey="coach" isRequired={isReq('coach')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="الموجه" value={formData.coach} onChange={(v: any) => handleChange('coach', v)} />
                <InputField readOnly={readOnly} fieldKey="tags" isRequired={isReq('tags')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="العلامات (افصل بينها بفاصلة)" value={formData.tags?.join('، ')} onChange={(v: string) => handleChange('tags', v.split('،').map(t=>t.trim()))} className="md:col-span-2" />
                
                <div className="col-span-2 border-t border-slate-100 pt-6 mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <InputField readOnly={readOnly} fieldKey="workEmail" isRequired={isReq('workEmail')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="البريد الإلكتروني للعمل" value={formData.workEmail} onChange={(v: any) => handleChange('workEmail', v)} icon={Mail} type="email" />
                  <InputField readOnly={readOnly} fieldKey="workPhone" isRequired={isReq('workPhone')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="هاتف العمل" value={formData.workPhone} onChange={(v: any) => handleChange('workPhone', v)} icon={Phone} dir="ltr" />
                  <InputField readOnly={readOnly} fieldKey="workMobile" isRequired={isReq('workMobile')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="الهاتف المحمول للعمل" value={formData.workMobile} onChange={(v: any) => handleChange('workMobile', v)} icon={Phone} dir="ltr" />
                </div>
              </div>
              
              {/* Custom fields basic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t border-slate-100 pt-6">
                {renderCustomFields('basic')}
              </div>
            </div>
          )}

          {/* TAB: Work Info */}
          {activeTab === 'work' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">معلومات العمل</h2>
              
              <Section title="الموقع والجدول">
                <InputField readOnly={readOnly} fieldKey="fingerprintId" isRequired={isReq('fingerprintId')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="رقم البصمة في الجهاز (Enroll ID / PIN)" value={formData.fingerprintId || ''} onChange={(v: any) => handleChange('fingerprintId', v)} placeholder="مثال: 1 أو 105" dir="ltr" />
                <InputField readOnly={readOnly} fieldKey="workLocation" isRequired={isReq('workLocation')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="موقع العمل (الفرع)" value={formData.workLocation} onChange={(v: any) => handleChange('workLocation', v)} icon={MapPin} />
                <InputField readOnly={readOnly} fieldKey="workAddress" isRequired={isReq('workAddress')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="عنوان العمل" value={formData.workAddress} onChange={(v: any) => handleChange('workAddress', v)} />
                <InputField readOnly={readOnly} fieldKey="workingHours" isRequired={isReq('workingHours')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="ساعات العمل" value={formData.workingHours} onChange={(v: any) => handleChange('workingHours', v)} icon={Clock} />
                <InputField readOnly={readOnly} fieldKey="timezone" isRequired={isReq('timezone')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="المنطقة الزمنية" value={formData.timezone} onChange={(v: any) => handleChange('timezone', v)} dir="ltr" />
                <InputField readOnly={readOnly} fieldKey="workSchedule" isRequired={isReq('workSchedule')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="جدول أيام العمل" value={formData.workSchedule} onChange={(v: any) => handleChange('workSchedule', v)} className="md:col-span-2" />
              </Section>

              <Section title="العمل عن بعد والتخطيط">
                <SelectField readOnly={readOnly} fieldKey="remoteWorkType" isRequired={isReq('remoteWorkType')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="نوع العمل عن بعد" value={formData.remoteWorkType} onChange={(v: any) => handleChange('remoteWorkType', v)} options={remoteOptions} />
              </Section>

              <Section title="بيانات الدخول للنظام (للمدير والمطور)">
                <InputField readOnly={readOnly} fieldKey="linkedUser" isRequired={isReq('linkedUser')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="اسم المستخدم (للدخول)" value={formData.linkedUser} onChange={(v: any) => handleChange('linkedUser', v)} />
                <InputField readOnly={readOnly} fieldKey="password" isRequired={isReq('password')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="كلمة المرور" value={formData.password || ''} onChange={(v: any) => handleChange('password', v)} type="text" />
              </Section>

              <Section title="الموافقات">
                <InputField readOnly={readOnly} fieldKey="timeOffApprover" isRequired={isReq('timeOffApprover')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="مسؤول اعتماد الإجازات" value={formData.timeOffApprover} onChange={(v: any) => handleChange('timeOffApprover', v)} />
                <InputField readOnly={readOnly} fieldKey="expensesApprover" isRequired={isReq('expensesApprover')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="مسؤول اعتماد المصروفات" value={formData.expensesApprover} onChange={(v: any) => handleChange('expensesApprover', v)} />
                <InputField readOnly={readOnly} fieldKey="timesheetApprover" isRequired={isReq('timesheetApprover')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="مسؤول اعتماد الجداول الزمنية" value={formData.timesheetApprover} onChange={(v: any) => handleChange('timesheetApprover', v)} />
              </Section>
              
              {/* Custom fields work */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t border-slate-100 pt-6">
                {renderCustomFields('work')}
              </div>
            </div>
          )}

          {/* TAB: Personal Info */}
          {activeTab === 'personal' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">المعلومات الشخصية</h2>
              
              <Section title="بيانات الاتصال">
                <InputField readOnly={readOnly} fieldKey="homeAddress" isRequired={isReq('homeAddress')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="عنوان السكن" value={formData.homeAddress} onChange={(v: any) => handleChange('homeAddress', v)} icon={MapPin} className="md:col-span-2" />
                <InputField readOnly={readOnly} fieldKey="personalPhone" isRequired={isReq('personalPhone')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="الهاتف الشخصي" value={formData.personalPhone} onChange={(v: any) => handleChange('personalPhone', v)} icon={Phone} dir="ltr" />
                <InputField readOnly={readOnly} fieldKey="personalEmail" isRequired={isReq('personalEmail')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="البريد الإلكتروني الشخصي" value={formData.personalEmail} onChange={(v: any) => handleChange('personalEmail', v)} icon={Mail} type="email" />
                <InputField readOnly={readOnly} fieldKey="language" isRequired={isReq('language')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="اللغة" value={formData.language} onChange={(v: any) => handleChange('language', v)} />
              </Section>

              <Section title="البيانات الشخصية">
                <SelectField readOnly={readOnly} fieldKey="gender" isRequired={isReq('gender')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="الجنس" value={formData.gender} onChange={(v: any) => handleChange('gender', v)} options={genderOptions} />
                <SelectField readOnly={readOnly} fieldKey="maritalStatus" isRequired={isReq('maritalStatus')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="الحالة الاجتماعية" value={formData.maritalStatus} onChange={(v: any) => handleChange('maritalStatus', v)} options={maritalOptions} />
                <InputField readOnly={readOnly} fieldKey="nationality" isRequired={isReq('nationality')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="الجنسية" value={formData.nationality} onChange={(v: any) => handleChange('nationality', v)} />
                <InputField readOnly={readOnly} fieldKey="childrenCount" isRequired={isReq('childrenCount')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="عدد الأطفال" value={formData.childrenCount} onChange={(v: any) => handleChange('childrenCount', Number(v))} type="number" />
                <InputField readOnly={readOnly} fieldKey="dob" isRequired={isReq('dob')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="تاريخ الميلاد" value={formData.dob} onChange={(v: any) => handleChange('dob', v)} type="date" dir="ltr" />
                <InputField readOnly={readOnly} fieldKey="placeOfBirth" isRequired={isReq('placeOfBirth')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="مكان الميلاد" value={formData.placeOfBirth} onChange={(v: any) => handleChange('placeOfBirth', v)} />
              </Section>

              <Section title="الهوية والمستندات">
                <div className="md:col-span-2">
                  <InputField readOnly={readOnly} fieldKey="nationalId" isRequired={isReq('nationalId')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="الرقم الوطني" value={formData.nationalId} onChange={(v: any) => handleChange('nationalId', v)} dir="ltr" />
                </div>
                
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 pt-5 mt-2">
                  <InputField readOnly={readOnly} fieldKey="passportNo" isRequired={isReq('passportNo')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="رقم جواز السفر" value={formData.passportNo} onChange={(v: any) => handleChange('passportNo', v)} dir="ltr" />
                  <InputField readOnly={readOnly} fieldKey="passportIssueDate" isRequired={isReq('passportIssueDate')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="تاريخ الإصدار" value={formData.passportIssueDate || ''} onChange={(v: any) => handleChange('passportIssueDate', v)} type="date" dir="ltr" />
                  <InputField readOnly={readOnly} fieldKey="passportExpiryDate" isRequired={isReq('passportExpiryDate')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="تاريخ الانتهاء" value={formData.passportExpiryDate || ''} onChange={(v: any) => handleChange('passportExpiryDate', v)} type="date" dir="ltr" />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 pt-5 mt-2">
                  <InputField readOnly={readOnly} fieldKey="visaNo" isRequired={isReq('visaNo')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="رقم التأشيرة" value={formData.visaNo} onChange={(v: any) => handleChange('visaNo', v)} dir="ltr" />
                  <InputField readOnly={readOnly} fieldKey="visaIssueDate" isRequired={isReq('visaIssueDate')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="تاريخ الإصدار" value={formData.visaIssueDate || ''} onChange={(v: any) => handleChange('visaIssueDate', v)} type="date" dir="ltr" />
                  <InputField readOnly={readOnly} fieldKey="visaExpiry" isRequired={isReq('visaExpiry')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="تاريخ الانتهاء" value={formData.visaExpiry} onChange={(v: any) => handleChange('visaExpiry', v)} type="date" dir="ltr" />
                </div>

                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 pt-5 mt-2">
                  <InputField readOnly={readOnly} fieldKey="workPermitNo" isRequired={isReq('workPermitNo')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="رقم تصريح العمل" value={formData.workPermitNo} onChange={(v: any) => handleChange('workPermitNo', v)} dir="ltr" />
                  <div className="hidden md:block"></div>
                  <InputField readOnly={readOnly} fieldKey="permitExpiry" isRequired={isReq('permitExpiry')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="تاريخ الانتهاء" value={formData.permitExpiry} onChange={(v: any) => handleChange('permitExpiry', v)} type="date" dir="ltr" />
                </div>
              </Section>

              <Section title="جهة الاتصال في حالات الطوارئ">
                <InputField readOnly={readOnly} fieldKey="emergencyContactName" isRequired={isReq('emergencyContactName')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="الاسم (اقرب الاقارب)" value={formData.emergencyContactName} onChange={(v: any) => handleChange('emergencyContactName', v)} />
                <InputField readOnly={readOnly} fieldKey="emergencyContactRelation" isRequired={isReq('emergencyContactRelation')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="صلة القرابة" value={formData.emergencyContactRelation} onChange={(v: any) => handleChange('emergencyContactRelation', v)} />
                <InputField readOnly={readOnly} fieldKey="emergencyContactPhone" isRequired={isReq('emergencyContactPhone')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="رقم الهاتف" value={formData.emergencyContactPhone} onChange={(v: any) => handleChange('emergencyContactPhone', v)} icon={Phone} dir="ltr" />
                <InputField readOnly={readOnly} fieldKey="emergencyContactPhone2" isRequired={isReq('emergencyContactPhone2')} isAdmin={isAdmin} onToggleRequired={toggleFieldReq} label="رقم هاتف بديل" value={formData.emergencyContactPhone2 || ''} onChange={(v: any) => handleChange('emergencyContactPhone2', v)} icon={Phone} dir="ltr" />
              </Section>
              
              {/* Custom fields personal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t border-slate-100 pt-6">
                {renderCustomFields('personal')}
              </div>
            </div>
          )}

          {/* TAB: Bank Info (بيانات المصرف) */}
          {activeTab === 'bank' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <Landmark className="text-blue-600" size={24} />
                    بيانات المصرف والحساب البنكي
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    المعلومات والبيانات المصرفية الرسمية لتحويل المرتبات والمستحقات المالية للموظف
                  </p>
                </div>
                {formData.bankName && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2">
                    <CreditCard size={16} className="text-blue-600" />
                    <span>{formData.bankName}</span>
                    {formData.bankBranch && <span className="text-blue-600 font-normal">({formData.bankBranch})</span>}
                  </div>
                )}
              </div>

              <Section title="البيانات المصرفية الأساسية">
                <InputField 
                  readOnly={readOnly} 
                  fieldKey="bankName" 
                  isRequired={isReq('bankName')} 
                  isAdmin={isAdmin} 
                  onToggleRequired={toggleFieldReq} 
                  label="1. اسم المصرف" 
                  placeholder="مثال: مصرف الجمهورية، مصرف التجارة والتنمية، المصرف التجاري الوطني، مصرف الصحاري..." 
                  value={formData.bankName || ''} 
                  onChange={(v: any) => handleChange('bankName', v)} 
                  icon={Landmark}
                />
                <InputField 
                  readOnly={readOnly} 
                  fieldKey="bankBranch" 
                  isRequired={isReq('bankBranch')} 
                  isAdmin={isAdmin} 
                  onToggleRequired={toggleFieldReq} 
                  label="2. فرع المصرف" 
                  placeholder="مثال: فرع طرابلس الرئيسي، فرع بنغازي، فرع مصراتة..." 
                  value={formData.bankBranch || ''} 
                  onChange={(v: any) => handleChange('bankBranch', v)} 
                  icon={Building}
                />
                <InputField 
                  readOnly={readOnly} 
                  fieldKey="bankAccountNumber" 
                  isRequired={isReq('bankAccountNumber')} 
                  isAdmin={isAdmin} 
                  onToggleRequired={toggleFieldReq} 
                  label="3. رقم الحساب المصرفي" 
                  placeholder="مثال: 001-123456-001" 
                  value={formData.bankAccountNumber || ''} 
                  onChange={(v: any) => handleChange('bankAccountNumber', v)} 
                  icon={CreditCard}
                  dir="ltr"
                />
                <InputField 
                  readOnly={readOnly} 
                  fieldKey="bankIban" 
                  isRequired={isReq('bankIban')} 
                  isAdmin={isAdmin} 
                  onToggleRequired={toggleFieldReq} 
                  label="4. رقم الآيبان الدولي (IBAN)" 
                  placeholder="مثال: LY00 0000 0000 0000 0000 0000" 
                  value={formData.bankIban || ''} 
                  onChange={(v: any) => handleChange('bankIban', v)} 
                  dir="ltr"
                  className="md:col-span-2 font-mono"
                />
                <InputField 
                  readOnly={readOnly} 
                  fieldKey="bankAccountHolder" 
                  isRequired={isReq('bankAccountHolder')} 
                  isAdmin={isAdmin} 
                  onToggleRequired={toggleFieldReq} 
                  label="اسم صاحب الحساب كما هو مقيد بالمصرف" 
                  placeholder="الاسم الكامل لصاحب الحساب المصرفي..." 
                  value={formData.bankAccountHolder || ''} 
                  onChange={(v: any) => handleChange('bankAccountHolder', v)} 
                  icon={UserIcon}
                  className="md:col-span-2"
                />
              </Section>

              <Section title="تفاصيل التحويل والعملة">
                <InputField 
                  readOnly={readOnly} 
                  fieldKey="bankSwift" 
                  isRequired={isReq('bankSwift')} 
                  isAdmin={isAdmin} 
                  onToggleRequired={toggleFieldReq} 
                  label="رمز السويفت (SWIFT / BIC)" 
                  placeholder="مثال: JUMBTRTT" 
                  value={formData.bankSwift || ''} 
                  onChange={(v: any) => handleChange('bankSwift', v)} 
                  dir="ltr"
                />
                <SelectField 
                  readOnly={readOnly} 
                  fieldKey="bankAccountType" 
                  isRequired={isReq('bankAccountType')} 
                  isAdmin={isAdmin} 
                  onToggleRequired={toggleFieldReq} 
                  label="نوع الحساب المصرفي" 
                  value={formData.bankAccountType || 'حساب جاري'} 
                  onChange={(v: any) => handleChange('bankAccountType', v)} 
                  options={bankAccountTypeOptions} 
                />
                <SelectField 
                  readOnly={readOnly} 
                  fieldKey="bankCurrency" 
                  isRequired={isReq('bankCurrency')} 
                  isAdmin={isAdmin} 
                  onToggleRequired={toggleFieldReq} 
                  label="عملة الحساب" 
                  value={formData.bankCurrency || 'دينار ليبي (LYD)'} 
                  onChange={(v: any) => handleChange('bankCurrency', v)} 
                  options={bankCurrencyOptions} 
                />
                <InputField 
                  readOnly={readOnly} 
                  fieldKey="bankNotes" 
                  isRequired={isReq('bankNotes')} 
                  isAdmin={isAdmin} 
                  onToggleRequired={toggleFieldReq} 
                  label="ملاحظات أو تعليمات مصرفية" 
                  placeholder="مثال: تحويل المرتب تلقائياً، حساب رئيسي..." 
                  value={formData.bankNotes || ''} 
                  onChange={(v: any) => handleChange('bankNotes', v)} 
                />
              </Section>

              {/* Custom fields bank */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 border-t border-slate-100 pt-6">
                {renderCustomFields('bank')}
              </div>
            </div>
          )}

          {/* TAB: Education */}
          {activeTab === 'education' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">المؤهلات العلمية</h2>
                  <p className="text-xs text-slate-500 mt-0.5">الدرجات العلمية والجامعية والدبلومات المعتمدة للموظف</p>
                </div>
                {!readOnly && (
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={() => handleOpenScanner('certificate', 'شهادة المؤهل العلمي')} 
                      className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                    >
                      <Scan size={15} />
                      <span>مسح المؤهل بالسكنر 📠</span>
                    </button>
                    <button 
                      type="button"
                      onClick={handleAddEducation} 
                      className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                    >
                      إضافة مؤهل يدوي
                    </button>
                  </div>
                )}
              </div>
              
              {formData.educations.map(edu => (
                <div key={edu.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-blue-300">
                  {!readOnly && <button onClick={() => handleDeleteEducation(edu.id)} className="absolute top-4 left-4 p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <InputField readOnly={readOnly} label="الدرجة العلمية" value={edu.degree} onChange={(v: any) => handleUpdateEducation(edu.id, 'degree', v)} />
                    <InputField readOnly={readOnly} label="التخصص" value={edu.major} onChange={(v: any) => handleUpdateEducation(edu.id, 'major', v)} />
                    <InputField readOnly={readOnly} label="الجهة المانحة ومكانها (ليبية أو أجنبية :مثل روسيا بريطانيا)" value={edu.institution} onChange={(v: any) => handleUpdateEducation(edu.id, 'institution', v)} className="md:col-span-2" />
                    <InputField readOnly={readOnly} label="تاريخ البداية" value={edu.startDate} onChange={(v: any) => handleUpdateEducation(edu.id, 'startDate', v)} type="date" dir="ltr" />
                    <InputField readOnly={readOnly} label="تاريخ التخرج" value={edu.gradDate} onChange={(v: any) => handleUpdateEducation(edu.id, 'gradDate', v)} type="date" dir="ltr" />
                    <InputField readOnly={readOnly} label="الوصف" value={edu.description} onChange={(v: any) => handleUpdateEducation(edu.id, 'description', v)} className="md:col-span-2" />
                  </div>
                </div>
              ))}
              {formData.educations.length === 0 && <EmptyState message="لا يوجد مؤهلات مسجلة" />}
            </div>
          )}

          {/* TAB: Experience */}
          {activeTab === 'experience' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">الخبرات السابقة</h2>
                {!readOnly && <button onClick={handleAddExperience} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors">إضافة خبرة</button>}
              </div>
              
              {formData.experiences.map(exp => (
                <div key={exp.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-blue-300">
                  {!readOnly && <button onClick={() => handleDeleteExperience(exp.id)} className="absolute top-4 left-4 p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <InputField readOnly={readOnly} label="الشركة / المؤسسة" value={exp.company} onChange={(v: any) => handleUpdateExperience(exp.id, 'company', v)} />
                    <InputField readOnly={readOnly} label="المنصب" value={exp.position} onChange={(v: any) => handleUpdateExperience(exp.id, 'position', v)} />
                    <InputField readOnly={readOnly} label="تاريخ البداية" value={exp.startDate} onChange={(v: any) => handleUpdateExperience(exp.id, 'startDate', v)} type="date" dir="ltr" />
                    <InputField readOnly={readOnly} label="تاريخ النهاية" value={exp.endDate} onChange={(v: any) => handleUpdateExperience(exp.id, 'endDate', v)} type="date" dir="ltr" />
                    <InputField readOnly={readOnly} label="وصف الخبرة" value={exp.description} onChange={(v: any) => handleUpdateExperience(exp.id, 'description', v)} className="md:col-span-2" />
                  </div>
                </div>
              ))}
              {formData.experiences.length === 0 && <EmptyState message="لا يوجد خبرات مسجلة" />}
            </div>
          )}

          {/* TAB: Skills */}
          {activeTab === 'skills' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">المهارات</h2>
                {!readOnly && <button onClick={handleAddSkill} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors">إضافة مهارة</button>}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {formData.skills.map(skill => (
                  <div key={skill.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-blue-300">
                    {!readOnly && <button onClick={() => handleDeleteSkill(skill.id)} className="absolute top-2 left-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <InputField readOnly={readOnly} label="المهارة" value={skill.name} onChange={(v: any) => handleUpdateSkill(skill.id, 'name', v)} className="col-span-2" />
                      <InputField readOnly={readOnly} label="النوع" value={skill.type} onChange={(v: any) => handleUpdateSkill(skill.id, 'type', v)} />
                      <SelectField readOnly={readOnly} label="المستوى" value={skill.level} onChange={(v: any) => handleUpdateSkill(skill.id, 'level', v)} options={skillLevels} />
                      <div className="col-span-2">
                        <label className="text-xs font-semibold text-slate-500 block mb-1.5">نسبة الإتقان ({skill.percentage}%)</label>
                        <input disabled={readOnly} type="range" min="0" max="10" step="0.1" value={skill.percentage} onChange={(e) => handleUpdateSkill(skill.id, 'percentage', parseInt(e.target.value))} className={clsx("w-full accent-blue-600", readOnly && "opacity-60 cursor-not-allowed")} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {formData.skills.length === 0 && <EmptyState message="لا يوجد مهارات مسجلة" />}
            </div>
          )}

          {/* TAB: Contracts */}
          {activeTab === 'contracts' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">العقود</h2>
                {!readOnly && <button onClick={handleAddContract} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors">إضافة عقد جديد</button>}
              </div>
              
              {formData.contracts.map(contract => (
                <div key={contract.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-blue-300">
                  {!readOnly && <button onClick={() => handleDeleteContract(contract.id)} className="absolute top-4 left-4 p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <InputField readOnly={readOnly} label="رقم العقد" value={contract.contractNo} onChange={(v: any) => handleUpdateContract(contract.id, 'contractNo', v)} dir="ltr" />
                    <InputField readOnly={readOnly} label="نوع العقد" value={contract.type} onChange={(v: any) => handleUpdateContract(contract.id, 'type', v)} />
                    <SelectField readOnly={readOnly} label="الحالة" value={contract.status} onChange={(v: any) => handleUpdateContract(contract.id, 'status', v)} options={contractStatus} />
                    <InputField readOnly={readOnly} label="تاريخ البداية" value={contract.startDate} onChange={(v: any) => handleUpdateContract(contract.id, 'startDate', v)} type="date" dir="ltr" />
                    <InputField readOnly={readOnly} label="تاريخ النهاية" value={contract.endDate} onChange={(v: any) => handleUpdateContract(contract.id, 'endDate', v)} type="date" dir="ltr" />
                    <InputField readOnly={readOnly} label="الراتب الأساسي" value={contract.basicSalary} onChange={(v: any) => handleUpdateContract(contract.id, 'basicSalary', Number(v))} type="number" dir="ltr" />
                    <InputField readOnly={readOnly} label="ساعات العمل" value={contract.workingHours} onChange={(v: any) => handleUpdateContract(contract.id, 'workingHours', Number(v))} type="number" dir="ltr" />
                    <InputField readOnly={readOnly} label="القسم" value={contract.department} onChange={(v: any) => handleUpdateContract(contract.id, 'department', v)} />
                    <InputField readOnly={readOnly} label="الوظيفة" value={contract.job} onChange={(v: any) => handleUpdateContract(contract.id, 'job', v)} />
                  </div>
                </div>
              ))}
              {formData.contracts.length === 0 && <EmptyState message="لا يوجد عقود مسجلة" />}
            </div>
          )}

          {/* TAB: Certifications */}
          {activeTab === 'certifications' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
               <div>
                 <h2 className="text-xl font-bold text-slate-800">شهادات الدورات والتأهيل</h2>
                 <p className="text-xs text-slate-500 mt-0.5">توثيق الشهادات العلمية والدورات مع إمكانية مسح الشهادة الورقية مباشرة من السكنر</p>
               </div>
               {!readOnly && (
                 <div className="flex items-center gap-2">
                   <button 
                     type="button"
                     onClick={() => handleOpenScanner('certificate', 'شهادة دورة تدريبية')} 
                     className="text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 px-3.5 py-2 rounded-lg transition-all flex items-center gap-1.5 shadow-sm shadow-blue-500/20 cursor-pointer"
                   >
                     <Scan size={15} />
                     <span>سحب شهادة بالسكنر 📠</span>
                   </button>
                   <button 
                     type="button"
                     onClick={handleAddCertification} 
                     className="text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
                   >
                     إضافة شهادة يدوياً
                   </button>
                 </div>
               )}
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {formData.certifications.map(cert => (
                  <div key={cert.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-blue-300">
                    {!readOnly && <button onClick={() => handleDeleteCertification(cert.id)} className="absolute top-2 left-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <InputField readOnly={readOnly} label="اسم الشهادة / الكورس" value={cert.name} onChange={(v: any) => handleUpdateCertification(cert.id, 'name', v)} className="col-span-2" placeholder="مثال: كورس الشبكات" />
                      <InputField readOnly={readOnly} label="المنهج / الشهادة المنهجية" value={cert.curriculum || ''} onChange={(v: any) => handleUpdateCertification(cert.id, 'curriculum', v)} className="col-span-2" placeholder="مثال: CCNA" />
                      <div className="col-span-2 grid grid-cols-2 gap-3">
                        <InputField readOnly={readOnly} label="فترة الدورة (ساعات , أيام , أسابيع)" value={cert.durationValue || ''} onChange={(v: any) => handleUpdateCertification(cert.id, 'durationValue', Number(v) || undefined)} type="number" placeholder="0" />
                        <SelectField readOnly={readOnly} label="الوحدة" value={cert.durationUnit || 'ساعات'} onChange={(v: any) => handleUpdateCertification(cert.id, 'durationUnit', v)} options={durationUnits} />
                      </div>
                      <InputField readOnly={readOnly} label="الجهة المانحة" value={cert.issuer} onChange={(v: any) => handleUpdateCertification(cert.id, 'issuer', v)} className="col-span-2" />
                      <InputField readOnly={readOnly} label="تاريخ الإصدار" value={cert.issueDate} onChange={(v: any) => handleUpdateCertification(cert.id, 'issueDate', v)} type="date" dir="ltr" />
                      <InputField readOnly={readOnly} label="تاريخ الانتهاء" value={cert.expiryDate} onChange={(v: any) => handleUpdateCertification(cert.id, 'expiryDate', v)} type="date" dir="ltr" />
                      <SelectField readOnly={readOnly} label="الحالة" value={cert.status} onChange={(v: any) => handleUpdateCertification(cert.id, 'status', v)} options={certStatus} className="col-span-2" />
                    </div>
                  </div>
                ))}
             </div>
             {formData.certifications.length === 0 && <EmptyState message="لا يوجد شهادات دورات مسجلة" />}
           </div>
          )}

          {/* TAB: Equipment */}
          {activeTab === 'equipment' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-between items-center border-b border-slate-100 pb-4">
               <h2 className="text-xl font-bold text-slate-800">العهدات</h2>
               {!readOnly && <button onClick={handleAddEquipment} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors">تخصيص عهدة</button>}
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {formData.equipments.map(eq => (
                  <div key={eq.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-blue-300">
                    <button type="button" onClick={() => printHandoverReceipt(eq.name, eq.notes || '')} className="absolute top-2 left-10 p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="طباعة إيصال الاستلام"><Printer size={16}/></button>
                    {!readOnly && <button type="button" onClick={() => handleDeleteEquipment(eq.id)} className="absolute top-2 left-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <InputField readOnly={readOnly} label="الاسم" value={eq.name} onChange={(v: any) => handleUpdateEquipment(eq.id, 'name', v)} className="col-span-2" />
                      <InputField readOnly={readOnly} label="النوع" value={eq.type} onChange={(v: any) => handleUpdateEquipment(eq.id, 'type', v)} />
                      <SelectField readOnly={readOnly} label="الحالة" value={eq.status} onChange={(v: any) => handleUpdateEquipment(eq.id, 'status', v)} options={eqStatus} />
                      <InputField readOnly={readOnly} label="الرقم التسلسلي" value={eq.serialNo} onChange={(v: any) => handleUpdateEquipment(eq.id, 'serialNo', v)} dir="ltr" className="col-span-2" />
                      <InputField readOnly={readOnly} label="تاريخ التسليم" value={eq.deliveryDate} onChange={(v: any) => handleUpdateEquipment(eq.id, 'deliveryDate', v)} type="date" dir="ltr" />
                      <InputField readOnly={readOnly} label="الملاحظات" value={eq.notes} onChange={(v: any) => handleUpdateEquipment(eq.id, 'notes', v)} className="col-span-2" />
                    </div>
                  </div>
                ))}
             </div>
             {formData.equipments.length === 0 && <EmptyState message="لا يوجد عهدات مسجلة" />}
           </div>
          )}

          {/* TAB: Documents */}
          {activeTab === 'documents' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             {/* Header with Direct Document Upload */}
             <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
               <div className="flex items-center gap-3.5">
                 <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                   <FileText size={24} />
                 </div>
                 <div>
                   <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                     مستندات ووثائق الموظف
                     <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                       {formData.documents.length} مستند
                     </span>
                   </h2>
                   <p className="text-xs text-slate-500 mt-0.5">
                     أرشفة وتسمية الأوراق الثبوتية والشهادات (مثل: شهادة ميلاد، بطاقة هوية، عقد عمل، رخصة قيادة)
                   </p>
                 </div>
               </div>

               {!readOnly && (
                 <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                   <button
                     type="button"
                     onClick={handleAddDocument}
                     className="flex-1 sm:flex-none px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-2xs cursor-pointer hover:border-slate-400"
                   >
                     <UploadCloud size={16} className="text-blue-600" />
                     <span>رفع ملف</span>
                   </button>

                   <button
                     type="button"
                     onClick={() => setShowDirectScannerModal(true)}
                     className="flex-1 sm:flex-none px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer hover:shadow-md"
                   >
                     <Printer size={16} />
                     <span>اختيار الماسح وبدء المسح</span>
                   </button>
                 </div>
               )}
             </div>

             {/* عنوان خانة المستندات */}
             <div className="flex items-center justify-between pt-1">
               <div className="flex items-center gap-2">
                 <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                   <span>خانة المستندات والأوراق المرفقة للموظف</span>
                   <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-bold border border-blue-200">
                     {formData.documents.length} مستند
                   </span>
                 </h3>
               </div>

               {!readOnly && formData.documents.length > 0 && (
                 <div className="flex items-center gap-2">
                   <button
                     type="button"
                     onClick={handleAddDocument}
                     className="text-xs font-bold text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                   >
                     <UploadCloud size={14} className="text-blue-600" />
                     <span>رفع ملف</span>
                   </button>
                   <button
                     type="button"
                     onClick={() => setShowDirectScannerModal(true)}
                     className="text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                   >
                     <Printer size={14} />
                     <span>اختيار الماسح وبدء المسح</span>
                   </button>
                 </div>
               )}
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {formData.documents.map(doc => (
                  <div 
                    key={doc.id} 
                    className="p-4 border border-slate-200 rounded-xl bg-white hover:border-blue-400 hover:shadow-lg transition-all group flex flex-col justify-between relative overflow-hidden"
                  >
                    {/* Top Badges */}
                    <div className="flex items-center justify-between gap-1 mb-2.5">
                      <div className="flex items-center gap-1 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {doc.name.includes('شهادة') ? 'شهادة رسمية' : doc.name.includes('ميلاد') ? 'شهادة ميلاد' : doc.name.includes('عقد') ? 'عقد عمل' : doc.name.includes('هوية') ? 'بطاقة هوية' : 'مستند مرفق'}
                        </span>
                        {doc.source === 'scanner' && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-0.5">
                            <Printer size={10} />
                            <span>سكانر</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                        {formatDate(doc.uploadDate).split(' ')[0]}
                      </span>
                    </div>
                    {/* Preview Box */}
                    <div 
                      onClick={() => {
                        setSelectedViewingDoc(doc);
                        setShowViewerModal(true);
                      }}
                      className="relative w-full h-36 bg-slate-100 rounded-lg overflow-hidden border border-slate-200/80 mb-3 flex items-center justify-center cursor-pointer group-hover:border-blue-300 transition-colors"
                    >
                      {doc.thumbnail ? (
                        <img 
                          src={doc.thumbnail} 
                          alt={doc.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : doc.fileId ? (
                        <FileImage 
                          src={doc.fileId} 
                          alt={doc.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400">
                          <FileText size={36} className="text-slate-300 group-hover:text-blue-500 transition-colors mb-1" />
                          <span className="text-[11px]">مستند محفوظ</span>
                        </div>
                      )}

                      {/* Hover Overlay with Eye */}
                      <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-2xs">
                        <span className="bg-white/90 text-slate-800 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md">
                          <Eye size={14} className="text-blue-600" />
                          معاينة وتكبير
                        </span>
                      </div>
                    </div>

                    {/* Document Info */}
                    <div className="space-y-1 mb-3">
                      <h4 className="font-bold text-slate-800 text-xs truncate w-full" title={doc.name}>
                        {doc.name}
                      </h4>
                      {doc.documentNo && (
                        <p className="text-[11px] text-slate-500 font-mono" dir="ltr">
                          رقم: {doc.documentNo}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-[10px] text-slate-400">
                        <span>الإدراج:</span>
                        <span className="font-mono" dir="ltr">{formatDate(doc.uploadDate)}</span>
                      </div>
                    </div>

                    {/* Bottom Action Toolbar */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1 text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedViewingDoc(doc);
                          setShowViewerModal(true);
                        }}
                        className="flex-1 py-1.5 px-2 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg font-bold flex items-center justify-center gap-1 transition-colors cursor-pointer border border-slate-200"
                        title="معاينة وطباعة"
                      >
                        <Eye size={13} />
                        <span>معاينة</span>
                      </button>

                      {doc.fileId && (
                        <button 
                          type="button"
                          onClick={async () => {
                            const dataUrl = await getFileFromLocal(doc.fileId!);
                            if(dataUrl) {
                              const a = document.createElement('a');
                              a.href = dataUrl;
                              a.download = doc.name;
                              a.click();
                            }
                          }} 
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                          title="تنزيل الملف"
                        >
                          <Download size={14}/>
                        </button>
                      )}

                      {!readOnly && (
                        <button 
                          type="button"
                          onClick={() => handleDeleteDocument(doc.id)} 
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer border border-slate-200"
                          title="حذف المستند"
                        >
                          <Trash2 size={14}/>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
             </div>
             {formData.documents.length === 0 && (
               <div 
                 onClick={!readOnly ? handleAddDocument : undefined}
                 className={`py-14 bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center text-center p-6 transition-all ${
                   !readOnly ? 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/40' : ''
                 }`}
               >
                 <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3 border border-blue-100 shadow-xs">
                   <UploadCloud size={30} />
                 </div>
                 <h3 className="text-base font-bold text-slate-800 mb-1">لا توجد مستندات مرفقة للموظف حتى الآن</h3>
                 <p className="text-xs text-slate-500 max-w-md mb-5 leading-relaxed">
                   اضغط هنا أو على الزر بالأسفل لرفع وتسمية أي مستند أو وثيقة (مثل: شهادة ميلاد، بطاقة هوية، عقد عمل، أو شهادة تخرج).
                 </p>
                 
                 {!readOnly && (
                   <div className="flex flex-wrap items-center justify-center gap-3">
                     <button
                       type="button"
                       onClick={(e) => {
                         e.stopPropagation();
                         handleAddDocument();
                       }}
                       className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-2xs cursor-pointer hover:border-slate-400"
                     >
                       <UploadCloud size={16} className="text-blue-600" />
                       <span>رفع ملف من الجهاز</span>
                     </button>

                     <button
                       type="button"
                       onClick={(e) => {
                         e.stopPropagation();
                         setShowDirectScannerModal(true);
                       }}
                       className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm cursor-pointer hover:shadow-md"
                     >
                       <Printer size={16} />
                       <span>اختيار الماسح وبدء المسح</span>
                     </button>
                   </div>
                 )}
               </div>
             )}
           </div>
          )}

          {/* TAB: Performance */}
          {activeTab === 'performance' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">تقييم الأداء والمتابعة</h2>
                  <p className="text-sm text-slate-500 mt-1">تقييم كفاءة الموظف وتحديد مستوى الأداء العام</p>
                </div>
                {formData.performanceRating && (
                  <div className="flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-2 rounded-xl border border-amber-200">
                    <Star size={20} className="text-amber-500 fill-amber-500" />
                    <span className="font-bold text-lg">{formData.performanceRating.score}/10</span>
                    <span className="text-sm font-semibold">({formData.performanceRating.level})</span>
                  </div>
                )}
              </div>

              <Section title="تفاصيل تقييم الأداء">
                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 block mb-1.5">نسبة التقييم (من 10)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="10" step="0.1" 
                      readOnly={readOnly}
                      value={formData.performanceRating?.score ?? ''} 
                      onChange={(e) => handleUpdatePerformanceRating('score', Number(e.target.value))}
                      placeholder="مثال: 9.5" 
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm py-2 px-3 transition-all"
                    />
                  </div>
                  <SelectField 
                    readOnly={readOnly} 
                    label="مستوى التقييم" 
                    value={formData.performanceRating?.level || 'ممتاز'} 
                    onChange={(v: any) => handleUpdatePerformanceRating('level', v)} 
                    options={performanceLevelOptions} 
                  />
                  <InputField 
                    readOnly={readOnly} 
                    label="تاريخ التقييم" 
                    value={formData.performanceRating?.lastEvaluationDate || ''} 
                    onChange={(v: any) => handleUpdatePerformanceRating('lastEvaluationDate', v)} 
                    type="date" 
                    dir="ltr" 
                  />
                  <InputField 
                    readOnly={readOnly} 
                    label="اسم المُقيّم / المدير المباشر" 
                    value={formData.performanceRating?.evaluator || ''} 
                    onChange={(v: any) => handleUpdatePerformanceRating('evaluator', v)} 
                    placeholder="اسم المسؤول عن التقييم" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-semibold text-slate-500 block mb-1.5">ملاحظات التقييم والتوصيات</label>
                  <textarea 
                    readOnly={readOnly}
                    rows={4}
                    value={formData.performanceRating?.notes || ''} 
                    onChange={(e) => handleUpdatePerformanceRating('notes', e.target.value)}
                    placeholder="أدخل ملاحظات حول أداء الموظف، نقاط القوة، ومجالات التطوير..." 
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm p-3 transition-all"
                  />
                </div>
              </Section>
            </div>
          )}

          {/* TAB: Audit */}
          {activeTab === 'audit' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-between items-center border-b border-slate-100 pb-4">
               <h2 className="text-xl font-bold text-slate-800">سجل النظام (Audit Log)</h2>
             </div>
             
             <div className="relative border-r-2 border-slate-200 pr-6 ml-4">
                {formData.auditLogs.map((log) => (
                  <div key={log.id} className="mb-8 relative">
                    <div className="absolute w-3 h-3 bg-blue-500 rounded-full -right-[29px] top-1.5 border-4 border-white"></div>
                    <div className="text-xs font-mono text-slate-400 mb-1" dir="ltr">
                      {formatDate(log.date)}
                    </div>
                    <h4 className="font-bold text-slate-800">{log.action}</h4>
                    <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                    <p className="text-xs font-medium text-slate-500 mt-2 bg-slate-100 inline-block px-2 py-1 rounded">بواسطة: {log.user}</p>
                  </div>
                ))}
             </div>
           </div>
          )}

      {showConfirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-center text-slate-800 mb-2">تأكيد الحذف</h3>
              <p className="text-slate-600 text-center mb-6">
                هل أنت متأكد من حذف الموظف نهائياً؟ لا يمكن التراجع عن هذا الإجراء.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowConfirmDelete(false)} 
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 font-medium transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  onClick={() => {
                    if (employee) {
                      deleteEmployee(employee.id);
                      addSystemLog({ userId: 'system', userName: 'Administrator', action: 'حذف موظف', details: 'تم حذف الموظف ' + employee.fullName });
                      toast('تم حذف الموظف بنجاح');
                      onBack();
                    }
                  }} 
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
                >
                  نعم، احذف الموظف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Field Requirements Modal (Manager only) */}
      <FieldRequirementsModal
        isOpen={showFieldRequirementsModal}
        onClose={() => setShowFieldRequirementsModal(false)}
      />

      {/* Custom Field / Button Modal (Manager only) */}
      <CustomFieldModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        section={customModalSection}
        employeeName={formData.fullName}
        onSave={handleSaveCustomField}
      />

      {/* Official Employee Print & Preview Modal */}
      <EmployeePrintModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        employee={formData}
        companyName={systemSettings?.companyName}
      />

      {/* Document Scanner & Digitization Modal */}
      <DocumentScannerModal
        isOpen={showScannerModal}
        onClose={() => setShowScannerModal(false)}
        onSaveDocument={handleSaveScannedDocument}
        employeeName={formData.fullName || 'موظف جديد'}
        initialCategory={scannerCategory}
        initialTitle={scannerInitialTitle}
      />

      {/* Document Viewer & Print Modal */}
      <DocumentViewerModal
        isOpen={showViewerModal}
        onClose={() => {
          setShowViewerModal(false);
          setSelectedViewingDoc(null);
        }}
        document={selectedViewingDoc}
        employeeName={formData.fullName || 'الموظف'}
        onDelete={handleDeleteDocument}
        readOnly={readOnly}
      />

      {/* Name & Upload Document Modal */}
      <NameAndUploadDocumentModal
        isOpen={showNameDocModal}
        onClose={() => {
          setShowNameDocModal(false);
          setPendingUploadFile(null);
        }}
        file={pendingUploadFile}
        onSave={handleSaveNamedDocument}
      />

      {/* Direct Scanner Modal */}
      <DirectScannerModal
        isOpen={showDirectScannerModal}
        onClose={() => setShowDirectScannerModal(false)}
        onSaveDocument={handleSaveDirectScannedDoc}
        employeeName={formData.fullName || 'الموظف'}
      />

        </div>
      </div>
    </div>
  );
}

// Helpers

const formatDate = (dateStr: string) => {
  if (!dateStr) return '-';
  try {
    return format(new Date(dateStr), 'yyyy-MM-dd HH:mm');
  } catch (e) {
    return dateStr;
  }
}

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"></path>
    <circle cx="12" cy="13" r="3"></circle>
  </svg>
)
