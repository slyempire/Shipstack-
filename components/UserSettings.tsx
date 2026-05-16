
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Sun, 
  Moon, 
  Monitor, 
  Bell, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Globe,
  Check,
  Shield,
  Save,
  Languages
} from 'lucide-react';
import { useAuthStore, useAppStore } from '../store';
import { UserPreferences } from '../types';

export const UserSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const { addNotification } = useAppStore();
  
  const [prefs, setPrefs] = useState<UserPreferences>(() => user?.preferences || {
    theme: 'LIGHT',
    notifications: { email: true, push: true, sms: false },
    language: i18n.language || 'en',
    autoSync: true
  });

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Update global language
      await i18n.changeLanguage(prefs.language);
      
      // Update user in store/API
      updateUser({ preferences: prefs });
      addNotification(t('common.success'), 'success');
    } catch (error) {
      addNotification(t('common.error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleNotification = (type: 'email' | 'push' | 'sms') => {
    const currentNotifs = typeof prefs.notifications === 'object' 
      ? prefs.notifications 
      : { email: true, push: true, sms: false };
      
    setPrefs({
      ...prefs,
      notifications: {
        ...currentNotifs,
        [type]: !currentNotifs[type]
      }
    });
  };

  const themes: { id: UserPreferences['theme']; label: string; icon: any }[] = [
    { id: 'LIGHT', label: t('settings.light'), icon: Sun },
    { id: 'DARK', label: t('settings.dark'), icon: Moon },
    { id: 'system' as any, label: t('settings.system'), icon: Monitor },
  ];

  const languages = [
    { id: 'en', label: 'English' },
    { id: 'sw', label: 'Swahili' },
  ];

  return (
    <div className="space-y-8 bg-white dark:bg-slate-900 p-6 md:p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
        <Shield size={120} className="text-brand" />
      </div>

      <header className="relative z-10">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
          <Shield className="text-brand" size={28} />
          {t('settings.title')}
        </h2>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{t('settings.subtitle')}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
        {/* Theme Selection */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Sun size={18} className="text-brand" />
            <h3 className="text-xs font-black uppercase tracking-widest">{t('settings.theme')}</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => setPrefs({ ...prefs, theme: t.id })}
                className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
                  prefs.theme === t.id 
                    ? 'border-brand bg-brand/5 text-brand shadow-lg' 
                    : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200 dark:hover:border-slate-700'
                }`}
              >
                <t.icon size={24} className="mb-2" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
                {prefs.theme === t.id && <Check size={12} className="mt-1" />}
              </button>
            ))}
          </div>
        </section>

        {/* Language Selection */}
        <section className="space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Languages size={18} className="text-brand" />
            <h3 className="text-xs font-black uppercase tracking-widest">{t('settings.language')}</h3>
          </div>
          <div className="relative">
            <select
              value={prefs.language}
              onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
              className="w-full h-12 px-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-900 dark:text-white appearance-none cursor-pointer focus:border-brand focus:outline-none transition-all"
            >
              {languages.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.label}
                </option>
              ))}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
              <Globe size={16} />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-2 text-slate-900 dark:text-white">
            <Bell size={18} className="text-brand" />
            <h3 className="text-xs font-black uppercase tracking-widest">{t('settings.notifications')}</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { id: 'email', label: t('notifications.email'), icon: Mail, desc: t('notifications.email_desc') },
              { id: 'push', label: t('notifications.push'), icon: Smartphone, desc: t('notifications.push_desc') },
              { id: 'sms', label: t('notifications.sms'), icon: MessageSquare, desc: t('notifications.sms_desc') },
            ].map((n) => {
              const currentNotifs = typeof prefs.notifications === 'object' 
                ? prefs.notifications 
                : { email: true, push: true, sms: false };
              const isActive = (currentNotifs as any)[n.id];
              
              return (
                <button
                  key={n.id}
                  onClick={() => toggleNotification(n.id as any)}
                  className={`flex items-start gap-4 p-5 rounded-[1.5rem] border-2 transition-all text-left ${
                    isActive
                      ? 'border-brand/20 bg-brand/5 text-brand'
                      : 'border-slate-50 dark:border-slate-800 text-slate-400'
                  }`}
                >
                  <div className={`p-3 rounded-xl ${isActive ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                    <n.icon size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-tight">{n.label}</h4>
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-0.5">{n.desc}</p>
                    <div className={`mt-3 h-5 w-10 rounded-full relative transition-all ${isActive ? 'bg-brand' : 'bg-slate-200 dark:bg-slate-700'}`}>
                      <div className={`absolute top-0.5 h-4 w-4 bg-white rounded-full transition-all ${isActive ? 'right-0.5' : 'left-0.5'}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <footer className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={isSaving}
          className={`px-10 py-4 bg-brand text-white rounded-xl text-[11px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center gap-3 disabled:opacity-50 transition-all`}
        >
          {isSaving ? (
            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Save size={18} />
          )}
          {t('settings.apply')}
        </motion.button>
      </footer>
    </div>
  );
};
