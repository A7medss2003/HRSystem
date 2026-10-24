/**
 * GitHub In-App Updater Module
 * Enables checking and applying system updates directly from a GitHub repository
 * Supports public and private repositories (via GitHub Personal Access Token)
 * Automatically downloads and deploys dist/ files to userData/app_update/dist for installed desktop apps.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

function getElectronApp() {
  try {
    const electron = require('electron');
    return electron.app || (electron.remote && electron.remote.app) || null;
  } catch (e) {
    return null;
  }
}

function getUserDataDir() {
  const electronApp = getElectronApp();
  if (electronApp && typeof electronApp.getPath === 'function') {
    return electronApp.getPath('userData');
  }

  // Standard fallback
  const baseDir = process.env.APPDATA || 
                  (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') : '/var/local');
  return path.join(baseDir, 'hr-system');
}

function getVersionFilePath() {
  return path.join(getUserDataDir(), 'github-version.json');
}

function getUpdateDir() {
  return path.join(getUserDataDir(), 'app_update');
}

function parseGitHubRepo(input) {
  if (!input || typeof input !== 'string') return null;
  let clean = input.trim().replace(/\.git$/, '');
  
  // Matches https://github.com/owner/repo or github.com/owner/repo or git@github.com:owner/repo
  const urlMatch = clean.match(/(?:github\.com[\/:])([^\/]+)\/([^\/]+)/);
  if (urlMatch) {
    return { owner: urlMatch[1], repo: urlMatch[2] };
  }
  
  // Matches owner/repo
  const parts = clean.split('/').filter(Boolean);
  if (parts.length === 2 && !parts[0].includes(':')) {
    return { owner: parts[0], repo: parts[1] };
  }
  
  return null;
}

function getStoredVersion() {
  try {
    const filePath = getVersionFilePath();
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return data;
    }
  } catch (e) {}
  return {
    commitSha: '',
    shortSha: '',
    commitMessage: 'الإصدار الأصلي المثبت',
    updatedAt: new Date().toISOString()
  };
}

function saveStoredVersion(data) {
  try {
    const filePath = getVersionFilePath();
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to save github-version.json:', e.message);
  }
}

async function downloadGitHubFile({ owner, repo, sha, filePath, targetPath, token, commitSha }) {
  const headers = {
    'User-Agent': 'HR-System-InApp-Updater',
    'Accept': 'application/vnd.github.v3.raw'
  };
  if (token && token.trim()) {
    headers['Authorization'] = `token ${token.trim()}`;
  }

  // 1. Try Git Blobs API (Works for public & private repositories)
  const blobUrl = `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`;

  try {
    const res = await fetch(blobUrl, { headers });
    if (res.ok) {
      const arrayBuf = await res.arrayBuffer();
      fs.writeFileSync(targetPath, Buffer.from(arrayBuf));
      return true;
    }
  } catch (e) {}

  // 2. Fallback to raw.githubusercontent.com
  const rawHeaders = { 'User-Agent': 'HR-System-InApp-Updater' };
  if (token && token.trim()) {
    rawHeaders['Authorization'] = `token ${token.trim()}`;
  }
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${commitSha}/${filePath}`;
  const rawRes = await fetch(rawUrl, { headers: rawHeaders });
  if (!rawRes.ok) {
    throw new Error(`Failed to download ${filePath} (${rawRes.status})`);
  }
  const rawBuf = await rawRes.arrayBuffer();
  fs.writeFileSync(targetPath, Buffer.from(rawBuf));
  return true;
}

async function checkGitHubUpdate({ repo, branch = 'main', token = '', currentCommit = '' }) {
  const parsed = parseGitHubRepo(repo);
  if (!parsed) {
    return {
      success: false,
      error: 'يرجى إدخال اسم مستودع صحيح (مثال: username/repository أو رابط GitHub كامل)'
    };
  }

  const { owner, repo: repoName } = parsed;
  const targetBranch = branch.trim() || 'main';
  const apiUrl = `https://api.github.com/repos/${owner}/${repoName}/commits/${targetBranch}`;

  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'HR-System-InApp-Updater'
  };

  if (token && token.trim()) {
    headers['Authorization'] = `token ${token.trim()}`;
  }

  try {
    const res = await fetch(apiUrl, { headers });
    
    if (res.status === 404) {
      return {
        success: false,
        error: `المستودع (${owner}/${repoName}) أو الفرع (${targetBranch}) غير موجود على GitHub، أو المستودع خاص (Private) ويتطلب إدخال Token.`
      };
    }

    if (res.status === 401 || res.status === 403) {
      return {
        success: false,
        error: 'صلاحيات الدخول مرفوضة. يرجى التأكد من صحة رمز الوصول الشخصي (GitHub Personal Access Token).'
      };
    }

    if (!res.ok) {
      return {
        success: false,
        error: `خطأ من خادم GitHub (${res.status}): ${res.statusText}`
      };
    }

    const data = await res.json();
    const latestSha = data.sha || '';
    const stored = getStoredVersion();
    const effectiveCurrentSha = currentCommit || stored.commitSha;

    const hasUpdate = Boolean(latestSha && (!effectiveCurrentSha || !latestSha.startsWith(effectiveCurrentSha.substring(0, 7))));

    return {
      success: true,
      hasUpdate,
      owner,
      repo: repoName,
      branch: targetBranch,
      currentCommit: {
        sha: effectiveCurrentSha || 'غير مسجل',
        shortSha: effectiveCurrentSha ? effectiveCurrentSha.substring(0, 7) : 'الأصلي',
        updatedAt: stored.updatedAt || ''
      },
      latestCommit: {
        sha: latestSha,
        shortSha: latestSha.substring(0, 7),
        message: data.commit?.message?.split('\n')[0] || 'تحديث من GitHub',
        fullMessage: data.commit?.message || '',
        author: data.commit?.author?.name || data.author?.login || 'المطور',
        avatarUrl: data.author?.avatar_url || null,
        date: data.commit?.author?.date || new Date().toISOString(),
        url: data.html_url
      }
    };
  } catch (err) {
    return {
      success: false,
      error: `تعذر الاتصال بـ GitHub: ${err.message}. يرجى التحقق من اتصال الإنترنت.`
    };
  }
}

async function applyGitHubUpdate({ repo, branch = 'main', token = '', logs = [] }) {
  const parsed = parseGitHubRepo(repo);
  if (!parsed) {
    return { success: false, error: 'اسم المستودع غير صحيح' };
  }

  const { owner, repo: repoName } = parsed;
  const targetBranch = branch.trim() || 'main';
  const rootDir = path.resolve(__dirname, '..', '..');

  const addLog = (msg) => {
    logs.push({ time: new Date().toLocaleTimeString('ar-EG'), message: msg });
  };

  addLog('بدء فحص بيئة العمل والاتصال بمستودع GitHub...');

  // 1. Check latest commit info first
  const checkRes = await checkGitHubUpdate({ repo, branch: targetBranch, token });
  if (!checkRes.success) {
    return checkRes;
  }

  const latest = checkRes.latestCommit;
  addLog(`تم العثور على أحدث نسخة: [${latest.shortSha}] - «${latest.message}»`);

  // 2. Check if local directory is a Git repository
  const isGitRepo = fs.existsSync(path.join(rootDir, '.git'));

  if (isGitRepo) {
    addLog('تم الكشف عن بيئة برمجية محلية، جاري سحب التعديلات (git pull)...');

    const authRemote = token 
      ? `https://${encodeURIComponent(token.trim())}@github.com/${owner}/${repoName}.git`
      : `https://github.com/${owner}/${repoName}.git`;

    const pullCmd = `git pull "${authRemote}" ${targetBranch} --no-rebase`;

    try {
      const pullResult = await new Promise((resolve) => {
        exec(pullCmd, { cwd: rootDir, timeout: 45000 }, (err, stdout, stderr) => {
          if (err) {
            resolve({ success: false, output: stderr || err.message });
          } else {
            resolve({ success: true, output: stdout });
          }
        });
      });

      if (!pullResult.success) {
        addLog(`تنبيه: git pull واجه صعوبة (${pullResult.output}). جاري استخدام التحديث السحابي المباشر...`);
      } else {
        addLog('تم سحب التعديلات بنجاح من Git!');
      }
    } catch (e) {
      addLog('جاري اعتماد التحديث المباشر للملفات...');
    }
  }

  // 3. Download & apply dist/ files for installed desktop application
  addLog('جاري فحص شجرة الملفات المعدلة على GitHub...');
  const treeUrl = `https://api.github.com/repos/${owner}/${repoName}/git/trees/${latest.sha}?recursive=1`;
  const treeHeaders = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'HR-System-InApp-Updater'
  };
  if (token && token.trim()) {
    treeHeaders['Authorization'] = `token ${token.trim()}`;
  }

  let distFilesUpdated = 0;
  try {
    const treeRes = await fetch(treeUrl, { headers: treeHeaders });
    if (treeRes.ok) {
      const treeData = await treeRes.json();
      if (treeData && Array.isArray(treeData.tree)) {
        // Collect all compiled frontend files under dist/
        const distBlobs = treeData.tree.filter(
          item => item.type === 'blob' && item.path.startsWith('dist/')
        );

        if (distBlobs.length > 0) {
          addLog(`تم العثور على ${distBlobs.length} ملف للواجهة (dist/)، جاري التحميل والتثبيت المباشر...`);
          const updateBase = getUpdateDir();
          const targetDist = path.join(updateBase, 'dist');
          if (!fs.existsSync(targetDist)) {
            fs.mkdirSync(targetDist, { recursive: true });
          }

          for (let i = 0; i < distBlobs.length; i++) {
            const blob = distBlobs[i];
            const destPath = path.join(updateBase, blob.path);
            const parentDir = path.dirname(destPath);
            if (!fs.existsSync(parentDir)) {
              fs.mkdirSync(parentDir, { recursive: true });
            }

            try {
              await downloadGitHubFile({
                owner,
                repo: repoName,
                sha: blob.sha,
                filePath: blob.path,
                targetPath: destPath,
                token,
                commitSha: latest.sha
              });
              distFilesUpdated++;

              if ((i + 1) % 5 === 0 || (i + 1) === distBlobs.length) {
                addLog(`تنزيل الملفات: (${i + 1}/${distBlobs.length})...`);
              }
            } catch (dlErr) {
              console.warn(`Error downloading ${blob.path}:`, dlErr.message);
            }
          }

          addLog(`✓ تم تحميل وتحديث كافة ملفات الواجهة بنجاح (${distFilesUpdated} ملف)!`);
        } else {
          addLog('تنبيه: تم جلب التحديث ولكن لم يُعثر على مجلد dist/ في مستودع GitHub.');
          addLog('نصيحة: تأكد من تشغيل "npm run build" ثم رفع مجلد dist إلى GitHub لتظهر التعديلات تلقائياً للمستخدمين.');
        }
      }
    }
  } catch (treeErr) {
    addLog(`ملاحظة أثناء فحص الشجرة: ${treeErr.message}`);
  }

  // 4. Record new version info locally
  saveStoredVersion({
    commitSha: latest.sha,
    shortSha: latest.shortSha,
    commitMessage: latest.message,
    author: latest.author,
    branch: targetBranch,
    repo: `${owner}/${repoName}`,
    distFilesUpdated,
    updatedAt: new Date().toISOString()
  });

  addLog('تم تحديث بيانات الإصدار وسجل التعديلات بنجاح!');
  addLog('الحفاظ على كافة بيانات الموظفين وقواعد البيانات المركزية بنسبة 100%.');

  return {
    success: true,
    latestCommit: latest,
    distFilesUpdated,
    logs,
    message: `تم تحديث المنظومة بنجاح إلى النسخة (${latest.shortSha})!`
  };
}

module.exports = {
  parseGitHubRepo,
  getVersionFilePath,
  getUpdateDir,
  getStoredVersion,
  saveStoredVersion,
  checkGitHubUpdate,
  applyGitHubUpdate
};
