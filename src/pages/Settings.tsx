import React from 'react';
import { Settings as SettingsIcon, Bell, Shield, Key } from 'lucide-react';

export default function Settings() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <SettingsIcon className="text-blue-600" />
            الإعدادات
          </h2>
          <p className="text-slate-500 mt-1 text-sm">إدارة إعدادات حسابك وتفضيلات النظام</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Bell size={20} className="text-blue-500" />
            تفضيلات الإشعارات
          </h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="font-medium text-slate-800">إشعارات الإجازات</p>
                <p className="text-xs text-slate-500">تلقي تنبيه عند طلب إجازة جديدة</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
            </label>
            <label className="flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 cursor-pointer">
              <div>
                <p className="font-medium text-slate-800">إشعارات الحضور</p>
                <p className="text-xs text-slate-500">تلقي تقرير يومي بحضور وانصراف الموظفين</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
            </label>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Shield size={20} className="text-blue-500" />
            الأمان والخصوصية
          </h3>
          <div className="space-y-4">
            <button className="w-full flex items-center justify-between p-3 border border-slate-100 rounded-lg hover:bg-slate-50 transition-colors text-right">
              <div className="flex items-center gap-3">
                <div className="bg-slate-100 p-2 rounded-lg"><Key size={18} className="text-slate-600" /></div>
                <div>
                  <p className="font-medium text-slate-800">تغيير كلمة المرور</p>
                  <p className="text-xs text-slate-500">تحديث كلمة المرور الخاصة بحسابك</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}