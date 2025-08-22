import { useEffect, useState } from 'react';

function App() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);
  const [gameName, setGameName] = useState('');
  const [tagLine, setTagLine] = useState('');
  const [matches, setMatches] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health');
        const data = await response.json();
        setIsOnline(data.status === 'ok');
      } catch (error) {
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
      const data = await res.json();
      setMatches(data);
    } catch (err) {
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

      <ul className="list-disc pl-5">
        {matches.map((m) => (
          <li key={m?.metadata?.matchId}>{m?.metadata?.matchId}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
