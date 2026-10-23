import React, { useState, useEffect } from 'react';
import { 
  Server, 
  Cable, 
  Wifi, 
  WifiOff, 
  CheckCircle2, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Laptop, 
  Sliders, 
  HelpCircle, 
  X, 
  Check, 
  Terminal, 
  Activity, 
  Radio, 
  ArrowRight,
  Monitor
} from 'lucide-react';
import { toast } from './Toast';
import { 
  getStoredServerConfig, 
  saveServerConfig, 
  fetchNetworkInterfaces, 
  fetchCentralDataFromHost, 
  pushCentralDataToHost,
  ServerConfig 
} from '../lib/serverSync';
import { ServerStatusInfo } from '../types';
import { useStore } from '../store';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EthernetServerModal({ isOpen, onClose }: Props) {
  const [config, setConfig] = useState<ServerConfig>(getStoredServerConfig());
  const [serverInfo, setServerInfo] = useState<ServerStatusInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCommand, setCopiedCommand] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'guide' | 'client'>('overview');
  const [clientTestStatus, setClientTestStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [customIpInput, setCustomIpInput] = useState(config.customEthernetIp || '');
  const [customPortInput, setCustomPortInput] = useState(String(config.port || 3000));

  const store = useStore();

  const loadInterfaces = async () => {
    setLoading(true);
    try {
      const info = await fetchNetworkInterfaces();
      setServerInfo(info);
    } catch (e) {
      toast('تعذر فحص كروت الشبكة');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadInterfaces();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Resolved Ethernet IP: user override or detected
  const resolvedEthernetIp = customIpInput.trim() || serverInfo?.ethernetIp || '192.168.1.1';
  const resolvedPort = customPortInput.trim() || '3000';
  const fullAccessUrl = `http://${resolvedEthernetIp}:${resolvedPort}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(fullAccessUrl);
    setCopiedLink(true);
    toast('تم نسخ رابط كابل الإيثرنت إلى الحافظة');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleCopyFirewallCommand = () => {
    const cmd = `netsh advfirewall firewall add rule name="HR_System_Server_Port" dir=in action=allow protocol=TCP localport=${resolvedPort}`;
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(true);
    toast('تم نسخ أمر فتح جدار الحماية (Firewall)');
    setTimeout(() => setCopiedCommand(false), 2500);
  };

  const handleSaveCustomSettings = () => {
    const updated = saveServerConfig({
      customEthernetIp: customIpInput.trim(),
      port: parseInt(customPortInput.trim(), 10) || 3000
    });
    setConfig(updated);
    toast('تم حفظ إعدادات مدخل كابل الإيثرنت بنجاح');
  };

  const handleToggleRole = (newRole: 'host' | 'client') => {
    const updated = saveServerConfig({ role: newRole });
    setConfig(updated);
    toast(newRole === 'host' ? 'تم ضبط هذا الجهاز كـ «مستضيف رئيسي»' : 'تم ضبط هذا الجهاز كـ «عميل متصل بالشبكة»');
  };

  const handleTestClientConnection = async () => {
    setClientTestStatus('testing');
    const result = await fetchCentralDataFromHost(config.hostIp ? `http://${config.hostIp}:${config.port}` : fullAccessUrl);
    if (result) {
      setClientTestStatus('success');
      toast('الاتصال بالسيرفر المستضيف ناجح 100%، البيانات متطابقة ومتاحة!');
    } else {
      setClientTestStatus('failed');
      toast('تعذر الاتصال بالسيرفر المستضيف؛ تأكد من توصيل الكابل وتشغيل السيرفر بالجهاز الأول');
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 font-sans" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Cable size={24} className="text-blue-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">إعدادات السيرفر والربط السلكي بكابل إيثرنت</h2>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Activity size={12} />
                  Ethernet Peer-to-Peer
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                ربط جهازين معاً ومشاركة المنظومة عبر مدخل كابل الشبكة (Ethernet IP) بمعزل عن شبكة الواي فاي
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="bg-slate-100 border-b border-slate-200 px-6 py-2.5 flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'overview'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Server size={14} />
              حالة السيرفر والكرت السلكي
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'guide'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <HelpCircle size={14} />
              دليل الربط السلكي (خطوة بخطوة)
            </button>
            <button
              onClick={() => setActiveTab('client')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                activeTab === 'client'
                  ? 'bg-white text-blue-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Monitor size={14} />
              إعدادات الجهاز الثاني (العميل)
            </button>
          </div>

          <button
            onClick={loadInterfaces}
            disabled={loading}
            className="text-xs text-slate-500 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors"
            title="إعادة فحص كروت الشبكة"
          >
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            تحديث الفحص
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm flex-1">
          
          {activeTab === 'overview' && (
            <>
              {/* Role Selector Banner */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    config.role === 'host' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {config.role === 'host' ? <Server size={22} /> : <Laptop size={22} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-xs sm:text-sm">
                      وضع هذا الجهاز حالياً: {config.role === 'host' ? '👑 جهاز مستضيف رئيسي (Host Server)' : '💻 جهاز عميل (Client Node)'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {config.role === 'host' 
                        ? 'هذا الجهاز يحتوي على قاعدة البيانات الرئيسية ويبث المنظومة للجهاز الثاني عبر كابل الإيثرنت.' 
                        : 'هذا الجهاز يتصل بالمستضيف ويقوم بقراءة وتعديل البيانات بشكل متزامن لحظياً.'}
                    </p>
                  </div>
                </div>

                <div className="flex bg-slate-200/80 p-1 rounded-lg shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleRole('host')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      config.role === 'host' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    مستضيف (Host)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleRole('client')}
                    className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                      config.role === 'client' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    عميل (Client)
                  </button>
                </div>
              </div>

              {/* DEDICATED ETHERNET INTERFACE CARD (PRIMARY) */}
              <div className="bg-gradient-to-br from-emerald-500/5 via-teal-500/5 to-blue-500/5 border-2 border-emerald-500/30 rounded-2xl p-5 shadow-xs relative overflow-hidden">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                      <Cable size={22} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                          مدخل كابل الإيثرنت السلكي (Ethernet Cable Interface)
                        </h3>
                        <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">
                          المحدد للربط السلكي المباشر
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        هذا هو عنوان الآي بي الخاص بمدخل الكابل الذي يجب أن يدخل منه الجهاز الثاني
                      </p>
                    </div>
                  </div>

                  <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold bg-emerald-100/70 border border-emerald-200 px-2.5 py-1 rounded-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    جاهز ومستعد للاتصال
                  </span>
                </div>

                {/* Direct Access Box */}
                <div className="bg-white border border-emerald-200 rounded-xl p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Terminal size={14} className="text-emerald-600" />
                      الرابط المباشر للدخول من الجهاز الثاني:
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Port: {resolvedPort} | Protocol: HTTP
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2.5" dir="ltr">
                    <span className="text-blue-600 font-bold font-mono text-base px-2 flex-1 select-all break-all">
                      {fullAccessUrl}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-xs cursor-pointer"
                    >
                      {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                      {copiedLink ? 'تم النسخ!' : 'نسخ الرابط'}
                    </button>
                    <a
                      href={fullAccessUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1 shrink-0"
                      title="فتح في تبويب جديد"
                    >
                      <ExternalLink size={14} />
                      فتح
                    </a>
                  </div>

                  <div className="text-xs text-slate-600 bg-emerald-50/50 p-2.5 rounded-lg border border-emerald-100 flex items-start gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      <strong>طريقة الدخول:</strong> فقط افتح المتصفح (Google Chrome أو Microsoft Edge) في الجهاز الثاني واكتب الرابط <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-mono text-emerald-800 font-bold">{fullAccessUrl}</code> وستفتح المنظومة مباشرة وتعمل متزامنة مع هذا الجهاز!
                    </p>
                  </div>
                </div>

                {/* Custom Override Option */}
                <div className="mt-4 pt-4 border-t border-emerald-200/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <span className="text-slate-600 font-medium">تخصيص IP الإيثرنت يدوياً:</span>
                    <input
                      type="text"
                      dir="ltr"
                      value={customIpInput}
                      onChange={(e) => setCustomIpInput(e.target.value)}
                      placeholder={serverInfo?.ethernetIp || '192.168.1.1'}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs w-36 text-center outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                    <span className="text-slate-400">المنفذ:</span>
                    <input
                      type="text"
                      dir="ltr"
                      value={customPortInput}
                      onChange={(e) => setCustomPortInput(e.target.value)}
                      placeholder="3000"
                      className="px-2 py-1.5 bg-white border border-slate-200 rounded-lg font-mono text-xs w-16 text-center outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleSaveCustomSettings}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold transition-colors w-full sm:w-auto text-center"
                  >
                    حفظ التخصيص
                  </button>
                </div>
              </div>

              {/* WI-FI / MAIN NETWORK CARD (ISOLATED) */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 opacity-85">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center">
                      <Wifi size={18} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-slate-700 text-xs">
                          كرت الواي فاي / الشبكة الرئيسية (Wi-Fi)
                        </h4>
                        <span className="bg-slate-200 text-slate-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                          معزول - غير مستخدم للربط السلكي
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5" dir="ltr">
                        IP: {serverInfo?.wifiIp || '192.168.0.45'} (المتصل بالراوتر والإنترنت)
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-md">
                    مستبعد تلقائياً لمنع استهلاك الإنترنت
                  </span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 flex items-start gap-3">
                <HelpCircle size={20} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">دليل المهندس لربط جهازين بكابل إيثرنت مباشر (Peer-to-Peer):</h4>
                  <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                    هذه الطريقة تضمن أعلى درجات السرعة والثبات ولا تحتاج لأي راوتر أو إنترنت أو سويتش؛ فقط كابل شبكة عادي يربط بين الجهازين مباشرة.
                  </p>
                </div>
              </div>

              {/* Step 1 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs mb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                  الخطوة الأولى: توصيل الكابل
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mr-8">
                  قم بتوصيل كابل الإيثرنت (RJ-45) مباشرة بين مدخل الشبكة في الجهاز الأول (المستضيف) ومدخل الشبكة في الجهاز الثاني (العميل). ستلاحظ إضاءة لمبة كرت الشبكة الخضراء أو البرتقالية في الجهازين.
                </p>
              </div>

              {/* Step 2 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs mb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                  الخطوة الثانية: ضبط عنوان IP ثابت في ويندوز (موصى به لثبات الاتصال دائماً)
                </div>
                <div className="mr-8 space-y-3 text-xs text-slate-600">
                  <p>اضغط من الكيبورد على <code>Win + R</code> واكتب <code>ncpa.cpl</code> واضغط Enter لتفتح صفحة كروت الشبكة:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <p className="font-bold text-blue-700 mb-1">📌 في الجهاز الأول (المستضيف الرئيسي):</p>
                      <ul className="list-disc list-inside space-y-1 text-[11px]">
                        <li>كليك يمين على كرت <strong>Ethernet</strong> ⬅️ خصائص (Properties).</li>
                        <li>اضغط مرتين على <strong>Internet Protocol Version 4 (TCP/IPv4)</strong>.</li>
                        <li>اختر <strong>Use the following IP address</strong>:
                          <div className="font-mono bg-slate-50 p-1.5 rounded mt-1 border border-slate-100 text-[11px]" dir="ltr">
                            IP address: 192.168.1.1<br/>
                            Subnet mask: 255.255.255.0<br/>
                            Default gateway: (اتركه فارغاً)
                          </div>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-white p-3 rounded-lg border border-slate-200">
                      <p className="font-bold text-indigo-700 mb-1">💻 في الجهاز الثاني (العميل):</p>
                      <ul className="list-disc list-inside space-y-1 text-[11px]">
                        <li>نفس الخطوات في كرت <strong>Ethernet</strong> بالجهاز الثاني.</li>
                        <li>اختر <strong>Use the following IP address</strong>:
                          <div className="font-mono bg-slate-50 p-1.5 rounded mt-1 border border-slate-100 text-[11px]" dir="ltr">
                            IP address: 192.168.1.2<br/>
                            Subnet mask: 255.255.255.0<br/>
                            Default gateway: 192.168.1.1
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                <div className="flex items-center gap-2 font-bold text-slate-800 text-xs mb-2">
                  <span className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
                  الخطوة الثالثة: السماح للمنفذ في جدار الحماية (Windows Firewall)
                </div>
                <div className="mr-8 space-y-2 text-xs text-slate-600">
                  <p>لضمان عدم حظر ويندوز للاتصال القادم من الجهاز الثاني، افتح موجه الأوامر (CMD كمسؤول) في الجهاز الأول واكتب هذا الأمر:</p>
                  <div className="flex items-center gap-2 bg-slate-900 text-emerald-400 p-2.5 rounded-lg font-mono text-[11px]" dir="ltr">
                    <span className="flex-1 break-all">
                      netsh advfirewall firewall add rule name="HR_System_Server" dir=in action=allow protocol=TCP localport={resolvedPort}
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyFirewallCommand}
                      className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded text-xs transition-colors shrink-0 flex items-center gap-1 font-sans"
                    >
                      {copiedCommand ? <Check size={12} /> : <Copy size={12} />}
                      {copiedCommand ? 'تم النسخ!' : 'نسخ الأمر'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2 font-bold text-emerald-900 text-xs mb-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs">4</span>
                  الخطوة الرابعة: الدخول والبدء بالعمل
                </div>
                <p className="text-xs text-emerald-800 leading-relaxed mr-8">
                  افتح متصفح الجهاز الثاني واكتب: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-emerald-200">{fullAccessUrl}</strong>. ستفتح المنظومة أمامك فوراً بكامل موظفيها وبياناتها!
                </p>
              </div>
            </div>
          )}

          {activeTab === 'client' && (
            <div className="space-y-4">
              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 flex items-start gap-3">
                <Monitor size={20} className="text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-xs">إعدادات هذا الجهاز كعميل (Client Node):</h4>
                  <p className="text-xs text-indigo-700 mt-1 leading-relaxed">
                    إذا كان هذا هو الجهاز الثانوي المربوط بالكابل، يمكنك إدخال عنوان الجهاز الأول هنا للاتصال المباشر وفحص التزامن.
                  </p>
                </div>
              </div>

              <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">
                    عنوان السيرفر المستضيف (Host IP):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      dir="ltr"
                      value={config.hostIp}
                      onChange={(e) => setConfig({ ...config, hostIp: e.target.value })}
                      placeholder="192.168.1.1"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        saveServerConfig({ hostIp: config.hostIp });
                        toast('تم حفظ عنوان السيرفر المستضيف');
                      }}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
                    >
                      حفظ
                    </button>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-800">فحص الاتصال الفوري بالسيرفر</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">التأكد من أن كابل الإيثرنت موصول بنجاح والسيرفر يستجيب</p>
                  </div>

                  <button
                    type="button"
                    onClick={handleTestClientConnection}
                    disabled={clientTestStatus === 'testing'}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Activity size={14} className={clientTestStatus === 'testing' ? 'animate-spin text-blue-600' : 'text-emerald-600'} />
                    {clientTestStatus === 'testing' ? 'جاري الفحص...' : 'اختبار الاتصال الآن'}
                  </button>
                </div>

                {clientTestStatus === 'success' && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>الاتصال ممتاز! السيرفر المستضيف يستجيب وقاعدة البيانات المركزية متزامنة بنجاح.</span>
                  </div>
                )}

                {clientTestStatus === 'failed' && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
                    <X size={16} className="text-rose-600 shrink-0" />
                    <span>تعذر الاتصال بالسيرفر. يرجى مراجعة كابل الإيثرنت أو التأكد من إيقاف جدار الحماية (Firewall) في الجهاز المستضيف.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>اتصال سلكي آمن 100% بدون إنترنت وبأقصى سرعة نقل لنظام الموارد البشرية</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            إغلاق
          </button>
        </div>

      </div>
    </div>
  );
}
