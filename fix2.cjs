const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

file = file.replace(/if \(formData\.password && formData\.password\.trim\(\) !== ''\) \{[\s\S]*?setActiveTab\('system'\); \/\/ Assuming password is in system tab\n        return;\n      \}\n    \}/, '');

const hasModal = file.includes('تأكيد الحذف');
if (!hasModal) {
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
      )}`;
      
      file = file.replace(
        /(\s*)(<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\})/,
        `\n${modalJSX}$1$2`
      );
}

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
