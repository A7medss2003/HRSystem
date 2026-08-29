const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

if (!content.includes('import { useStore }')) {
   content = content.replace(
      "import { toast } from '../components/Toast';",
      "import { toast } from '../components/Toast';\nimport { useStore } from '../store';"
   );
}

if (!content.includes('const { deleteEmployee }')) {
   content = content.replace(
      "const [initialBonus, setInitialBonus] = useState<string>('');",
      "const [initialBonus, setInitialBonus] = useState<string>('');\n  const { deleteEmployee } = useStore();\n  // Assume userRole comes from parent via Layout or we can just show it if not readOnly\n"
   );
}

const buttonsReplacement = `
        {!readOnly && (
          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {employee && employee.id && (
              <button 
                onClick={() => {
                  if(confirm('هل أنت متأكد من حذف هذا الموظف نهائياً؟')) {
                    deleteEmployee(employee.id);
                    toast('تم حذف الموظف بنجاح');
                    onBack();
                  }
                }} 
                className="px-4 py-2.5 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-2 text-sm font-medium"
              >
                <Trash2 size={18} />
                حذف الموظف
              </button>
            )}
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
`;

content = content.replace(
  /\{!readOnly && \(\s*<div className="flex items-center gap-3 shrink-0">\s*<button onClick=\{onBack\}[^>]*>[\s\S]*?إلغاء\s*<\/button>\s*<button onClick=\{handleSave\}[^>]*>[\s\S]*?حفظ التغييرات\s*<\/button>\s*<\/div>\s*\)\}/,
  buttonsReplacement
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', content);
