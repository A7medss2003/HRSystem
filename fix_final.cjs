const fs = require('fs');
let content = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

// The block for equipment is currently:
// {!readOnly && <button onClick={() => handleDeleteCertification(cert.id)} className="absolute top-2 left-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>}
// But it is inside `formData.equipments.map(eq => (`

content = content.replace(
  /\{formData\.equipments\.map\(eq => \([\s\S]*?\{!readOnly && <button onClick=\{\(\) => handleDeleteCertification\(cert\.id\)\} className="absolute top-2 left-2 p-1\.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size=\{16\}\/><\/button>\}/,
  `{formData.equipments.map(eq => (
                  <div key={eq.id} className="p-5 border border-slate-200 rounded-xl bg-slate-50 relative group transition-all hover:border-blue-300">
                    <button type="button" onClick={() => printHandoverReceipt(eq.name, eq.details)} className="absolute top-2 left-10 p-1.5 text-slate-500 hover:bg-slate-200 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" title="طباعة إيصال الاستلام"><Printer size={16}/></button>
                    {!readOnly && <button type="button" onClick={() => handleDeleteEquipment(eq.id)} className="absolute top-2 left-2 p-1.5 text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>}`
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', content);
