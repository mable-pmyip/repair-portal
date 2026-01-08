import { Link } from 'react-router-dom';

interface ActionCard {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: 'blue' | 'green' | 'purple' | 'pink';
}

interface HomePageLayoutProps {
  badge: string;
  title: string;
  subtitle: string;
  cards: ActionCard[];
}

export default function HomePageLayout({ badge, title, subtitle, cards }: HomePageLayoutProps) {
  return (
    <div className="home-page-layout">
      <div className="home-page-content">
        <div className="welcome-section">
          <div className="welcome-badge">{badge}</div>
          <h1 className="welcome-title">{title}</h1>
          <p className="welcome-subtitle">{subtitle}</p>
        </div>

        <div className="home-quick-actions">
          {cards.map((card, index) => (
            <Link 
              key={index} 
              to={card.to} 
              className={`home-action-card ${card.color}-card`}
            >
              <div className="action-card-header">
                <div className={`action-icon ${card.color}-icon`}>
                  {card.icon}
                </div>
              </div>
              <div className="action-card-content">
                <h2>{card.title}</h2>
                <p>{card.description}</p>
                <div className="action-card-arrow">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
