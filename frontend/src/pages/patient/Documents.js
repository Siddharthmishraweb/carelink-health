import React, { useEffect, useState } from 'react';
import api from '../../services/api';
import { Card } from '../../components/ui';

export default function PatientDocs() {
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');

  useEffect(() => {
    api.get('/documents').then((r) => setItems(r.data.items || []));
  }, []);

  async function upload(e) {
    e.preventDefault();
    const form = new FormData();
    form.append('file', file);
    form.append('title', title);
    form.append('category', 'report');
    await api.post('/documents', form);
    const { data } = await api.get('/documents');
    setItems(data.items || []);
  }

  return (
    <div className="patient-home">
      <h2>Document vault</h2>
      <Card className="mb-3">
        <form onSubmit={upload}>
          <input className="form-control mb-2" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="form-control mb-2" type="file" onChange={(e) => setFile(e.target.files[0])} />
          <button className="btn btn-navy w-100">Upload securely</button>
        </form>
      </Card>
      {items.map((doc) => (
        <Card key={doc._id} className="mb-2">
          <strong>{doc.title}</strong>
          <div className="muted">{doc.category} • {doc.fileName}</div>
        </Card>
      ))}
    </div>
  );
}
