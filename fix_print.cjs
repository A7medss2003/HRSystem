const fs = require('fs');

let cssContent = fs.readFileSync('src/index.css', 'utf8');
if (!cssContent.includes('@media print')) {
  cssContent += `
@media print {
  body {
    background-color: white !important;
  }
  
  /* Hide sidebar and topbar */
  nav, header, aside, .sidebar {
    display: none !important;
  }
  
  /* Adjust main container to take full width */
  main {
    margin: 0 !important;
    padding: 0 !important;
    width: 100% !important;
    max-width: 100% !important;
  }

  .no-print {
    display: none !important;
  }

  .print-only {
    display: block !important;
  }

  /* Make tabs contents visible regardless of which tab is active (optional, but let's just let them print current tab for now to keep it simple, or print everything. Let's keep it simple: they print what they see) */

  /* Ensure colors and borders are printed */
  * {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  
  /* Avoid page breaks inside cards */
  .bg-white {
    page-break-inside: avoid;
    box-shadow: none !important;
    border: 1px solid #e2e8f0 !important;
  }
}
`;
  fs.writeFileSync('src/index.css', cssContent);
}

// Modify EmployeeDetail.tsx
let empContent = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

if (!empContent.includes('window.print()')) {
  empContent = empContent.replace(
    /import \{ Save, ArrowRight, Upload, X, FileText, CheckCircle, Clock, AlertCircle, Phone, Mail, Building, Briefcase, GraduationCap, Award, Contact, Monitor, CalendarDays \} from 'lucide-react';/,
    "import { Save, ArrowRight, Upload, X, FileText, CheckCircle, Clock, AlertCircle, Phone, Mail, Building, Briefcase, GraduationCap, Award, Contact, Monitor, CalendarDays, Printer } from 'lucide-react';"
  );
  
  empContent = empContent.replace(
    /<div className="flex gap-3 w-full sm:w-auto">\s*\{!readOnly && \(/,
    `<div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={() => window.print()}
            className="no-print flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors font-medium shadow-sm"
          >
            <Printer size={18} />
            طباعة
          </button>
          {!readOnly && (`
  );

  fs.writeFileSync('src/pages/EmployeeDetail.tsx', empContent);
}

// Modify Performance.tsx
let perfContent = fs.readFileSync('src/pages/Performance.tsx', 'utf8');
if (!perfContent.includes('window.print()')) {
  perfContent = perfContent.replace(
    /import \{ Star, Search, MessageSquare, Plus \} from 'lucide-react';/,
    "import { Star, Search, MessageSquare, Plus, Printer } from 'lucide-react';"
  );

  perfContent = perfContent.replace(
    /\{\[\'admin\', \'developer\'\]\.includes\(user\.role\) && \(\s*<button onClick=\{\(\) => toast\(\'سيتم إضافة نموذج التقييم قريباً\'\)\}/,
    `<div className="flex items-center gap-2">
          <button onClick={() => window.print()} className="no-print px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2 text-sm font-medium shadow-sm">
            <Printer size={16} />
            طباعة
          </button>
        {['admin', 'developer'].includes(user.role) && (
          <button onClick={() => toast('سيتم إضافة نموذج التقييم قريباً')}`
  );

  perfContent = perfContent.replace(
    /تقييم جديد\s*<\/button>\s*\)\}\s*<\/div>/,
    `تقييم جديد
          </button>
        )}
        </div>
      </div>`
  );

  fs.writeFileSync('src/pages/Performance.tsx', perfContent);
}
