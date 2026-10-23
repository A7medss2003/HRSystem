const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

const permsUI = `
              {isAdmin && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 col-span-1 md:col-span-2 lg:col-span-3">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Shield className="text-indigo-600" size={20} />
                    صلاحيات مخصصة للموظف (منح صلاحيات استثنائية)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[
                      { id: 'view_dashboard', label: 'رؤية لوحة التحكم والإحصائيات' },
                      { id: 'manage_employees', label: 'إضافة وتعديل بيانات الموظفين' },
                      { id: 'view_payroll', label: 'الاطلاع على الرواتب والمالية' },
                      { id: 'manage_attendance', label: 'إدارة الحضور والانصراف' },
                      { id: 'manage_leaves', label: 'قبول ورفض الإجازات' },
                      { id: 'request_leave', label: 'تقديم طلب إجازة' },
                      { id: 'manage_settings', label: 'تغيير إعدادات المنظومة' },
                      { id: 'all', label: 'وصول كامل (صلاحيات مدير عام)' }
                    ].map(perm => {
                      const isChecked = (formData.customPermissions || []).includes(perm.id);
                      return (
                        <label key={perm.id} className="flex items-start gap-3 p-3 border border-slate-100 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => handleTogglePermission(perm.id)}
                            disabled={readOnly}
                            className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                          />
                          <span className="text-sm font-medium text-slate-700 leading-snug">{perm.label}</span>
                        </label>
                      );
                    })}
                  </div>
                  <p className="text-xs text-slate-500 mt-4 bg-indigo-50 p-3 rounded-lg text-indigo-700">
                    ملاحظة: الصلاحيات أعلاه تسمح بإعطاء هذا الموظف إمكانية الدخول لأقسام المنظومة حتى لو كان المسمى الوظيفي الافتراضي له لا يسمح بذلك.
                  </p>
                </div>
              )}
`;

file = file.replace(
  /\{\/\* Action Buttons \*\/\}/,
  permsUI + "\n\n              {/* Action Buttons */}"
);

// also need Shield icon if not imported
if(!file.includes('Shield')) {
  file = file.replace(/import \{ /, "import { Shield, ");
}

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
