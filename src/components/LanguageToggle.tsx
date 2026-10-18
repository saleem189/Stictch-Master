import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export default function LanguageToggle() {
  const { i18n, t } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ur' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      type="button"
      onClick={toggleLanguage}
      aria-label={i18n.language === 'en' ? t('Switch to Urdu') : t('Switch to English')}
      className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all hover:border-atelier-brass active:scale-95 group focus-visible:outline focus-visible:outline-2 focus-visible:outline-atelier-brass"
      title={i18n.language === 'en' ? t('Switch to Urdu') : t('Switch to English')}
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
