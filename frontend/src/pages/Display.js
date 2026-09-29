import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api, { connectSocket } from '../services/api';

export default function Display() {
  const { hospitalId } = useParams();
  const [queues, setQueues] = useState([]);
  const [index, setIndex] = useState(0);
  const [lang, setLang] = useState('en');

  useEffect(() => {
    let timer;
    let socket;
    async function load() {
      try {
        const list = await api.get('/hospitals');
        const id = hospitalId || list.data.items?.[0]?._id;
        if (!id) return;
        const { data } = await api.get(`/queues/display/${id}`);
        setQueues(data.queues || []);
        socket = connectSocket({ hospitalId: id });
        socket.on('queue:update', () => {
          api.get(`/queues/display/${id}`).then((r) => setQueues(r.data.queues || [])).catch(() => {});
        });
        timer = setInterval(() => setIndex((i) => i + 1), 8000);
      } catch (_error) {
        setQueues([]);
      }
    }
    load();
    return () => {
      clearInterval(timer);
      socket?.disconnect();
    };
  }, [hospitalId]);

  const current = queues[index % Math.max(queues.length, 1)];
  const serving = current?.currentToken || '—';
  const next = current?.nextToken || '—';
  const doctor = current?.doctor?.userId?.name || 'Doctor';
  const dept = current?.department?.name || 'OPD';
  const hospital = current?.doctor?.hospitalId?.branding?.displayName
    || current?.doctor?.hospitalId?.name
    || 'CITY CARE HOSPITAL';

  function speak() {
    const text = lang === 'hi'
      ? `अभी टोकन ${serving} कमरा ${current?.roomNumber || ''}`
      : `Now serving token ${serving}. Please proceed to room ${current?.roomNumber || ''}`;
    window.speechSynthesis?.speak(new SpeechSynthesisUtterance(text));
  }

  return (
    <div className="tv-screen">
      <div>
        <div className="muted" style={{ color: '#9db0c9' }}>{hospital}</div>
        <h2 className="mt-3">{doctor}</h2>
        <div>{dept}</div>
        <div className="mt-5" style={{ letterSpacing: 4 }}>NOW SERVING</div>
        <div className="queue-token" style={{ color: '#fff', fontSize: 120 }}>{serving}</div>
        <div className="mt-3">Please proceed to room {current?.roomNumber || '—'}</div>
        <div className="mt-4">NEXT: {next}</div>
        <div className="mt-5 d-flex gap-2 justify-content-center">
          <button className="btn btn-ghost" onClick={() => setLang(lang === 'en' ? 'hi' : 'en')}>{lang === 'en' ? 'हिंदी' : 'English'}</button>
          <button className="btn btn-teal" onClick={speak}>Announce</button>
        </div>
      </div>
    </div>
  );
}
