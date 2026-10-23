const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

const permsSection = `
              {isAdmin && (
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mt-8 col-span-1 md:col-span-2 lg:col-span-3">
                  <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Shield className="text-indigo-600" size={20} />
                    صلاحيات الوصول للنظام (مخصصة لهذا الموظف)
                  </h3>
                  <p className="text-sm text-slate-500 mb-4">
                    حدد الصلاحيات والأقسام التي يمكن لهذا الموظف الوصول إليها بالضغط على المربع.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[
                      { id: 'all', label: 'مدير عام (صلاحيات كاملة)' },
                      { id: 'view_dashboard', label: 'لوحة التحكم والإحصائيات' },
                      { id: 'manage_employees', label: 'إدارة الموظفين (إضافة/تعديل)' },
                      { id: 'view_payroll', label: 'إدارة الرواتب والمالية' },
                      { id: 'manage_attendance', label: 'إدارة الحضور والانصراف' },
                      { id: 'manage_leaves', label: 'إدارة طلبات الإجازات' },
                      { id: 'manage_settings', label: 'إعدادات المنظومة' },
                      { id: 'request_leave', label: 'تقديم طلب إجازة (للموظف)' },
                    ].map(perm => {
                      const isChecked = (formData.customPermissions || []).includes(perm.id) || (perm.id === 'all' && formData.defaultRole === 'admin');
                      
                      const handleCheck = () => {
                         if (readOnly) return;
                         setFormData(prev => {
                           let current = prev.customPermissions || [];
                           let role = prev.defaultRole;
                           
                           if (perm.id === 'all') {
                              if (isChecked) {
                                 role = 'employee';
                                 current = current.filter(p => p !== 'all');
                              } else {
                                 role = 'admin';
                                 current = [...current, 'all'];
                              }
                           } else {
                              if (current.includes(perm.id)) {
                                 current = current.filter(p => p !== perm.id);
                              } else {
                                 current = [...current, perm.id];
                              }
                           }
                           
                           return { ...prev, customPermissions: current, defaultRole: role };
                         });
                      };

                      return (
                        <label key={perm.id} className={\`flex items-start gap-3 p-4 border rounded-xl cursor-pointer transition-all duration-200 \${isChecked ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50'}\`}>
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={handleCheck}
                            disabled={readOnly}
                            className="mt-1 w-5 h-5 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 transition-colors"
                          />
                          <div className="flex flex-col">
                            <span className={\`text-sm font-bold \${isChecked ? 'text-indigo-800' : 'text-slate-700'}\`}>{perm.label}</span>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
`;

// Inject right after the `بيانات الدخول للنظام` section
file = file.replace(
  /<\/Section>\s*<Section title="الموافقات">/,
  `</Section>\n${permsSection}\n              <Section title="الموافقات">`
);

// Remove defaultRole and additionalRoles from "العمل عن بعد"
file = file.replace(
  /<SelectField readOnly=\{readOnly\} label="الدور الوظيفي الافتراضي \(الصلاحية\)" value=\{formData\.defaultRole\} onChange=\{\(v: any\) => handleChange\('defaultRole', v\)\} options=\{roleOptions\} \/>/,
  ""
);
file = file.replace(
  /<InputField readOnly=\{readOnly\} label="الأدوار الإضافية \(مفصولة بفاصلة\)" value=\{formData\.additionalRoles\?\.[^>]+ \/>/,
  ""
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
