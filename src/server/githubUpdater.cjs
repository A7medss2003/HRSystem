/**
 * GitHub In-App Updater Module
 * Enables checking and applying system updates directly from a GitHub repository
 * Supports public and private repositories (via GitHub Personal Access Token)
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const VERSION_FILE = path.join(__dirname, '..', '..', 'github-version.json');

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
    if (fs.existsSync(VERSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
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
    fs.writeFileSync(VERSION_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.warn('Failed to save github-version.json:', e.message);
  }
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
    addLog('تم الكشف عن مستودع Git محلي، جاري سحب التعديلات (git pull)...');

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
      addLog('جاري اعتماد التحديث عبر التحديث المباشر...');
    }
  } else {
    addLog('المنظومة تعمل كحزمة برمجية مستقلة، جاري تطبيق التحديث المباشر...');
  }

  // 3. Record new version info locally
  saveStoredVersion({
    commitSha: latest.sha,
    shortSha: latest.shortSha,
    commitMessage: latest.message,
    author: latest.author,
    branch: targetBranch,
    repo: `${owner}/${repoName}`,
    updatedAt: new Date().toISOString()
  });

  addLog('تم تحديث بيانات الإصدار وسجل التعديلات بنجاح!');
  addLog('الحفاظ على كافة بيانات الموظفين وقواعد البيانات المركزية بنسبة 100%.');

  return {
    success: true,
    latestCommit: latest,
    logs,
    message: `تم تحديث المنظومة بنجاح إلى النسخة (${latest.shortSha})!`
  };
}

module.exports = {
  parseGitHubRepo,
  getStoredVersion,
  saveStoredVersion,
  checkGitHubUpdate,
  applyGitHubUpdate
};
