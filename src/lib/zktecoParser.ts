import * as XLSX from 'xlsx';
import { 
  Employee, 
  AttendanceRecord, 
  AttendanceMovement, 
  RawFingerprintPunch, 
  AttendanceImportPreviewRow, 
  AttendanceImportConfig 
} from '../types';

/**
 * دالة مساعدة لتطبيع الأسماء العربية للمطابقة الدقيقة والذكية
 */
export function normalizeArabicName(name: string): string {
  if (!name) return '';
  return name
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, '') // حذف التشكيل
    .replace(/[أإآ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ');
}

/**
 * تحويل وقت HH:mm أو HH:mm:ss إلى دقائق من منتصف الليل
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const parts = timeStr.trim().split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

/**
 * تحويل الدقائق إلى صيغة HH:mm
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = Math.floor(minutes % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * مطابقة سجل البصمة مع الموظفين المسجلين في النظام
 * تدعم: رقم البصمة (fingerprintId)، الرقم الوظيفي (employeeId)، الاسم الكامل، أو الرقم الوطني
 */
export function matchEmployee(
  pin: string, 
  nameInFile: string | undefined, 
  employees: Employee[]
): { employee?: Employee; matchMethod: 'fingerprintId' | 'employeeId' | 'fullName' | 'nationalId' | 'none' } {
  const cleanPin = pin ? pin.trim() : '';
  const pinDigitsOnly = cleanPin.replace(/\D/g, '');

  // 1. المطابقة برقم البصمة المعرف في النظام (fingerprintId)
  if (cleanPin) {
    const byFingerprint = employees.find(e => 
      e.fingerprintId && (
        e.fingerprintId.trim() === cleanPin ||
        e.fingerprintId.trim().replace(/\D/g, '') === pinDigitsOnly
      )
    );
    if (byFingerprint) {
      return { employee: byFingerprint, matchMethod: 'fingerprintId' };
    }
  }

  // 2. المطابقة بالرقم الوظيفي (employeeId)
  if (cleanPin) {
    const byEmpId = employees.find(e => {
      if (!e.employeeId) return false;
      const empClean = e.employeeId.trim();
      const empDigits = empClean.replace(/\D/g, '');
      return (
        empClean.toLowerCase() === cleanPin.toLowerCase() ||
        (pinDigitsOnly && empDigits && empDigits === pinDigitsOnly)
      );
    });
    if (byEmpId) {
      return { employee: byEmpId, matchMethod: 'employeeId' };
    }
  }

  // 3. المطابقة بالرقم الوطني إن وُجد
  if (cleanPin && cleanPin.length >= 6) {
    const byNational = employees.find(e => e.nationalId && e.nationalId.trim() === cleanPin);
    if (byNational) {
      return { employee: byNational, matchMethod: 'nationalId' };
    }
  }

  // 4. المطابقة بالاسم إن وُجد في الملف
  if (nameInFile && nameInFile.trim()) {
    const normalizedTarget = normalizeArabicName(nameInFile);
    
    // مطابقة تامة
    const exactName = employees.find(e => normalizeArabicName(e.fullName) === normalizedTarget);
    if (exactName) {
      return { employee: exactName, matchMethod: 'fullName' };
    }

    // مطابقة جزئية ذكية (إذا كان الاسم يتطابق بالكلمات الأساسية)
    const partialName = employees.find(e => {
      const empNorm = normalizeArabicName(e.fullName);
      return empNorm.includes(normalizedTarget) || normalizedTarget.includes(empNorm);
    });
    if (partialName) {
      return { employee: partialName, matchMethod: 'fullName' };
    }
  }

  return { matchMethod: 'none' };
}

/**
 * تحليل سطر نصي من ملف attlog.dat أو attlog.txt
 * صيغة ZKTeco النموذجية:
 * UserPIN\tDateTime\tVerifyType\tInOutState\tWorkCode
 * مثال: 1\t2026-10-15 08:30:00\t1\t0\t0\t0
 */
export function parseZkTextLine(line: string): RawFingerprintPunch | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  // جرب أولاً التقسيم بـ Tabs، ثم الفاصلة، ثم المسافات
  let parts = trimmed.split('\t').map(s => s.trim()).filter(Boolean);
  if (parts.length < 2) {
    parts = trimmed.split(',').map(s => s.trim()).filter(Boolean);
  }
  if (parts.length < 2) {
    // محاولة التقسيم بالمسافات مع مراعاة أن التاريخ والوقت بينهما مسافة
    const spaceParts = trimmed.split(/\s+/);
    if (spaceParts.length >= 3) {
      const pin = spaceParts[0];
      const datePart = spaceParts[1];
      const timePart = spaceParts[2];
      const inOutState = spaceParts[4] || spaceParts[3];
      parts = [pin, `${datePart} ${timePart}`, spaceParts[3], inOutState];
    }
  }

  if (parts.length < 2) return null;

  const pin = parts[0];
  const dateStrRaw = parts[1];
  const parsedDate = parseDateTimeString(dateStrRaw);
  if (!parsedDate || isNaN(parsedDate.getTime())) return null;

  const dateStr = formatDateToYMD(parsedDate);
  const timeStr = formatTimeToHMS(parsedDate);

  // تحديد نوع الحركة إن توفر في الملف
  let state: 'in' | 'out' | 'auto' = 'auto';
  const stateVal = parts[3] || parts[2];
  if (stateVal !== undefined) {
    const s = String(stateVal).trim().toLowerCase();
    if (s === '0' || s.includes('in') || s.includes('دخول') || s.includes('حضور')) {
      state = 'in';
    } else if (s === '1' || s.includes('out') || s.includes('خروج') || s.includes('انصراف')) {
      state = 'out';
    }
  }

  return {
    pin,
    timestamp: parsedDate,
    dateStr,
    timeStr,
    state,
    verifyType: parts[2]
  };
}

/**
 * تحليل التاريخ والوقت من نصوص بمختلف الصيغ الممكنة
 */
export function parseDateTimeString(val: any): Date | null {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  // في حالة رقم تسلسلي من Excel
  if (typeof val === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = Math.round(val * 86400000);
    const date = new Date(excelEpoch.getTime() + ms);
    return isNaN(date.getTime()) ? null : date;
  }

  const str = String(val).trim();
  if (!str) return null;

  // تجربة صيغة ISO / Standard Date
  const standardDate = new Date(str);
  if (!isNaN(standardDate.getTime()) && standardDate.getFullYear() > 1990) {
    return standardDate;
  }

  // تجربة صيغ: YYYY-MM-DD HH:mm:ss أو DD/MM/YYYY HH:mm:ss أو YYYY/MM/DD
  const match = str.match(/(\d{2,4})[-/.](\d{1,2})[-/.](\d{1,4})(?:\s+(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?)?/);
  if (match) {
    let year = parseInt(match[1], 10);
    let month = parseInt(match[2], 10) - 1;
    let day = parseInt(match[3], 10);

    // إذا كان التاريخ بالصيغة اليوم/الشهر/السنة (مثل 15/10/2026)
    if (year < 32 && day > 1000) {
      const temp = year;
      year = day;
      day = temp;
    }

    const hours = parseInt(match[4] || '0', 10);
    const minutes = parseInt(match[5] || '0', 10);
    const seconds = parseInt(match[6] || '0', 10);

    const d = new Date(year, month, day, hours, minutes, seconds);
    if (!isNaN(d.getTime())) return d;
  }

  return null;
}

export function formatDateToYMD(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTimeToHMS(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export function formatTimeToHM(d: Date): string {
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

/**
 * تحليل ملف إكسل أو CSV أو DAT أو TXT
 */
export async function parseAttendanceFile(
  file: File,
  config: AttendanceImportConfig,
  employees: Employee[],
  existingRecords: AttendanceRecord[]
): Promise<{ previewRows: AttendanceImportPreviewRow[]; rawPunchesCount: number; errors: string[] }> {
  const fileName = file.name.toLowerCase();

  if (fileName.endsWith('.dat') || fileName.endsWith('.txt')) {
    const text = await file.text();
    return parseAttendanceRawText(text, config, employees, existingRecords);
  }

  // ملف Excel أو CSV
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  
  const punches: RawFingerprintPunch[] = [];
  const errors: string[] = [];

  // فحص أول ورقة عمل أو الورقة الأولى التي تحتوي على بيانات
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { previewRows: [], rawPunchesCount: 0, errors: ['الملف لا يحتوي على أوراق عمل صالحة'] };
  }

  const sheet = workbook.Sheets[sheetName];
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

  if (!rows || rows.length === 0) {
    return { previewRows: [], rawPunchesCount: 0, errors: ['ملف الإكسل فارغ'] };
  }

  // البحث عن صف الترويسة (Header) ومطابقة الأعمدة
  let headerIndex = -1;
  let pinCol = -1;
  let nameCol = -1;
  let dateTimeCol = -1;
  let dateCol = -1;
  let timeCol = -1;
  let stateCol = -1;
  let checkInCol = -1;
  let checkOutCol = -1;

  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i];
    if (!Array.isArray(row)) continue;

    for (let c = 0; c < row.length; c++) {
      const cell = String(row[c] || '').trim().toLowerCase();
      if (!cell) continue;

      if (pinCol === -1 && /رقم.*(موظف|بصمة|تسجيل|تعريفي|مستخدم)|pin|id|enroll|ac-no|emp.*id|user.*id|badge|no\b/i.test(cell)) {
        pinCol = c;
      }
      if (nameCol === -1 && /اسم.*(موظف|المستخدم)?|name|emp.*name/i.test(cell)) {
        nameCol = c;
      }
      if (dateTimeCol === -1 && /(تاريخ.*وقت|وقت.*تاريخ|datetime|date.*time|record.*time|ساعة.*تسجيل)/i.test(cell)) {
        dateTimeCol = c;
      }
      if (dateCol === -1 && /(^تاريخ$|تاريخ.*اليوم|date)/i.test(cell)) {
        dateCol = c;
      }
      if (timeCol === -1 && /(^وقت$|ساعة|time)/i.test(cell)) {
        timeCol = c;
      }
      if (stateCol === -1 && /(حالة|نوع.*(حركة|بصمة)|state|status|in.*out|punch|type)/i.test(cell)) {
        stateCol = c;
      }
      if (checkInCol === -1 && /(وقت.*حضور|حضور|دخول|check.*in|c\/in)/i.test(cell)) {
        checkInCol = c;
      }
      if (checkOutCol === -1 && /(وقت.*انصراف|انصراف|خروج|check.*out|c\/out)/i.test(cell)) {
        checkOutCol = c;
      }
    }

    if (pinCol !== -1 || nameCol !== -1 || (dateCol !== -1 && (timeCol !== -1 || checkInCol !== -1))) {
      headerIndex = i;
      break;
    }
  }

  // إذا لم نجد ترويسة واضحة، نتعامل مع الملف كأعمدة افتراضية أو نجرب نمط ZKTeco
  const startIndex = headerIndex >= 0 ? headerIndex + 1 : 0;
  if (pinCol === -1 && nameCol === -1) {
    // تعيين افتراضي: العمود 0 = رقم الموظف، العمود 1 = التاريخ/الوقت
    pinCol = 0;
    dateTimeCol = 1;
  }

  for (let r = startIndex; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length === 0) continue;

    const rawPin = pinCol !== -1 ? String(row[pinCol] || '').trim() : '';
    const rawName = nameCol !== -1 ? String(row[nameCol] || '').trim() : undefined;

    if (!rawPin && !rawName) continue;

    // حالة 1: وجود عمودي الحضور والانصراف المنفصلين في نفس الصف (Daily Summary Row)
    if (checkInCol !== -1 || checkOutCol !== -1) {
      const dateVal = dateCol !== -1 ? row[dateCol] : undefined;
      const baseDate = parseDateTimeString(dateVal);
      const dateStr = baseDate ? formatDateToYMD(baseDate) : formatDateToYMD(new Date());

      const inVal = checkInCol !== -1 ? row[checkInCol] : null;
      const outVal = checkOutCol !== -1 ? row[checkOutCol] : null;

      if (inVal) {
        const inDate = parseCombinedDateAndTime(dateStr, inVal);
        if (inDate) {
          punches.push({
            pin: rawPin || rawName || '1',
            name: rawName,
            timestamp: inDate,
            dateStr,
            timeStr: formatTimeToHMS(inDate),
            state: 'in'
          });
        }
      }

      if (outVal) {
        const outDate = parseCombinedDateAndTime(dateStr, outVal);
        if (outDate) {
          punches.push({
            pin: rawPin || rawName || '1',
            name: rawName,
            timestamp: outDate,
            dateStr,
            timeStr: formatTimeToHMS(outDate),
            state: 'out'
          });
        }
      }
      continue;
    }

    // حالة 2: صف لكل حركة بصمة (Standard Transaction Log)
    let punchDate: Date | null = null;
    if (dateTimeCol !== -1 && row[dateTimeCol]) {
      punchDate = parseDateTimeString(row[dateTimeCol]);
    } else if (dateCol !== -1 && timeCol !== -1) {
      punchDate = parseCombinedDateAndTime(row[dateCol], row[timeCol]);
    } else if (dateCol !== -1) {
      punchDate = parseDateTimeString(row[dateCol]);
    }

    if (punchDate && !isNaN(punchDate.getTime())) {
      let state: 'in' | 'out' | 'auto' = 'auto';
      if (stateCol !== -1 && row[stateCol] !== undefined) {
        const s = String(row[stateCol]).trim().toLowerCase();
        if (s === '0' || s.includes('in') || s.includes('دخول') || s.includes('حضور')) {
          state = 'in';
        } else if (s === '1' || s.includes('out') || s.includes('خروج') || s.includes('انصراف')) {
          state = 'out';
        }
      }

      punches.push({
        pin: rawPin || rawName || '',
        name: rawName,
        timestamp: punchDate,
        dateStr: formatDateToYMD(punchDate),
        timeStr: formatTimeToHMS(punchDate),
        state
      });
    }
  }

  return processPunchesToPreview(punches, config, employees, existingRecords, errors);
}

/**
 * دمج التاريخ والوقت إذا كانا في عمودين منفصلين
 */
function parseCombinedDateAndTime(dateVal: any, timeVal: any): Date | null {
  if (!dateVal && !timeVal) return null;
  const dObj = parseDateTimeString(dateVal);
  const timeStr = String(timeVal || '').trim();

  if (dObj && timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?/);
    if (timeMatch) {
      const hours = parseInt(timeMatch[1], 10);
      const minutes = parseInt(timeMatch[2], 10);
      const seconds = parseInt(timeMatch[3] || '0', 10);
      return new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate(), hours, minutes, seconds);
    }
    const tObj = parseDateTimeString(timeVal);
    if (tObj) {
      return new Date(dObj.getFullYear(), dObj.getMonth(), dObj.getDate(), tObj.getHours(), tObj.getMinutes(), tObj.getSeconds());
    }
    return dObj;
  }
  return dObj || parseDateTimeString(timeVal);
}

/**
 * معالجة النصوص المباشرة أو ملفات attlog.dat / txt
 */
export function parseAttendanceRawText(
  text: string,
  config: AttendanceImportConfig,
  employees: Employee[],
  existingRecords: AttendanceRecord[]
): { previewRows: AttendanceImportPreviewRow[]; rawPunchesCount: number; errors: string[] } {
  const lines = text.split(/\r?\n/);
  const punches: RawFingerprintPunch[] = [];
  const errors: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const punch = parseZkTextLine(lines[i]);
    if (punch) {
      punches.push(punch);
    }
  }

  return processPunchesToPreview(punches, config, employees, existingRecords, errors);
}

/**
 * تجميع حركات البصمة وتصفية التكرارات واحتساب أوقات الحضور وساعات العمل
 */
export function processPunchesToPreview(
  punches: RawFingerprintPunch[],
  config: AttendanceImportConfig,
  employees: Employee[],
  existingRecords: AttendanceRecord[],
  errors: string[] = []
): { previewRows: AttendanceImportPreviewRow[]; rawPunchesCount: number; errors: string[] } {
  if (punches.length === 0) {
    return {
      previewRows: [],
      rawPunchesCount: 0,
      errors: errors.length > 0 ? errors : ['لم يتم العثور على أي حركات بصمة صالحة في الملف']
    };
  }

  // 1. تجميع الحركات حسب الموظف وتاريخ اليوم: (pin_date)
  const groupMap = new Map<string, RawFingerprintPunch[]>();

  for (const punch of punches) {
    const key = `${punch.pin.trim()}__${punch.dateStr}`;
    const list = groupMap.get(key) || [];
    list.push(punch);
    groupMap.set(key, list);
  }

  const previewRows: AttendanceImportPreviewRow[] = [];
  const startWorkMinutes = timeToMinutes(config.workStartTime || '08:30');
  const graceMinutes = config.lateGraceMinutes ?? 15;
  const lateThreshold = startWorkMinutes + graceMinutes;

  for (const [key, groupPunches] of groupMap.entries()) {
    const [pin, dateStr] = key.split('__');
    const firstPunch = groupPunches[0];
    const nameInFile = firstPunch?.name;

    // فرز الحركات زمنياً
    groupPunches.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    // إلغاء تكرار البصمة السريعة (خلال دقيقة واحدة من نفس البصمة)
    const debouncedPunches: RawFingerprintPunch[] = [];
    for (const p of groupPunches) {
      if (debouncedPunches.length === 0) {
        debouncedPunches.push(p);
      } else {
        const last = debouncedPunches[debouncedPunches.length - 1];
        const diffSeconds = (p.timestamp.getTime() - last.timestamp.getTime()) / 1000;
        if (diffSeconds > 59) {
          debouncedPunches.push(p);
        }
      }
    }

    // مطابقة الموظف
    const match = matchEmployee(pin, nameInFile, employees);
    const matchedEmployee = match.employee;
    const matchMethod = match.matchMethod;

    // استخراج أوقات الحركات وتصنيفها (دخول / خروج)
    const movements: AttendanceMovement[] = [];
    const allTimes: string[] = [];

    for (let idx = 0; idx < debouncedPunches.length; idx++) {
      const p = debouncedPunches[idx];
      const timeHM = formatTimeToHM(p.timestamp);
      const minutes = timeToMinutes(timeHM);
      allTimes.push(timeHM);

      let mType: 'in' | 'out' = 'in';
      if (p.state === 'in') {
        mType = 'in';
      } else if (p.state === 'out') {
        mType = 'out';
      } else {
        // نمط تلقائي: الأولى دخول، الأخيرة خروج، وما بينهما يتناوب
        if (debouncedPunches.length === 1) {
          mType = 'in';
        } else if (idx === 0) {
          mType = 'in';
        } else if (idx === debouncedPunches.length - 1) {
          mType = 'out';
        } else {
          mType = idx % 2 === 1 ? 'out' : 'in';
        }
      }

      movements.push({
        id: `mov-${dateStr}-${pin}-${idx}-${p.timestamp.getTime()}`,
        type: mType,
        time: timeHM,
        minutesFromMidnight: minutes,
        verifyType: p.verifyType
      });
    }

    const checkInTime = allTimes[0] || '';
    const checkOutTime = allTimes.length > 1 ? allTimes[allTimes.length - 1] : undefined;

    // احتساب التأخير وساعات العمل
    const checkInMinutes = checkInTime ? timeToMinutes(checkInTime) : 0;
    const delayMinutes = checkInMinutes > lateThreshold ? Math.max(0, checkInMinutes - startWorkMinutes) : 0;
    const status: 'Present' | 'Late' | 'Absent' | 'Leave' = delayMinutes > 0 ? 'Late' : 'Present';

    let totalHours = 0;
    if (checkInTime && checkOutTime) {
      const checkOutMinutes = timeToMinutes(checkOutTime);
      const totalMinutes = Math.max(0, checkOutMinutes - checkInMinutes);
      totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    }

    // التحقق من وجود سجل مسبق لنفس اليوم والموظف
    const existing = existingRecords.find(r => 
      r.date === dateStr && (
        (matchedEmployee && (r.employeeId === matchedEmployee.id || r.employeeId === matchedEmployee.employeeId)) ||
        r.employeeId === pin
      )
    );

    previewRows.push({
      id: `preview-${pin}-${dateStr}`,
      pin,
      matchedEmployeeId: matchedEmployee?.id || (matchMethod === 'employeeId' ? pin : undefined),
      matchedEmployeeName: matchedEmployee?.fullName,
      originalNameInFile: nameInFile,
      matchMethod,
      date: dateStr,
      checkInTime,
      checkOutTime,
      allTimes,
      movements,
      totalHours,
      delayMinutes,
      status,
      isExisting: !!existing,
      existingRecordId: existing?.id,
      action: existing ? (config.mergeStrategy === 'overwrite' ? 'create' : config.mergeStrategy === 'skip' ? 'skip' : 'merge') : 'create'
    });
  }

  // ترتيب صفوف المعاينة حسب التاريخ تنازلياً ثم الموظف
  previewRows.sort((a, b) => b.date.localeCompare(a.date) || (a.matchedEmployeeName || a.pin).localeCompare(b.matchedEmployeeName || b.pin));

  return {
    previewRows,
    rawPunchesCount: punches.length,
    errors
  };
}

/**
 * دمج السجلات وتحديث قاعدة البيانات وفق استراتيجية الدمج المحددة
 */
export function applyAttendanceImport(
  previewRows: AttendanceImportPreviewRow[],
  currentRecords: AttendanceRecord[],
  config: AttendanceImportConfig
): { updatedRecords: AttendanceRecord[]; stats: { created: number; merged: number; skipped: number } } {
  const recordMap = new Map<string, AttendanceRecord>();

  // إضافة السجلات الحالية إلى الخريطة بمفتاح (employeeId + date)
  for (const rec of currentRecords) {
    recordMap.set(`${rec.employeeId}__${rec.date}`, { ...rec });
  }

  let created = 0;
  let merged = 0;
  let skipped = 0;

  for (const row of previewRows) {
    if (row.action === 'skip') {
      skipped++;
      continue;
    }

    const empId = row.matchedEmployeeId || row.pin;
    const empName = row.matchedEmployeeName || row.originalNameInFile || `موظف رقم ${row.pin}`;
    const key = `${empId}__${row.date}`;
    const existing = recordMap.get(key);

    if (existing && row.action === 'merge') {
      // استراتيجية الدمج الذكي: دمج حركات الحضور دون تكرار
      const combinedMovements = [...existing.movements];

      for (const newMov of row.movements) {
        const isDuplicate = combinedMovements.some(m => 
          Math.abs(m.minutesFromMidnight - newMov.minutesFromMidnight) < 2
        );
        if (!isDuplicate) {
          combinedMovements.push(newMov);
        }
      }

      // فرز الحركات زمنياً
      combinedMovements.sort((a, b) => a.minutesFromMidnight - b.minutesFromMidnight);

      // إعادة احتساب أوقات الحضور وساعات العمل
      const firstIn = combinedMovements[0];
      const lastOut = combinedMovements.length > 1 ? combinedMovements[combinedMovements.length - 1] : undefined;

      const startWorkMinutes = timeToMinutes(config.workStartTime || '08:30');
      const lateThreshold = startWorkMinutes + (config.lateGraceMinutes ?? 15);
      const delay = firstIn && firstIn.minutesFromMidnight > lateThreshold 
        ? Math.max(0, firstIn.minutesFromMidnight - startWorkMinutes) 
        : 0;
      
      let workHours = 0;
      if (firstIn && lastOut) {
        workHours = Math.round(((lastOut.minutesFromMidnight - firstIn.minutesFromMidnight) / 60) * 10) / 10;
      }

      recordMap.set(key, {
        ...existing,
        status: delay > 0 ? 'Late' : 'Present',
        movements: combinedMovements,
        workHours,
        delayMinutes: delay,
        source: 'zkteco'
      });
      merged++;
    } else {
      // إنشاء سجل جديد أو استبدال السابق بالكامل
      const newRec: AttendanceRecord = {
        id: existing?.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        employeeId: empId,
        employeeName: empName,
        date: row.date,
        status: row.status,
        movements: row.movements,
        workHours: row.totalHours,
        delayMinutes: row.delayMinutes,
        source: 'zkteco'
      };

      recordMap.set(key, newRec);
      if (existing) {
        merged++;
      } else {
        created++;
      }
    }
  }

  return {
    updatedRecords: Array.from(recordMap.values()),
    stats: { created, merged, skipped }
  };
}

/**
 * توليد ملف تجريبي بصيغة ZKTeco (dat, txt, csv, xlsx) لتجربة الاستيراد فوراً
 */
export function generateSampleZkFile(
  employees: Employee[],
  formatType: 'dat' | 'txt' | 'csv' | 'xlsx'
): { blob: Blob; fileName: string } {
  const today = new Date();
  const dateStr = formatDateToYMD(today);

  // استخدام أول 5 موظفين أو بيانات نموذجية
  const sampleEmployees = employees.length > 0 
    ? employees.slice(0, 5) 
    : [
        { id: '1', employeeId: '1', fullName: 'أحمد محمد علي', fingerprintId: '1' } as Employee,
        { id: '2', employeeId: '2', fullName: 'سالم عبد الله', fingerprintId: '2' } as Employee,
        { id: '3', employeeId: '3', fullName: 'فاطمة عمر', fingerprintId: '3' } as Employee
      ];

  if (formatType === 'dat' || formatType === 'txt') {
    let content = '';
    sampleEmployees.forEach((emp, index) => {
      const pin = emp.fingerprintId || emp.employeeId || String(index + 1);
      // حركة دخول
      const inMinute = 15 + index * 10; // 08:15, 08:25, 08:35 (متأخر)
      const inTimeStr = `08:${String(inMinute).padStart(2, '0')}:12`;
      content += `${pin}\t${dateStr} ${inTimeStr}\t1\t0\t0\t0\r\n`;

      // حركة خروج
      const outMinute = 30 + index * 5;
      const outTimeStr = `16:${String(outMinute).padStart(2, '0')}:45`;
      content += `${pin}\t${dateStr} ${outTimeStr}\t1\t1\t0\t0\r\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    return { blob, fileName: `attlog_sample_${dateStr}.${formatType}` };
  }

  if (formatType === 'csv') {
    let csv = '\uFEFFرقم الموظف,اسم الموظف,التاريخ,وقت الحضور,وقت الانصراف,الحالة\r\n';
    sampleEmployees.forEach((emp, index) => {
      const pin = emp.fingerprintId || emp.employeeId || String(index + 1);
      const inTime = `08:${String(20 + index * 10).padStart(2, '0')}`;
      const outTime = `16:${String(30 + index * 5).padStart(2, '0')}`;
      csv += `"${pin}","${emp.fullName}","${dateStr}","${inTime}","${outTime}","حاضر"\r\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    return { blob, fileName: `zkteco_attendance_sample_${dateStr}.csv` };
  }

  // إكسل XLSX
  const rows = [
    ['رقم الموظف', 'اسم الموظف', 'التاريخ', 'وقت الحضور', 'وقت الانصراف', 'الحالة']
  ];
  sampleEmployees.forEach((emp, index) => {
    const pin = emp.fingerprintId || emp.employeeId || String(index + 1);
    const inTime = `08:${String(20 + index * 10).padStart(2, '0')}`;
    const outTime = `16:${String(30 + index * 5).padStart(2, '0')}`;
    rows.push([pin, emp.fullName, dateStr, inTime, outTime, 'حاضر']);
  });

  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'سجلات الحضور');
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

  return { blob, fileName: `zkteco_attendance_sample_${dateStr}.xlsx` };
}
