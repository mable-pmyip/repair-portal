import { useLanguage } from '../../contexts/LanguageContext';
import HomePageLayout from '../../components/HomePageLayout';

export default function UserHomePage() {
  const { t } = useLanguage();

  const cards = [
    {
      to: '/user/submit',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="18" x2="12" y2="12"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      ),
      title: t('app.submitRequest'),
      description: t('userHome.submitDescription'),
      color: 'purple' as const,
    },
    {
      to: '/user/my-requests',
      icon: (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      ),
      title: t('app.myRequests'),
      description: t('userHome.myRequestsDescription'),
      color: 'pink' as const,
    },
  ];

  return (
    <HomePageLayout
      badge="USER PORTAL"
      title={t('userHome.title')}
      subtitle={t('userHome.subtitle')}
      cards={cards}
    />
  );
}
