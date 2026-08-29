const fs = require('fs');

let empList = fs.readFileSync('src/pages/EmployeeList.tsx', 'utf8');

const exportLogic = `
  const handleExportCSV = () => {
    if (filteredEmployees.length === 0) {
      toast('لا توجد بيانات لتصديرها');
      return;
    }
    const headers = ['الرقم الوظيفي', 'الاسم', 'المسمى الوظيفي', 'القسم', 'البريد الإلكتروني', 'رقم الهاتف', 'الراتب الأساسي', 'حالة الموظف', 'طبيعة العمل'];
    const csvContent = [
      headers.join(','),
      ...filteredEmployees.map(emp => [
        emp.employeeId,
        '"' + emp.fullName + '"',
        '"' + emp.jobTitle + '"',
        '"' + emp.department + '"',
        emp.workEmail,
        emp.workPhone,
        emp.basicSalary || '',
        emp.status,
        emp.remoteWorkType
      ].join(','))
    ].join('\\n');

    const blob = new Blob(['\\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = \`employees_export_\${new Date().toISOString().split('T')[0]}.csv\`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast('تم تصدير البيانات بنجاح');
  };
`;

if (!empList.includes('handleExportCSV')) {
  empList = empList.replace(
    "const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {",
    exportLogic + "\\n  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {"
  );

  empList = empList.replace(
    /<button onClick=\{onAddEmployee\} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm font-medium">/,
    `<button onClick={handleExportCSV} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm font-medium">
            <Download size={20} />
            تصدير CSV
          </button>
          <button onClick={onAddEmployee} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-sm font-medium">`
  );

  fs.writeFileSync('src/pages/EmployeeList.tsx', empList);
}
