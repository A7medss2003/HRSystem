const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

const newRender = `
  const handleUpdateGlobalFieldValue = (fieldId: string, val: string) => {
    if (readOnly) return;
    setFormData(prev => {
      let currentFields = prev.customFields || [];
      const exists = currentFields.find(cf => cf.id === fieldId);
      if (exists) {
        currentFields = currentFields.map(cf => cf.id === fieldId ? { ...cf, value: val } : cf);
      } else {
        currentFields = [...currentFields, { id: fieldId, section: '', label: '', value: val }];
      }
      return { ...prev, customFields: currentFields };
    });
  };

  const renderCustomFields = (section: string) => {
    const fields = (globalCustomFields || []).filter(cf => cf.section === section);
    return (
      <>
        {fields.map(cf => {
          const valObj = (formData.customFields || []).find(f => f.id === cf.id);
          const val = valObj ? valObj.value : '';
          
          let colSpanClass = "col-span-1 md:col-span-1 lg:col-span-1";
          if (cf.width === '2') colSpanClass = "col-span-1 md:col-span-2 lg:col-span-2";
          if (cf.width === '3') colSpanClass = "col-span-1 md:col-span-2 lg:col-span-3";

          return (
            <div key={cf.id} className={\`\${colSpanClass} relative group\`}>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold text-slate-500">
                    {cf.label}
                  </label>
                  {isAdmin && !readOnly && (
                    <button
                      type="button"
                      onClick={() => handleDeleteGlobalField(cf.id)}
                      className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity p-1 flex-shrink-0"
                      title="حذف الحقل لجميع الموظفين"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
                <input
                  readOnly={readOnly}
                  value={val}
                  onChange={(e) => handleUpdateGlobalFieldValue(cf.id, e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm p-2 transition-all"
                  placeholder="القيمة..."
                />
              </div>
            </div>
          );
        })}
        {isAdmin && !readOnly && (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 mt-1 mb-2">
            <button
              type="button"
              onClick={() => handleOpenFieldModal(section)}
              className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-md transition-colors"
            >
              <Plus size={14} />
              إضافة معلومات إضافية (للمدير فقط)
            </button>
          </div>
        )}
      </>
    );
  };
`;

const regex = /const handleAddCustomField[\s\S]*?const handleChange = /m;
file = file.replace(regex, newRender + "\n  const handleChange = ");

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
