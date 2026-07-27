import { useState } from 'react';
import { ArrowRight, Save, X, Building, Mail, Phone, MapPin, Briefcase, GraduationCap, Award, FileText, Monitor, Clock, User as UserIcon, Contact, Trash2 } from 'lucide-react';
import clsx from 'clsx';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import { Employee, Education, Experience, Skill, Contract, Certification, Equipment, Document, AuditLog } from '../types';
import { toast } from '../components/Toast';

interface EmployeeDetailProps {
  employee: Employee | null;
  onBack: () => void;
  onSave: (employee: Employee) => void;
}

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
  status: 'نشط',
  linkedUser: '',
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
};

const InputField = ({ label, value, onChange, icon: Icon, dir = 'rtl', className = '', type = 'text', placeholder = '', readOnly = false }: any) => (
  <div className={className}>
    {label && <label className="text-xs font-semibold text-slate-500 block mb-1.5">{label}</label>}
    <div className="relative flex items-center">
      {Icon && <Icon size={16} className={clsx("absolute text-slate-400", dir === 'ltr' ? 'left-3' : 'right-3')} />}
      <input 
        type={type}
        value={value || ''}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={e => !readOnly && onChange(e.target.value)}
        dir={dir}
        className={clsx(
          "w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm py-2 transition-all",
          Icon ? (dir === 'ltr' ? "pl-9 pr-3" : "pr-9 pl-3") : "px-3",
          readOnly && "opacity-80 cursor-not-allowed bg-slate-100"
        )}
      />
    </div>
  </div>
);

const SelectField = ({ label, value, onChange, options, icon: Icon, className = '', readOnly = false }: any) => (
  <div className={className}>
    {label && <label className="text-xs font-semibold text-slate-500 block mb-1.5">{label}</label>}
    <div className="relative flex items-center">
      {Icon && <Icon size={16} className="absolute right-3 text-slate-400" />}
      <select 
        value={value || ''}
        disabled={readOnly}
        onChange={e => !readOnly && onChange(e.target.value)}
        className={clsx(
          "w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm py-2 transition-all",
          Icon ? "pr-9 pl-3" : "px-3",
          readOnly && "opacity-80 cursor-not-allowed bg-slate-100 appearance-none"
        )}
      >
        {options.map((opt: any) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
      </select>
    </div>
  </div>
);

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

export default function EmployeeDetail({ employee, onBack, onSave, readOnly = false, hideBack = false }: EmployeeDetailProps & { readOnly?: boolean, hideBack?: boolean }) {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState<Employee>(employee || defaultEmployee);

  const handleChange = (field: keyof Employee, value: any) => {
    if (readOnly) return;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    const updatedData = { ...formData, updatedAt: new Date().toISOString() };
    if (!employee) {
      updatedData.auditLogs = [{
        id: 'aud-' + Date.now(),
        action: 'إنشاء ملف الموظف',
        user: 'admin',
        date: new Date().toISOString(),
        details: 'تم الإنشاء'
      }];
    } else {
      updatedData.auditLogs = [...formData.auditLogs, {
        id: 'aud-' + Date.now(),
        action: 'تحديث بيانات الموظف',
        user: 'admin',
        date: new Date().toISOString(),
        details: 'تحديث البيانات من واجهة النظام'
      }];
    }
    onSave(updatedData);
    toast('تم حفظ بيانات الموظف بنجاح!');
  };

  const tabs = [
    { id: 'basic', label: 'المعلومات الأساسية', icon: UserIcon },
    { id: 'work', label: 'معلومات العمل', icon: Building },
    { id: 'personal', label: 'المعلومات الشخصية', icon: Contact },
    { id: 'education', label: 'التعليم', icon: GraduationCap },
    { id: 'experience', label: 'الخبرات', icon: Briefcase },
    { id: 'skills', label: 'المهارات', icon: Award },
    { id: 'contracts', label: 'العقود', icon: FileText },
    { id: 'certifications', label: 'الشهادات', icon: Award },
    { id: 'equipment', label: 'المعدات', icon: Monitor },
    { id: 'documents', label: 'المستندات', icon: FileText },
    { id: 'audit', label: 'سجل النظام', icon: Clock },
  ];

  // Helper arrays for Select options
  const statusOptions = ['نشط', 'إجازة', 'موقوف', 'متقاعد', 'مستقيل'].map(v => ({ value: v, label: v }));
  const genderOptions = ['ذكر', 'أنثى'].map(v => ({ value: v, label: v }));
  const maritalOptions = ['أعزب', 'متزوج', 'مطلق', 'أرمل'].map(v => ({ value: v, label: v }));
  const remoteOptions = ['مكتب', 'منزل', 'مختلط'].map(v => ({ value: v, label: v }));
  const skillLevels = ['مبتدئ', 'متوسط', 'متقدم', 'خبير'].map(v => ({ value: v, label: v }));
  const contractStatus = ['ساري', 'منتهي', 'ملغى'].map(v => ({ value: v, label: v }));
  const certStatus = ['سارية', 'منتهية'].map(v => ({ value: v, label: v }));
  const eqStatus = ['جيد', 'صيانة', 'تالف', 'مفقود'].map(v => ({ value: v, label: v }));

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
        id: 'cert-' + Date.now(), name: '', issuer: '', issueDate: '', expiryDate: '', status: 'سارية'
      }]
    }));
  };

  const handleUpdateCertification = (id: string, field: keyof Certification, value: string) => {
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
    const input = document.createElement('input');
    input.type = 'file';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setFormData(prev => ({
          ...prev,
          documents: [...prev.documents, {
            id: 'doc-' + Date.now(), name: file.name, type: file.type || 'ملف', uploadDate: new Date().toISOString()
          }]
        }));
      }
    };
    input.click();
  };

  const handleDeleteDocument = (id: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(e => e.id !== id)
    }));
  };

  const handlePhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        setFormData(prev => ({ ...prev, photoUrl: URL.createObjectURL(file) }));
      }
    };
    input.click();
  };

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
              <img src={formData.photoUrl} alt={formData.fullName} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md group-hover:opacity-80 transition-opacity" />
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
            <input 
              type="text" 
              value={formData.fullName} 
              readOnly={readOnly}
              onChange={e => handleChange('fullName', e.target.value)} 
              placeholder="الاسم الكامل"
              className="text-2xl font-bold text-slate-800 bg-transparent outline-none placeholder-slate-300 w-full"
            />
            <div className="flex items-center gap-2 mt-1">
              <input 
                type="text" 
                value={formData.jobTitle} 
                readOnly={readOnly}
                onChange={e => handleChange('jobTitle', e.target.value)} 
                placeholder="المسمى الوظيفي"
                className="text-slate-500 font-medium bg-transparent outline-none placeholder-slate-300 w-32"
              />
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
          <div className="flex items-center gap-3 shrink-0">
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
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200 p-6 w-full min-h-[500px]">
          
          {/* TAB: Basic Info */}
          {activeTab === 'basic' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">المعلومات الأساسية</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                <SelectField readOnly={readOnly} label="حالة الموظف" value={formData.status} onChange={(v: any) => handleChange('status', v)} options={statusOptions} />
                <InputField readOnly={readOnly} label="الشركة" value={formData.company} onChange={(v: any) => handleChange('company', v)} />
                <InputField readOnly={readOnly} label="الإدارة" value={formData.management} onChange={(v: any) => handleChange('management', v)} />
                <InputField readOnly={readOnly} label="القسم" value={formData.department} onChange={(v: any) => handleChange('department', v)} />
                <InputField readOnly={readOnly} label="المدير المباشر" value={formData.directManager} onChange={(v: any) => handleChange('directManager', v)} />
                <InputField readOnly={readOnly} label="المشرف (Coach)" value={formData.coach} onChange={(v: any) => handleChange('coach', v)} />
                <InputField readOnly={readOnly} label="العلامات (افصل بينها بفاصلة)" value={formData.tags?.join('، ')} onChange={(v: string) => handleChange('tags', v.split('،').map(t=>t.trim()))} className="md:col-span-2" />
                
                <div className="col-span-2 border-t border-slate-100 pt-6 mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <InputField readOnly={readOnly} label="البريد الإلكتروني للعمل" value={formData.workEmail} onChange={(v: any) => handleChange('workEmail', v)} icon={Mail} type="email" />
                  <InputField readOnly={readOnly} label="هاتف العمل" value={formData.workPhone} onChange={(v: any) => handleChange('workPhone', v)} icon={Phone} dir="ltr" />
                  <InputField readOnly={readOnly} label="الهاتف المحمول للعمل" value={formData.workMobile} onChange={(v: any) => handleChange('workMobile', v)} icon={Phone} dir="ltr" />
                </div>
              </div>
            </div>
          )}

          {/* TAB: Work Info */}
          {activeTab === 'work' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">معلومات العمل</h2>
              
              <Section title="الموقع والجدول">
                <InputField readOnly={readOnly} label="موقع العمل (الفرع)" value={formData.workLocation} onChange={(v: any) => handleChange('workLocation', v)} icon={MapPin} />
                <InputField readOnly={readOnly} label="عنوان العمل" value={formData.workAddress} onChange={(v: any) => handleChange('workAddress', v)} />
                <InputField readOnly={readOnly} label="ساعات العمل" value={formData.workingHours} onChange={(v: any) => handleChange('workingHours', v)} icon={Clock} />
                <InputField readOnly={readOnly} label="المنطقة الزمنية" value={formData.timezone} onChange={(v: any) => handleChange('timezone', v)} dir="ltr" />
                <InputField readOnly={readOnly} label="جدول أيام العمل" value={formData.workSchedule} onChange={(v: any) => handleChange('workSchedule', v)} className="md:col-span-2" />
              </Section>

              <Section title="العمل عن بعد والتخطيط">
                <SelectField readOnly={readOnly} label="نوع العمل عن بعد" value={formData.remoteWorkType} onChange={(v: any) => handleChange('remoteWorkType', v)} options={remoteOptions} />
                <InputField readOnly={readOnly} label="الدور الوظيفي الافتراضي" value={formData.defaultRole} onChange={(v: any) => handleChange('defaultRole', v)} />
                <InputField readOnly={readOnly} label="الأدوار الإضافية (مفصولة بفاصلة)" value={formData.additionalRoles?.join('، ')} onChange={(v: string) => handleChange('additionalRoles', v.split('،').map(t=>t.trim()))} className="md:col-span-2" />
              </Section>

              <Section title="الموافقات">
                <InputField readOnly={readOnly} label="مسؤول اعتماد الإجازات" value={formData.timeOffApprover} onChange={(v: any) => handleChange('timeOffApprover', v)} />
                <InputField readOnly={readOnly} label="مسؤول اعتماد المصروفات" value={formData.expensesApprover} onChange={(v: any) => handleChange('expensesApprover', v)} />
                <InputField readOnly={readOnly} label="مسؤول اعتماد الجداول الزمنية" value={formData.timesheetApprover} onChange={(v: any) => handleChange('timesheetApprover', v)} />
              </Section>
            </div>
          )}

          {/* TAB: Personal Info */}
          {activeTab === 'personal' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-4">المعلومات الشخصية</h2>
              
              <Section title="بيانات الاتصال">
                <InputField readOnly={readOnly} label="عنوان السكن" value={formData.homeAddress} onChange={(v: any) => handleChange('homeAddress', v)} icon={MapPin} className="md:col-span-2" />
                <InputField readOnly={readOnly} label="الهاتف الشخصي" value={formData.personalPhone} onChange={(v: any) => handleChange('personalPhone', v)} icon={Phone} dir="ltr" />
                <InputField readOnly={readOnly} label="البريد الإلكتروني الشخصي" value={formData.personalEmail} onChange={(v: any) => handleChange('personalEmail', v)} icon={Mail} type="email" />
                <InputField readOnly={readOnly} label="اللغة" value={formData.language} onChange={(v: any) => handleChange('language', v)} />
              </Section>

              <Section title="البيانات الشخصية">
                <SelectField readOnly={readOnly} label="الجنس" value={formData.gender} onChange={(v: any) => handleChange('gender', v)} options={genderOptions} />
                <SelectField readOnly={readOnly} label="الحالة الاجتماعية" value={formData.maritalStatus} onChange={(v: any) => handleChange('maritalStatus', v)} options={maritalOptions} />
                <InputField readOnly={readOnly} label="الجنسية" value={formData.nationality} onChange={(v: any) => handleChange('nationality', v)} />
                <InputField readOnly={readOnly} label="عدد الأطفال" value={formData.childrenCount} onChange={(v: any) => handleChange('childrenCount', Number(v))} type="number" />
                <InputField readOnly={readOnly} label="تاريخ الميلاد" value={formData.dob} onChange={(v: any) => handleChange('dob', v)} type="date" dir="ltr" />
                <InputField readOnly={readOnly} label="مكان الميلاد" value={formData.placeOfBirth} onChange={(v: any) => handleChange('placeOfBirth', v)} />
              </Section>

              <Section title="الهوية والمستندات">
                <InputField readOnly={readOnly} label="الرقم الوطني" value={formData.nationalId} onChange={(v: any) => handleChange('nationalId', v)} dir="ltr" />
                <InputField readOnly={readOnly} label="رقم جواز السفر" value={formData.passportNo} onChange={(v: any) => handleChange('passportNo', v)} dir="ltr" />
                <InputField readOnly={readOnly} label="رقم التأشيرة" value={formData.visaNo} onChange={(v: any) => handleChange('visaNo', v)} dir="ltr" />
                <InputField readOnly={readOnly} label="تاريخ انتهاء التأشيرة" value={formData.visaExpiry} onChange={(v: any) => handleChange('visaExpiry', v)} type="date" dir="ltr" />
                <InputField readOnly={readOnly} label="رقم تصريح العمل" value={formData.workPermitNo} onChange={(v: any) => handleChange('workPermitNo', v)} dir="ltr" />
                <InputField readOnly={readOnly} label="تاريخ انتهاء التصريح" value={formData.permitExpiry} onChange={(v: any) => handleChange('permitExpiry', v)} type="date" dir="ltr" />
              </Section>

              <Section title="جهة الاتصال في حالات الطوارئ">
                <InputField readOnly={readOnly} label="الاسم" value={formData.emergencyContactName} onChange={(v: any) => handleChange('emergencyContactName', v)} />
                <InputField readOnly={readOnly} label="صلة القرابة" value={formData.emergencyContactRelation} onChange={(v: any) => handleChange('emergencyContactRelation', v)} />
                <InputField readOnly={readOnly} label="رقم الهاتف" value={formData.emergencyContactPhone} onChange={(v: any) => handleChange('emergencyContactPhone', v)} icon={Phone} dir="ltr" />
              </Section>
            </div>
          )}

          {/* TAB: Education */}
          {activeTab === 'education' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h2 className="text-xl font-bold text-slate-800">التعليم والمؤهلات</h2>
                {!readOnly && <button onClick={handleAddEducation} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors">إضافة مؤهل</button>}
              </div>
              
              {formData.educations.map(edu => (
                <div key={edu.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-blue-300">
                  {!readOnly && <button onClick={() => handleDeleteEducation(edu.id)} className="absolute top-4 left-4 p-2 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={18}/></button>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <InputField readOnly={readOnly} label="الدرجة العلمية" value={edu.degree} onChange={(v: any) => handleUpdateEducation(edu.id, 'degree', v)} />
                    <InputField readOnly={readOnly} label="التخصص" value={edu.major} onChange={(v: any) => handleUpdateEducation(edu.id, 'major', v)} />
                    <InputField readOnly={readOnly} label="المؤسسة التعليمية" value={edu.institution} onChange={(v: any) => handleUpdateEducation(edu.id, 'institution', v)} className="md:col-span-2" />
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
                        <input disabled={readOnly} type="range" min="0" max="100" value={skill.percentage} onChange={(e) => handleUpdateSkill(skill.id, 'percentage', parseInt(e.target.value))} className={clsx("w-full accent-blue-600", readOnly && "opacity-60 cursor-not-allowed")} />
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
             <div className="flex justify-between items-center border-b border-slate-100 pb-4">
               <h2 className="text-xl font-bold text-slate-800">الشهادات المهنية</h2>
               {!readOnly && <button onClick={handleAddCertification} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors">إضافة شهادة</button>}
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {formData.certifications.map(cert => (
                  <div key={cert.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-blue-300">
                    {!readOnly && <button onClick={() => handleDeleteCertification(cert.id)} className="absolute top-2 left-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>}
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <InputField readOnly={readOnly} label="اسم الشهادة" value={cert.name} onChange={(v: any) => handleUpdateCertification(cert.id, 'name', v)} className="col-span-2" />
                      <InputField readOnly={readOnly} label="الجهة المانحة" value={cert.issuer} onChange={(v: any) => handleUpdateCertification(cert.id, 'issuer', v)} className="col-span-2" />
                      <InputField readOnly={readOnly} label="تاريخ الإصدار" value={cert.issueDate} onChange={(v: any) => handleUpdateCertification(cert.id, 'issueDate', v)} type="date" dir="ltr" />
                      <InputField readOnly={readOnly} label="تاريخ الانتهاء" value={cert.expiryDate} onChange={(v: any) => handleUpdateCertification(cert.id, 'expiryDate', v)} type="date" dir="ltr" />
                      <SelectField readOnly={readOnly} label="الحالة" value={cert.status} onChange={(v: any) => handleUpdateCertification(cert.id, 'status', v)} options={certStatus} className="col-span-2" />
                    </div>
                  </div>
                ))}
             </div>
             {formData.certifications.length === 0 && <EmptyState message="لا يوجد شهادات مسجلة" />}
           </div>
          )}

          {/* TAB: Equipment */}
          {activeTab === 'equipment' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-between items-center border-b border-slate-100 pb-4">
               <h2 className="text-xl font-bold text-slate-800">المعدات والأصول</h2>
               {!readOnly && <button onClick={handleAddEquipment} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors">تخصيص معدات</button>}
             </div>
             
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {formData.equipments.map(eq => (
                  <div key={eq.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-blue-300">
                    {!readOnly && <button onClick={() => handleDeleteEquipment(eq.id)} className="absolute top-2 left-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>}
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
             {formData.equipments.length === 0 && <EmptyState message="لا يوجد معدات مسجلة" />}
           </div>
          )}

          {/* TAB: Documents */}
          {activeTab === 'documents' && (
             <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-between items-center border-b border-slate-100 pb-4">
               <h2 className="text-xl font-bold text-slate-800">المستندات</h2>
               {!readOnly && <button onClick={handleAddDocument} className="text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-4 py-2 rounded-lg transition-colors">رفع مستند</button>}
             </div>
             
             <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {formData.documents.map(doc => (
                  <div key={doc.id} className="p-4 border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group text-center flex flex-col items-center relative">
                    {!readOnly && <button onClick={() => handleDeleteDocument(doc.id)} className="absolute top-2 right-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>}
                    <FileText size={40} className="text-slate-300 group-hover:text-blue-500 mb-3 transition-colors" />
                    <p className="font-semibold text-slate-800 text-sm truncate w-full" title={doc.name}>{doc.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{doc.type}</p>
                    <p className="text-xs text-slate-400 font-mono mt-2" dir="ltr">{formatDate(doc.uploadDate)}</p>
                  </div>
                ))}
             </div>
             {formData.documents.length === 0 && <EmptyState message="لا يوجد مستندات مسجلة" />}
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
