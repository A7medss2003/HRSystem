const fs = require('fs');
let listContent = fs.readFileSync('src/pages/EmployeeList.tsx', 'utf8');

// In EmployeeList.tsx, add deleteEmployee from store
if (!listContent.includes('deleteEmployee')) {
  listContent = listContent.replace(
    /const \{ employees, updateEmployee, globalSearchQuery, setGlobalSearchQuery \} = useStore\(\);/,
    "const { employees, updateEmployee, deleteEmployee, globalSearchQuery, setGlobalSearchQuery } = useStore();"
  );

  // Add delete icon to the table
  listContent = listContent.replace(
    /import \{ Search, Plus, Filter, FileSpreadsheet, ChevronLeft, Star, X, Save, Gift \} from 'lucide-react';/,
    "import { Search, Plus, Filter, FileSpreadsheet, ChevronLeft, Star, X, Save, Gift, Trash2 } from 'lucide-react';"
  );

  listContent = listContent.replace(
    /<td className="px-6 py-4">[\s\S]*?<button\s*type="button"\s*onClick=\{\(e\) => \{\s*e\.stopPropagation\(\);\s*handleOpenBonusModal\(emp\);\s*\}\}[\s\S]*?<\/td>/,
    `<td className="px-6 py-4">
                    <div className="flex flex-col gap-2">
                      <span className={clsx(
                        "px-2.5 py-1 rounded-md text-[11px] font-bold w-fit border transition-colors",
                        emp.employmentCategory === 'متعاون' 
                          ? "bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm" 
                          : "bg-slate-50 text-slate-600 border-slate-200"
                      )}>
                        {emp.employmentCategory || 'موظف أساسي'}
                      </span>
                      {emp.employmentCategory === 'متعاون' && (
                        <div className="flex items-center gap-2 mt-1">
                          {emp.bonuses && emp.bonuses.length > 0 ? (
                             <div className="flex items-center gap-1.5 bg-white border border-indigo-10 rounded text-[11px] px-2 py-1 shadow-xs">
                               <span className="text-slate-500">المكافآت:</span>
                               <span className="font-bold text-indigo-600" dir="ltr">
                                 {emp.bonuses.reduce((sum, b) => sum + b.amount, 0).toLocaleString()} د.ل
                               </span>
                             </div>
                          ) : (
                             <span className="text-[10px] text-slate-400">لا توجد مكافآت مسجلة</span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenBonusModal(emp);
                            }}
                            className="bg-indigo-100 text-indigo-700 p-1.5 rounded hover:bg-indigo-200 transition-colors"
                            title="إضافة مكافأة"
                          >
                            <Gift size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </td>`
  );
  
  // Actually, wait, let's just add it to the last cell.
  listContent = listContent.replace(
    /<td className="px-6 py-4 flex items-center justify-end gap-2">\s*<ChevronLeft size=\{20\} className="text-slate-300 group-hover:text-blue-500 transition-colors" \/>\s*<\/td>/g,
    `<td className="px-6 py-4 flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if(confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
                          deleteEmployee(emp.id);
                        }
                      }}
                      className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="حذف الموظف"
                    >
                      <Trash2 size={18} />
                    </button>
                    <ChevronLeft size={20} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                  </td>`
  );
  
  fs.writeFileSync('src/pages/EmployeeList.tsx', listContent);
}

