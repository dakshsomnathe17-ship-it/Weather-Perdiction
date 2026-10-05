import { NavLink } from 'react-router-dom';
import {
  CloudSun,
  House,
  CalendarDays,
  ChartNoAxesCombined,
  FlaskConical,
  Settings2,
  ArrowUpRight,
} from 'lucide-react';

const items = [
  { to: '/', label: 'Overview', icon: House },
  { to: '/forecast', label: 'Forecast', icon: CalendarDays },
  { to: '/analytics', label: 'Insights', icon: ChartNoAxesCombined },
  { to: '/ml', label: 'Model lab', icon: FlaskConical },
  { to: '/settings', label: 'Settings', icon: Settings2 },
];

export function Sidebar() {
  return (
    <aside className="app-sidebar">
      <NavLink to="/" className="brand" aria-label="WeatherAI home">
        <span className="brand-mark">
          <CloudSun size={27} />
        </span>
        <span>
          weather<span className="brand-ai">AI</span>
          <small>A clearer view ahead</small>
        </span>
      </NavLink>
      <div className="nav-caption">YOUR WEATHER</div>
      <nav aria-label="Main navigation">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end
            aria-label={label}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        <span className="eyebrow">BUILT ON REAL DATA</span>
        <p>
          Weather around you.
          <br />A world to explore.
        </p>
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Weather by Open-Meteo <ArrowUpRight size={13} />
        </a>
      </div>
    </aside>
  );
}
