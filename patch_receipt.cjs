const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

const printReceiptFunction = `
  const printHandoverReceipt = (equipmentName: string, equipmentDetails: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(\`
        <html dir="rtl">
        <head>
          <title>إيصال استلام عهدة</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; color: #333; }
            h1 { text-align: center; color: #1e40af; margin-bottom: 5px; }
            h3 { text-align: center; color: #64748b; margin-top: 0; font-weight: normal; }
            .content { font-size: 18px; line-height: 1.8; margin-top: 50px; text-align: right; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .signatures { display: flex; justify-content: space-between; margin-top: 100px; text-align: center; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>إيصال استلام عهدة</h1>
          <h3>الشركة الليبية للتقنية</h3>
          <hr style="margin: 20px 0; border: 0; border-top: 2px solid #e2e8f0;" />
          
          <div class="content">
            <p>أقر أنا الموظف <strong>\${formData.fullName}</strong>، الحامل للرقم الوظيفي <strong>\${formData.employeeId}</strong>، بأني قد استلمت العهدة التالية بحالة جيدة للقيام بمهام عملي:</p>
            
            <div class="box">
              <strong>نوع العهدة:</strong> \${equipmentName}<br><br>
              <strong>التفاصيل:</strong> \${equipmentDetails || 'لا يوجد'}
            </div>
            
            <p>وأتعهد بالمحافظة عليها واستخدامها في أغراض العمل فقط، وإعادتها للشركة عند الطلب أو عند انتهاء فترة خدمتي.</p>
          </div>
          
          <div class="signatures">
            <div>توقيع الموظف المستلم<br><br>...........................</div>
            <div>التاريخ<br><br>\${new Date().toLocaleDateString('ar-SA')}</div>
            <div>اعتماد الإدارة<br><br>...........................</div>
          </div>
          
          <script>
            window.onload = () => { setTimeout(() => { window.print(); window.close(); }, 500); }
          </script>
        </body>
        </html>
      \`);
      printWindow.document.close();
    }
  };
`;

if (!content.includes('printHandoverReceipt')) {
  // Insert the function before return
  content = content.replace(
    "  return (",
    printReceiptFunction + "\\n  return ("
  );

  // Find the equipment box and add a print button
  // <strong>{eq.name}</strong>
  // Let's replace the top right icons in the equipment block
  const printEqBtn = `
                      <button type="button" onClick={() => printHandoverReceipt(eq.name, eq.details)} className="absolute top-2 left-10 p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="طباعة إيصال الاستلام">
                        <Printer size={16} />
                      </button>`;
                      
  content = content.replace(
    /\{!readOnly && <button onClick=\{[^}]+\} className="absolute top-2 left-2 p-1\.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size=\{16\}\/><\/button>\}/g,
    `{!readOnly && <button type="button" onClick={() => handleDeleteEquipment(eq.id)} className="absolute top-2 left-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>}
     ${printEqBtn}`
  );
  
  // also add for readOnly mode. If readOnly, the delete button is hidden. We still want print.
  // Actually, let's just insert the print button directly:
  content = content.replace(
    `{!readOnly && <button type="button" onClick={() => handleDeleteEquipment(eq.id)}`,
    `<button type="button" onClick={() => printHandoverReceipt(eq.name, eq.details)} className="absolute top-2 left-10 p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="طباعة إيصال الاستلام"><Printer size={16}/></button>\n                    {!readOnly && <button type="button" onClick={() => handleDeleteEquipment(eq.id)}`
  );

  fs.writeFileSync('src/pages/EmployeeDetail.tsx', content);
}
