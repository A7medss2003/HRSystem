const fs = require('fs');

// --- Patch BackupModal.tsx ---
let modalContent = fs.readFileSync('src/components/BackupModal.tsx', 'utf8');

const modalReplacement = `
            <div className="flex gap-2 items-center">
              <input 
                type="text" 
                dir="ltr"
                value={inputPath}
                onChange={e => setInputPath(e.target.value)}
                placeholder="مثال: D:\\HR_Backup"
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
              />
              <input 
                type="file" 
                id="modal-folder-picker"
                className="hidden"
                /* @ts-ignore */
                webkitdirectory="true"
                directory="true"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const file = e.target.files[0];
                    const fullPath = file.path || file.webkitRelativePath;
                    if (fullPath) {
                       // In Electron, file.path is absolute. 
                       // In browser, it's relative. Let's just use the path or dirname.
                       const dirPath = fullPath.substring(0, Math.max(fullPath.lastIndexOf('\\\\'), fullPath.lastIndexOf('/')));
                       setInputPath(dirPath || fullPath);
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => document.getElementById('modal-folder-picker')?.click()}
                className="bg-slate-200 text-slate-700 px-4 py-3 rounded-xl hover:bg-slate-300 font-medium transition-colors whitespace-nowrap"
              >
                تصفح...
              </button>
            </div>
`;

modalContent = modalContent.replace(
  /<div className="flex gap-2">\s*<input\s*type="text"\s*dir="ltr"\s*value=\{inputPath\}\s*onChange=\{e => setInputPath\(e\.target\.value\)\}\s*placeholder="D:\\\\HR_Backup"\s*className="[^"]*"\s*\/>\s*<\/div>/,
  modalReplacement
);

fs.writeFileSync('src/components/BackupModal.tsx', modalContent);

// --- Patch Settings.tsx ---
let settingsContent = fs.readFileSync('src/pages/Settings.tsx', 'utf8');

const settingsReplacement = `
              <div className="flex gap-2 items-center">
                <input 
                  type="text"
                  dir="ltr"
                  value={bPath}
                  onChange={(e) => setBPath(e.target.value)}
                  placeholder="اختر مسار الحفظ..."
                  className="flex-1 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input 
                  type="file" 
                  id="settings-folder-picker"
                  className="hidden"
                  /* @ts-ignore */
                  webkitdirectory="true"
                  directory="true"
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const file = e.target.files[0];
                      const fullPath = file.path || file.webkitRelativePath;
                      if (fullPath) {
                         const dirPath = fullPath.substring(0, Math.max(fullPath.lastIndexOf('\\\\'), fullPath.lastIndexOf('/')));
                         setBPath(dirPath || fullPath);
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('settings-folder-picker')?.click()}
                  className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg hover:bg-slate-300 text-sm font-medium transition-colors"
                >
                  تصفح...
                </button>
                <button 
                  onClick={handleSaveBackup}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  حفظ
                </button>
              </div>
`;

settingsContent = settingsContent.replace(
  /<div className="flex gap-2">\s*<input\s*type="text"\s*dir="ltr"\s*value=\{bPath\}\s*onChange=\{\(e\) => setBPath\(e\.target\.value\)\}\s*className="[^"]*"\s*\/>\s*<button\s*onClick=\{handleSaveBackup\}\s*className="[^"]*"\s*>\s*حفظ\s*<\/button>\s*<\/div>/,
  settingsReplacement
);

fs.writeFileSync('src/pages/Settings.tsx', settingsContent);
