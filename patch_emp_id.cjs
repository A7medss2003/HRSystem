const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

const replacement = `
  const { employees, deleteEmployee, addSystemLog } = useStore();
  
  const generateNextEmployeeId = () => {
    if (employee) return employee.employeeId;
    
    let maxId = 0;
    const currentYear = new Date().getFullYear();
    
    employees.forEach(emp => {
      // Look for format like HR-2026-0001 or HR-001
      const match = emp.employeeId.match(/HR(?:-\\d{4})?-(\\d+)/i) || emp.employeeId.match(/-(\\d+)$/);
      if (match && match[1]) {
        const num = parseInt(match[1], 10);
        if (num > maxId) maxId = num;
      }
    });
    
    return \`HR-\${currentYear}-\${String(maxId + 1).padStart(4, '0')}\`;
  };

  const [activeTab, setActiveTab] = useState('basic');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [formData, setFormData] = useState<Employee>(() => {
    if (employee) return { ...employee };
    return {
      ...defaultEmployee,
      id: 'emp-' + Date.now(),
      employeeId: generateNextEmployeeId(),
      employmentCategory: initialCategory || 'موظف أساسي'
    };
  });
  const [initialBonus, setInitialBonus] = useState<string>('');
  
  // Assume userRole comes from parent via Layout or we can just show it if not readOnly
`;

file = file.replace(
  /const \[activeTab, setActiveTab\] = useState\('basic'\);\s*const \[showConfirmDelete, setShowConfirmDelete\] = useState\(false\);\s*const \[formData, setFormData\] = useState<Employee>\(employee \|\| \{ \.\.\.defaultEmployee, employmentCategory: initialCategory \|\| 'موظف أساسي' \}\);\s*const \[initialBonus, setInitialBonus\] = useState<string>\(''\);\s*const \{ deleteEmployee, addSystemLog \} = useStore\(\);\s*\/\/ Assume userRole comes from parent via Layout or we can just show it if not readOnly/,
  replacement.trim()
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
