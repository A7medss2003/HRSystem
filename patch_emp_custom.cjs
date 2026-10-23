const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

// Add customFields to defaultEmployee
file = file.replace(
  /  auditLogs: \[\],\n\};/,
  "  auditLogs: [],\n  customFields: [],\n};"
);

// Inject custom field handlers inside the component
const handlersCode = `
  const handleAddCustomField = (section: string) => {
    if (readOnly) return;
    const newField = {
      id: 'cf-' + Date.now() + Math.floor(Math.random() * 1000),
      section,
      label: 'معلومة إضافية',
      value: ''
    };
    setFormData(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField]
    }));
  };

  const handleUpdateCustomField = (id: string, key: 'label' | 'value', val: string) => {
    if (readOnly) return;
    setFormData(prev => ({
      ...prev,
      customFields: (prev.customFields || []).map(cf => cf.id === id ? { ...cf, [key]: val } : cf)
    }));
  };

  const handleDeleteCustomField = (id: string) => {
    if (readOnly) return;
    setFormData(prev => ({
      ...prev,
      customFields: (prev.customFields || []).filter(cf => cf.id !== id)
    }));
  };

  const renderCustomFields = (section: string) => {
    const fields = (formData.customFields || []).filter(cf => cf.section === section);
    return (
      <>
        {fields.map(cf => (
          <div key={cf.id} className="col-span-1 md:col-span-1 lg:col-span-1 relative group">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-2">
                <input
                  readOnly={readOnly}
                  value={cf.label}
                  onChange={(e) => handleUpdateCustomField(cf.id, 'label', e.target.value)}
                  className="text-xs font-semibold text-slate-500 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 outline-none w-full transition-colors px-1 py-0.5"
                  placeholder="اسم الحقل..."
                />
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => handleDeleteCustomField(cf.id)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 flex-shrink-0"
                    title="حذف الحقل"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
              <input
                readOnly={readOnly}
                value={cf.value}
                onChange={(e) => handleUpdateCustomField(cf.id, 'value', e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm p-2 transition-all"
                placeholder="القيمة..."
              />
            </div>
          </div>
        ))}
        {!readOnly && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-1 mb-2">
            <button
              type="button"
              onClick={() => handleAddCustomField(section)}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus size={14} />
              إضافة حقل جديد
            </button>
          </div>
        )}
      </>
    );
  };

  const handleChange = (field: keyof Employee, value: any) => {
`;

file = file.replace(/  const handleChange = \(field: keyof Employee, value: any\) => \{/, handlersCode.trim() + " {");

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
