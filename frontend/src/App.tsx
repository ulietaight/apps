import { useEffect, useState } from 'react';

function App() {
  const [isOnline, setIsOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch('/api/health')
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

  const statusColor = isOnline === null ? 'bg-gray-400' : isOnline ? 'bg-green-500' : 'bg-red-500';


  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-4 h-4 rounded-full ${statusColor} animate-pulse`}
        title={getStatusText()}
      ></div>
      <span className="text-sm text-gray-700">{getStatusText()}</span>
    </div>
  )
}

export default App
