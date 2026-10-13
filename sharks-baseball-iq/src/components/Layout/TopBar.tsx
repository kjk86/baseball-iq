import logo from '../../assets/pv-logo.png?inline';
import { go } from '../../router';

interface Props {
  back?: string;
  title?: string;
}

export function TopBar({ back, title }: Props) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        {back !== undefined ? (
          <button className="icon-btn" onClick={() => go(back)} aria-label="Back">
            ‹
          </button>
        ) : null}
        <button className="brand" onClick={() => go('/')}>
          <img src={logo} alt="" className="brand-logo" />
          <span className="brand-team">SHARKS</span>
          <span className="brand-iq">Baseball IQ</span>
        </button>
      </div>
      {title && <div className="topbar-title">{title}</div>}
      <button className="icon-btn gear" onClick={() => go('/coach')} aria-label="Coach mode">
        ⚙
      </button>
    </header>
  );
}

export function Situation({ lines }: { lines: [string, string] }) {
  return (
    <div className="situation">
      <div className="situation-1">{lines[0]}</div>
      <div className="situation-2">{lines[1]}</div>
    </div>
  );
}
