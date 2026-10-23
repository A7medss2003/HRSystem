const fs = require('fs');
let file = fs.readFileSync('src/pages/EmployeeDetail.tsx', 'utf8');

const modalUI = `
      {/* Global Field Modal */}
      {showFieldModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden" dir="rtl">
            <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="font-bold text-slate-800">إضافة معلومات إضافية (تطبق على جميع الموظفين)</h3>
              <button onClick={() => setShowFieldModal(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">اسم الحقل الجديد</label>
                <input 
                  type="text" 
                  value={newFieldDef.label} 
                  onChange={e => setNewFieldDef({...newFieldDef, label: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="مثال: رقم الحساب البنكي"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">حجم الحقل (التنسيق)</label>
                <select 
                  value={newFieldDef.width} 
                  onChange={e => setNewFieldDef({...newFieldDef, width: e.target.value as '1'|'2'|'3'})}
                  className="w-full border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="1">قصير (ثلث العرض - يتيح وضع 3 حقول بجانب بعض)</option>
                  <option value="2">متوسط (ثلثي العرض)</option>
                  <option value="3">طويل (عرض كامل - سطر مستقل)</option>
                </select>
              </div>
            </div>
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button onClick={() => setShowFieldModal(false)} className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">
                إلغاء
              </button>
              <button onClick={handleSaveGlobalField} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                حفظ الحقل
              </button>
            </div>
          </div>
        </div>
      )}
`;

file = file.replace(
  /<\/form>\s*<\/div>\s*<\/div>\s*<\/div>\s*<\/div>\s*\);\s*\}/,
  `</form>
          </div>
        </div>
      </div>
      ${modalUI}
    </div>
  );
}`
);

fs.writeFileSync('src/pages/EmployeeDetail.tsx', file);
