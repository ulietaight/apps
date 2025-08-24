import { useState } from 'react';
import BackendStatus from './components/BackendStatus';

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
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [matches, setMatches] = useState<MatchSummary[]>([]);
  const [error, setError] = useState('');

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
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      <BackendStatus />
      <h1 className="text-2xl font-bold mb-4">Match History</h1>
      <form onSubmit={handleSubmit} className="flex gap-2 mb-6">
        <input
          value={gameName}
          onChange={(e) => setGameName(e.target.value)}
          placeholder="Game Name"
          className="border p-1 rounded"
        />
        <input
          value={tagLine}
          onChange={(e) => setTagLine(e.target.value)}
          placeholder="Tag Line"
          className="border p-1 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white px-3 rounded">
          Войти
        </button>
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      <ul className="space-y-2 w-full max-w-md">
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
