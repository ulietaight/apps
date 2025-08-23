import { useEffect, useState } from 'react';

interface MatchSummary {
  id: string;
  champion: string;
  kills: number;
  deaths: number;
  assists: number;
  win: boolean;
  gameDuration: number;
  gameMode: string;
  gameStart: number;
}

const CDN_VERSION = '14.14.1';

function App() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setIsOnline(data.status === 'ok');
        } catch {
          setIsOnline(false);
        }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusText = () => {
    if (isOnline === null) return 'Проверка...';
    return isOnline ? 'Backend Online' : 'Backend Offline';
  };

  const statusColor =
    isOnline === null ? 'bg-gray-400' : isOnline ? 'bg-green-500' : 'bg-red-500';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMatches([]);
    try {
      const res = await fetch(
        `/api/riot/matches/${encodeURIComponent(gameName)}/${encodeURIComponent(
          tagLine,
        )}`,
      );
      if (!res.ok) throw new Error('failed');
      const data: MatchSummary[] = await res.json();
      setMatches(data);
      } catch {
        setError('Не удалось загрузить матчи');
      }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-4 h-4 rounded-full ${statusColor} animate-pulse`}
          title={getStatusText()}
        ></div>
        <span className="text-sm text-gray-700">{getStatusText()}</span>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          placeholder="Game Name"
          className="border p-1"
        />
        <input
          value={tagLine}
          onChange={(e) => setTagLine(e.target.value)}
          placeholder="Tag Line"
          className="border p-1"
        />
        <button type="submit" className="bg-blue-500 text-white px-2">
          Войти
        </button>
      </form>

      {error && <div className="text-red-500">{error}</div>}

      <ul className="space-y-2">
        {matches.map((m) => (
          <li
            key={m.id}
            className={`flex items-center gap-3 p-2 border rounded ${
              m.win ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/${CDN_VERSION}/img/champion/${m.champion}.png`}
              alt={m.champion}
              className="w-12 h-12"
            />
            <div className="flex flex-col">
              <span className="font-semibold">
                {m.champion} - {m.win ? 'Win' : 'Loss'}
              </span>
              <span className="text-sm">
                {m.kills}/{m.deaths}/{m.assists}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default App;
