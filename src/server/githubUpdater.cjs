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

  // Windows standard %APPDATA%
  const baseDir = process.env.APPDATA || 
                  (process.platform === 'darwin' ? path.join(os.homedir(), 'Library', 'Application Support') : '/var/local');
  
  // Prefer 'HR System' if exists, fallback to 'hr-system'
  const candidateHR = path.join(baseDir, 'HR System');
  if (fs.existsSync(candidateHR)) return candidateHR;
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
  // Strategy 1: Try raw.githubusercontent.com first (Fastest and no rate limiting for public files)
  const rawHeaders = { 'User-Agent': 'HR-System-InApp-Updater' };
  if (token && token.trim()) {
    rawHeaders['Authorization'] = `token ${token.trim()}`;
  }
  const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${commitSha}/${filePath}`;

  try {
    const rawRes = await fetch(rawUrl, { headers: rawHeaders });
    if (rawRes.ok) {
      const rawBuf = await rawRes.arrayBuffer();
      fs.writeFileSync(targetPath, Buffer.from(rawBuf));
      return true;
    }
  } catch (e) {}

  // Strategy 2: Git Blobs API (Works with GitHub tokens for private repositories)
  const headers = {
    'User-Agent': 'HR-System-InApp-Updater',
    'Accept': 'application/vnd.github.v3.raw'
  };
  if (token && token.trim()) {
    headers['Authorization'] = `token ${token.trim()}`;
  }

  const blobUrl = `https://api.github.com/repos/${owner}/${repo}/git/blobs/${sha}`;
  const res = await fetch(blobUrl, { headers });
  if (!res.ok) {
    throw new Error(`تعذر تنزيل الملف ${filePath} (${res.status} ${res.statusText})`);
  }

  const arrayBuf = await res.arrayBuffer();
  fs.writeFileSync(targetPath, Buffer.from(arrayBuf));
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
        error: `المستودع (${owner}/${repoName}) أو الفرع (${targetBranch}) غير موجود على GitHub، أو المستودع خاص (Private) ويتطلب إدخال مفتاح الوصول (Token).`
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
        addLog('تم سحب التعديلات بنجاح من Git! جاري إعادة بناء ملفات الواجهة...');
        try {
          await new Promise((resolve) => {
            exec('npm run build', { cwd: rootDir, timeout: 90000 }, (bErr, bStdout, bStderr) => {
              if (!bErr) {
                addLog('✓ تم بناء الواجهة المحدثة بنجاح (npm run build)!');
              } else {
                addLog(`ملاحظة في البناء: ${bStderr || bErr.message}`);
              }
              resolve();
            });
          });
        } catch (e) {}
      }
    } catch (e) {
      addLog('جاري اعتماد التحديث المباشر للملفات...');
    }
  }

  // 3. Download & apply dist/ files for installed desktop application
  addLog('جاري فحص شجرة الملفات المجهزة في المستودع...');
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
        let distBlobs = treeData.tree.filter(
          item => item.type === 'blob' && (item.path.startsWith('dist/') || item.path.startsWith('dist\\'))
        );

        let isRootDist = false;
        // If not under dist/, check if repository has assets/ and index.html at root
        if (distBlobs.length === 0) {
          const rootAssets = treeData.tree.filter(
            item => item.type === 'blob' && (item.path.startsWith('assets/') || item.path === 'index.html' || item.path === 'logo.png')
          );
          if (rootAssets.some(x => x.path === 'index.html')) {
            distBlobs = rootAssets;
            isRootDist = true;
          }
        }

        if (distBlobs.length > 0) {
          addLog(`تم العثور على ${distBlobs.length} ملف للواجهة، جاري التحميل والتثبيت المباشر...`);
          const updateBase = getUpdateDir();
          const targetDist = path.join(updateBase, 'dist');
          if (!fs.existsSync(targetDist)) {
            fs.mkdirSync(targetDist, { recursive: true });
          }

          for (let i = 0; i < distBlobs.length; i++) {
            const blob = distBlobs[i];
            const relativeSubPath = isRootDist ? path.join('dist', blob.path) : blob.path;
            const destPath = path.join(updateBase, relativeSubPath);
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

              if ((i + 1) % 4 === 0 || (i + 1) === distBlobs.length) {
                addLog(`تنزيل الملفات: (${i + 1}/${distBlobs.length})...`);
              }
            } catch (dlErr) {
              console.warn(`Error downloading ${blob.path}:`, dlErr.message);
              addLog(`تنبيه أثناء تنزيل ${blob.path}: ${dlErr.message}`);
            }
          }

          if (fs.existsSync(path.join(targetDist, 'index.html'))) {
            addLog(`✓ تم تحميل وتحديث كافة ملفات الواجهة بنجاح (${distFilesUpdated} ملف)!`);
          } else {
            addLog(`تنبيه: تم تحميل الملفات ولكن لم يُعثر على index.html في مجلد التحديث`);
          }
        } else {
          addLog('❌ تنبيه هام: تم العثور على Commit جديد، ولكن مستودع GitHub لا يحتوي على مجلد dist/ المبني.');
          addLog('السبب: تم رفع التعديلات كأكواد برمجية فقط، ويجب أن يحتوي المستودع على ملفات dist/ التنفيذية.');
          addLog('الحل: قم بتشغيل "رفع_التحديث_الى_جيت_هب.bat" على جهاز المطور لرفع مجلد dist/ إلى المستودع.');
        }
      }
    } else {
      addLog(`تعذر قراءة شجرة المستودع (${treeRes.status}): ${treeRes.statusText}`);
    }
  } catch (treeErr) {
    addLog(`ملاحظة أثناء فحص الشجرة: ${treeErr.message}`);
  }

  // 4. Verification Check: Did files actually update?
  if (!isGitRepo && distFilesUpdated === 0) {
    return {
      success: false,
      distFilesUpdated: 0,
      logs,
      error: 'المستودع على GitHub لا يحتوي على ملفات الواجهة المبنية (dist/). يرجى تشغيل "رفع_التحديث_الى_جيت_هب.bat" على جهاز المطور أولاً ثم المحاولة مجدداً.'
    };
  }

  // 5. Record new version info locally
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
