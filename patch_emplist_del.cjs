const fs = require('fs');
let listContent = fs.readFileSync('src/pages/EmployeeList.tsx', 'utf8');

listContent = listContent.replace(
  /<td className="px-6 py-4">\s*<div className="flex items-center justify-end gap-2 text-slate-400 group-hover:text-blue-600 transition-colors">\s*<ChevronLeft size=\{20\} \/>\s*<\/div>\s*<\/td>/g,
  `<td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2 transition-colors">
                      {userRole === 'admin' || userRole === 'developer' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if(confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
                              deleteEmployee(emp.id);
                              toast('تم حذف الموظف بنجاح');
                            }
                          }}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="حذف الموظف"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : null}
                      <div className="text-slate-400 group-hover:text-blue-600">
                        <ChevronLeft size={20} />
                      </div>
                    </div>
                  </td>`
);

fs.writeFileSync('src/pages/EmployeeList.tsx', listContent);
