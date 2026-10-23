const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

const replacement = `
  const handleAddCustomField = (section: string) => {
    if (readOnly) return;
    const newField = {
      id: 'cf-' + Date.now() + Math.floor(Math.random() * 1000),
      section,
      label: 'معلومة إضافية',
      value: '',
      width: 'half',
      order: (formData.customFields || []).length
    };
    setFormData(prev => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField]
    }));
  };

  const handleUpdateCustomField = (id: string, key: 'label' | 'value' | 'width' | 'order', val: any) => {
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

  const handleMoveCustomField = (id: string, direction: 'up' | 'down') => {
    if (readOnly) return;
    setFormData(prev => {
      const fields = [...(prev.customFields || [])];
      const index = fields.findIndex(cf => cf.id === id);
      if (index === -1) return prev;
      
      if (direction === 'up' && index > 0) {
        // Swap with previous
        const temp = fields[index - 1];
        fields[index - 1] = fields[index];
        fields[index] = temp;
      } else if (direction === 'down' && index < fields.length - 1) {
        // Swap with next
        const temp = fields[index + 1];
        fields[index + 1] = fields[index];
        fields[index] = temp;
      }
      
      // Update orders
      fields.forEach((cf, i) => { cf.order = i; });
      return { ...prev, customFields: fields };
    });
  };

  const renderCustomFields = (section: string) => {
    const fields = (formData.customFields || []).filter(cf => cf.section === section).sort((a, b) => (a.order || 0) - (b.order || 0));
    return (
      <>
        {fields.map((cf, idx) => (
          <div key={cf.id} className={\`\${cf.width === 'full' ? 'col-span-1 md:col-span-2' : 'col-span-1 md:col-span-1'} relative group\`}>
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
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => handleUpdateCustomField(cf.id, 'width', cf.width === 'full' ? 'half' : 'full')}
                      className="text-slate-400 hover:text-blue-600 p-1 flex-shrink-0"
                      title={cf.width === 'full' ? "تصغير الحقل للنصف" : "تكبير الحقل للعرض الكامل"}
                    >
                      <Monitor size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCustomField(cf.id, 'up')}
                      className="text-slate-400 hover:text-blue-600 p-1 flex-shrink-0"
                      title="تحريك لأعلى"
                      disabled={idx === 0}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveCustomField(cf.id, 'down')}
                      className="text-slate-400 hover:text-blue-600 p-1 flex-shrink-0"
                      title="تحريك لأسفل"
                      disabled={idx === fields.length - 1}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteCustomField(cf.id)}
                      className="text-red-400 hover:text-red-600 p-1 flex-shrink-0"
                      title="حذف الحقل"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
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
          <div className="col-span-1 md:col-span-2 mt-2 mb-2 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-lg p-2 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => handleAddCustomField(section)}>
            <button
              type="button"
              className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              <Plus size={14} />
              إضافة حقل جديد هنا
            </button>
          </div>
        )}
      </>
    );
  };
`;

file = file.replace(/  const handleAddCustomField = \(section: string\) => \{[\s\S]*?<\/>\n    \);\n  \};/, replacement.trim());

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
