import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

export default function LanguageSelector() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="language-selector">
      <Globe size={18} />
      <select 
        value={language} 
        onChange={(e) => setLanguage(e.target.value as 'en' | 'zh-TW')}
        className="language-select"
        aria-label={t('language.select')}
      >
        <option value="en">{t('language.english')}</option>
        <option value="zh-TW">{t('language.traditionalChinese')}</option>
      </select>
    </div>
  );
}
