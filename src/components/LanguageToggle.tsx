import React from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(newLang);
    // Persist to local storage is handled by i18next-browser-languagedetector automatically
  };

  return (
    <button
      onClick={toggleLanguage}
      className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 rounded-xl hover:border-indigo-200 transition-all active:scale-95 group shadow-sm"
      title={i18n.language === 'en' ? 'Switch to Urdu' : 'Switch to English'}
    >
      <div className="p-1.5 bg-slate-50 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
        <Languages size={14} />
      </div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
        {i18n.language === 'en' ? 'اردو' : 'EN'}
      </span>
    </button>
  );
}
