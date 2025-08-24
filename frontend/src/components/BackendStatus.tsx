import { useEffect, useState } from 'react';

export default function BackendStatus() {
  const [online, setOnline] = useState<boolean | null>(null);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/health');
        const data = await res.json();
        setOnline(data.status === 'ok');
      } catch {
        setOnline(false);
      }
    };

    check();
    const id = setInterval(check, 5000);
    return () => clearInterval(id);
  }, []);

  const color =
    online === null ? 'bg-gray-400' : online ? 'bg-green-500' : 'bg-red-500';

  return (
    <div className="fixed top-4 right-4" title={online ? 'Backend Online' : 'Backend Offline'}>
      <span className={`block w-4 h-4 rounded-full ${color} animate-pulse`}></span>
    </div>
  );
}
