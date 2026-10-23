import React, { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, ChevronDown, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import clsx from 'clsx';
import { Employee } from '../types';
import { auditEmployee, EmployeeAuditResult } from '../lib/employeeAudit';

interface EmployeeAuditBadgeProps {
  employee: Employee;
  onClick?: () => void;
  showDetailsOnHover?: boolean;
}

export default function EmployeeAuditBadge({ employee, onClick, showDetailsOnHover = true }: EmployeeAuditBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const audit = auditEmployee(employee);

  const {
    isComplete,
    completionPercentage,
    missingCount,
    missingBySection,
    expiredDocs,
    expiringDocs,
    hasExpiredDocs,
    hasExpiringDocs,
  } = audit;

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => showDetailsOnHover && setIsOpen(true)}
      onMouseLeave={() => showDetailsOnHover && setIsOpen(false)}
    >
      {/* Visual Badge Display on Employee */}
      <div 
        onClick={(e) => {
          if (onClick) {
            e.stopPropagation();
            onClick();
          }
        }}
        className={clsx(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all shadow-2xs cursor-pointer select-none",
          hasExpiredDocs
            ? "bg-red-100 text-red-800 border border-red-300 hover:bg-red-200"
            : missingCount > 0
            ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
            : hasExpiringDocs
            ? "bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
            : "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
        )}
        title="انقر لتعديل بيانات الموظف واستكمال النواقص"
      >
        {hasExpiredDocs ? (
          <>
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <AlertCircle size={13} className="text-red-600 shrink-0" />
            <span className="truncate max-w-[130px]">
              {expiredDocs[0].name} منتهي!
            </span>
            {expiredDocs.length > 1 && (
              <span className="bg-red-200 text-red-900 text-[10px] px-1 rounded-full font-black">
                +{expiredDocs.length - 1}
              </span>
            )}
          </>
        ) : missingCount > 0 ? (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
            <AlertTriangle size={13} className="text-rose-500 shrink-0" />
            <span>بيانات ناقصة ({missingCount})</span>
            {hasExpiringDocs && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" title="يوجد وثيقة قريبة الانتهاء"></span>
            )}
          </>
        ) : hasExpiringDocs ? (
          <>
            <Clock size={13} className="text-amber-600 shrink-0" />
            <span className="truncate max-w-[130px]">
              {expiringDocs[0].name} يوشك على الانتهاء
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 size={13} className="text-emerald-600 shrink-0" />
            <span>مكتمل 100%</span>
          </>
        )}
      </div>

      {/* Interactive Floating Hover Popover / Tooltip */}
      {isOpen && (
        <div 
          className="absolute z-50 bottom-full mb-2 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 text-right animate-in fade-in zoom-in-95 duration-150 pointer-events-auto"
          dir="rtl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className={clsx(
                "p-1.5 rounded-lg",
                hasExpiredDocs ? "bg-red-100 text-red-700" :
                missingCount > 0 ? "bg-rose-100 text-rose-700" :
                hasExpiringDocs ? "bg-amber-100 text-amber-700" :
                "bg-emerald-100 text-emerald-700"
              )}>
                {hasExpiredDocs ? <ShieldAlert size={16} /> :
                 missingCount > 0 ? <AlertTriangle size={16} /> :
                 hasExpiringDocs ? <Clock size={16} /> :
                 <Sparkles size={16} />}
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-800 line-clamp-1">{employee.fullName}</h4>
                <p className="text-[11px] text-slate-500">حالة تدقيق البيانات والصلاحيات</p>
              </div>
            </div>

            <div className="text-left font-mono">
              <span className={clsx(
                "text-xs font-bold px-2 py-0.5 rounded-full border",
                completionPercentage === 100 
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200" 
                  : completionPercentage >= 70
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-red-50 text-red-700 border-red-200"
              )}>
                {completionPercentage}%
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mb-3">
            <div 
              className={clsx(
                "h-full transition-all duration-300 rounded-full",
                completionPercentage === 100 ? "bg-emerald-500" :
                completionPercentage >= 70 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          {/* 1. Expired Documents Section */}
          {hasExpiredDocs && (
            <div className="mb-3 bg-red-50 border border-red-200 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-red-800 font-bold text-xs mb-1.5">
                <AlertCircle size={14} className="text-red-600 shrink-0" />
                <span>وثائق منتهية الصلاحية بحاجة لتجديد عاجل:</span>
              </div>
              <ul className="space-y-1">
                {expiredDocs.map((doc, idx) => (
                  <li key={idx} className="text-[11px] text-red-700 flex items-center justify-between bg-white/70 px-2 py-1 rounded border border-red-100">
                    <span className="font-semibold">{doc.name}</span>
                    <span className="font-mono text-red-800 text-[10px]">
                      انتهى منذ {Math.abs(doc.daysRemaining)} يوم ({doc.date})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 2. Expiring Soon Documents Section */}
          {hasExpiringDocs && (
            <div className="mb-3 bg-amber-50 border border-amber-200 rounded-xl p-2.5">
              <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs mb-1.5">
                <Clock size={14} className="text-amber-600 shrink-0" />
                <span>وثائق توشك على الانتهاء:</span>
              </div>
              <ul className="space-y-1">
                {expiringDocs.map((doc, idx) => (
                  <li key={idx} className="text-[11px] text-amber-700 flex items-center justify-between bg-white/70 px-2 py-1 rounded border border-amber-100">
                    <span className="font-semibold">{doc.name}</span>
                    <span className="font-mono text-amber-800 text-[10px]">
                      ينتهي خلال {doc.daysRemaining} يوم ({doc.date})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Missing Fields in 4 Sections */}
          {missingCount > 0 ? (
            <div className="space-y-2 mb-3">
              <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>الخانات الناقصة في الحقول الأساسية الأربعة:</span>
                <span className="text-[11px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">
                  {missingCount} خانة ناقصة
                </span>
              </div>

              {/* Basic Section */}
              {missingBySection.basic.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                  <div className="text-[11px] font-bold text-blue-800 mb-1">
                    📌 المعلومات الأساسية ({missingBySection.basic.length}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {missingBySection.basic.map(f => (
                      <span key={f.key} className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Work Section */}
              {missingBySection.work.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                  <div className="text-[11px] font-bold text-indigo-800 mb-1">
                    📌 معلومات العمل والوظيفة ({missingBySection.work.length}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {missingBySection.work.map(f => (
                      <span key={f.key} className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Personal Section */}
              {missingBySection.personal.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                  <div className="text-[11px] font-bold text-purple-800 mb-1">
                    📌 المعلومات الشخصية ({missingBySection.personal.length}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {missingBySection.personal.map(f => (
                      <span key={f.key} className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Bank Section */}
              {missingBySection.bank.length > 0 && (
                <div className="bg-slate-50 border border-slate-200/80 rounded-lg p-2">
                  <div className="text-[11px] font-bold text-emerald-800 mb-1">
                    📌 بيانات المصرف والحساب ({missingBySection.bank.length}):
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {missingBySection.bank.map(f => (
                      <span key={f.key} className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-medium">
                        {f.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-center mb-3">
              <span className="text-xs font-bold text-emerald-800 flex items-center justify-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-600" />
                جميع الحقول الأربعة الأساسية والمصرفية معبأة بالكامل
              </span>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>انقر على الموظف لاستكمال البيانات</span>
            <span className="text-blue-600 font-bold hover:underline cursor-pointer">
              فتح الملف ←
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
