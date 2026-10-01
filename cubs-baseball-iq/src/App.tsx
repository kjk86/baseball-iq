import { Coach } from './pages/Coach';
import { Team } from './pages/Team';
import { Home } from './pages/Home';
import { Lesson } from './pages/Lesson';
import { Play } from './pages/Play';
import { Plays } from './pages/Plays';
import { Practice } from './pages/Practice';
import { useRoute } from './router';
import { AppProvider } from './state/AppContext';

function Routes() {
  const r = useRoute();
  switch (r.name) {
    case 'lesson':
      return <Lesson key={r.id} id={r.id} />;
    case 'play':
      return <Play key={r.id} id={r.id} />;
    case 'plays':
      return <Plays />;
    case 'practice':
      return <Practice key="practice" />;
    case 'pitch':
      return <Practice key="pitch" mode="pitch" />;
    case 'coach':
      return <Coach />;
    case 'team':
      return <Team />;
    default:
      return <Home />;
  }
}

export default function App() {
  return (
    <AppProvider>
      <Routes />
    </AppProvider>
  );
}
