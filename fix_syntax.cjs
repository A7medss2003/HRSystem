const fs = require('fs');

let settings = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const correctEnding = `
          </div>
        </div>
      </div>
      
      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">تغيير كلمة المرور</h2>
            </div>
            <form onSubmit={handleChangePassword} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الحالية</label>
                <input type="password" required value={passwords.old} onChange={e => setPasswords({...passwords, old: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-left" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">كلمة المرور الجديدة</label>
                <input type="password" required value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-left" dir="ltr" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">تأكيد كلمة المرور الجديدة</label>
                <input type="password" required value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} className="w-full p-2 border border-slate-200 rounded-lg text-left" dir="ltr" />
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setShowPasswordModal(false)} className="px-4 py-2 text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg">إلغاء</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">تأكيد التغيير</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
`;

// we will cut everything from the last `</div>` of the main container and replace it
const parts = settings.split('          </div>\n        </div>\n      </div>\n    </div>');
if (parts.length > 1) {
  settings = parts[0] + correctEnding;
}

fs.writeFileSync('src/pages/Settings.tsx', settings);

