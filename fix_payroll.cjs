const fs = require('fs');
let content = fs.readFileSync('src/pages/Payroll.tsx', 'utf8');

const generateFunc = `
  const handleGeneratePayroll = () => {
    // Generate payroll based on current active employees and their contracts
    const newPayrolls = employees
      .filter(emp => emp.status === 'نشط' && emp.contracts && emp.contracts.length > 0)
      .map(emp => {
        const activeContract = emp.contracts.find(c => c.status === 'ساري') || emp.contracts[0];
        const basic = activeContract.basicSalary || 0;
        
        // Calculate total bonuses
        const totalBonuses = emp.bonuses 
          ? emp.bonuses.filter(b => b.status !== 'ملغاة').reduce((sum, b) => sum + (b.amount || 0), 0)
          : 0;

        // Ensure calculations do not result in NaN or Infinity and handle very large numbers safely
        const net = Math.max(0, basic + totalBonuses); // Just a basic calculation for simulation

        return {
          id: 'pay-' + Date.now() + Math.random().toString(36).substr(2, 5),
          employeeId: emp.id,
          employeeName: emp.fullName,
          month: new Date().toISOString().slice(0, 7), // current YYYY-MM
          basicSalary: basic,
          allowances: 0,
          deductions: 0,
          netSalary: net,
          status: 'Pending'
        };
      });

    if (newPayrolls.length === 0) {
      toast('لا يوجد موظفين نشطين لديهم عقود سارية لتوليد رواتبهم');
      return;
    }

    setPayrolls([...newPayrolls, ...payrolls]);
    toast('تم توليد مسير الرواتب بنجاح لـ ' + newPayrolls.length + ' موظف');
  };
`;

content = content.replace(
  /const \{ payrolls, updatePayroll \} = useStore\(\);/,
  "const { payrolls, setPayrolls, employees, updatePayroll } = useStore();\n" + generateFunc
);

content = content.replace(
  /onClick=\{\(\) => toast\('سيتم إضافة نافذة توليد الرواتب قريباً'\)\}/,
  "onClick={handleGeneratePayroll}"
);

fs.writeFileSync('src/pages/Payroll.tsx', content);
