const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

// Add state
file = file.replace(
  "const [activeTab, setActiveTab] = useState('basic');",
  "const [activeTab, setActiveTab] = useState('basic');\n  const [showConfirmDelete, setShowConfirmDelete] = useState(false);"
);

// Replace delete button
const deleteBtnStr = `<button \n                onClick={() => {\n                  if(confirm('هل أنت متأكد من حذف هذا الموظف نهائياً؟')) {\n                    deleteEmployee(employee.id);\n                    addSystemLog({ userId: 'system', userName: 'Administrator', action: 'حذف موظف', details: 'تم حذف الموظف ' + employee.fullName });\n                    toast('تم حذف الموظف بنجاح');\n                    onBack();\n                  }\n                }} \n                className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium"\n              >\n                <Trash2 size={18} />\n                حذف الموظف\n              </button>`;

const newDeleteBtn = `<button 
                onClick={() => setShowConfirmDelete(true)} 
                className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Trash2 size={18} />
                حذف الموظف
              </button>`;
              
file = file.replace(deleteBtnStr, newDeleteBtn);

// Also handle if the format was slightly different
file = file.replace(
  /onClick=\{\(\) => \{\s*if\(confirm\('هل أنت متأكد من حذف هذا الموظف نهائياً؟'\)\) \{\s*deleteEmployee\(employee\.id\);\s*addSystemLog\(\{ userId: 'system', userName: 'Administrator', action: 'حذف موظف', details: 'تم حذف الموظف ' \+ employee\.fullName \}\);\s*toast\('تم حذف الموظف بنجاح'\);\s*onBack\(\);\s*\}\s*\}\}/,
  "onClick={() => setShowConfirmDelete(true)}"
);

// Add the modal at the end before closing div (before `</div>\n    </div>` maybe)
const modalJSX = `
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
`;

file = file.replace(
  /(\s*)(<\/div>\s*)$/,
  `\n${modalJSX}$1$2`
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
