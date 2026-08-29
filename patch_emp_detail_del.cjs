const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

if (!content.includes('deleteEmployee')) {
  content = content.replace(
    /import \{ useStore \} from '\.\.\/store';/,
    "import { useStore } from '../store';"
  );
  
  content = content.replace(
    /const \{ updateEmployee \} = useStore\(\);/,
    "const { updateEmployee, deleteEmployee } = useStore();"
  );
  
  content = content.replace(
    /import \{ Save, ArrowRight, Upload, X, FileText, CheckCircle, Clock, AlertCircle, Phone, Mail, Building, Briefcase, GraduationCap, Award, Contact, Monitor, CalendarDays, Printer \} from 'lucide-react';/,
    "import { Save, ArrowRight, Upload, X, FileText, CheckCircle, Clock, AlertCircle, Phone, Mail, Building, Briefcase, GraduationCap, Award, Contact, Monitor, CalendarDays, Printer, Trash2 } from 'lucide-react';"
  );
  
  const deleteBtn = `
          {!readOnly && formData.id && (
            <button 
              onClick={() => {
                if(confirm('هل أنت متأكد من حذف هذا الموظف؟')) {
                  deleteEmployee(formData.id);
                  onBack();
                }
              }}
              className="no-print flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors font-medium shadow-sm"
            >
              <Trash2 size={18} />
              حذف
            </button>
          )}`;

  content = content.replace(
    /<Printer size=\{18\} \/>\s*طباعة\s*<\/button>\s*\{!readOnly && \(/,
    `<Printer size={18} />
            طباعة
          </button>${deleteBtn}
          {!readOnly && (`
  );

  fs.writeFileSync('src/pages/EmployeeDetail.tsx', content);
}
