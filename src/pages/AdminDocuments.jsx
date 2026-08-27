import { useState, useEffect } from 'react';
import { apiFetch, getAuthToken } from '../api';
import { FileUp, Trash2, Edit2, Check, X } from 'lucide-react';

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editFile, setEditFile] = useState(null);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/documents');
      setDocuments(data.result || []);
    } catch (err) {
      setError(err.message || 'Failed to fetch documents');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      return setError('Only PDF files are supported.');
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = getAuthToken();
      const res = await fetch('http://localhost:4040/api/documents/chunk', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Upload failed');
      }

      await fetchDocuments();
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
      event.target.value = '';
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this document?')) return;

    try {
      await apiFetch(`/documents/${id}`, { method: 'DELETE' });
      setDocuments(documents.filter((doc) => doc._id !== id));
    } catch (err) {
      setError(err.message || 'Failed to delete document');
    }
  };

  const startEdit = (doc) => {
    setEditingId(doc._id);
    setEditName(doc.name);
    setEditFile(null);
  };

  const saveEdit = async (id) => {
    try {
      if (editFile) {
        const formData = new FormData();
        formData.append('file', editFile);
        if (editName) formData.append('name', editName);

        const token = getAuthToken();
        const res = await fetch(`http://localhost:4040/api/documents/${id}`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || 'Reprocess failed');
        }
      } else {
        await apiFetch(`/documents/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: editName }),
        });
      }

      await fetchDocuments();
      setEditingId(null);
      setEditFile(null);
    } catch (err) {
      setError(err.message || 'Failed to update document');
    }
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Knowledge Base</h1>
        <label className="button button-primary">
          <FileUp size={16} />
          {uploading ? 'Uploading...' : 'Upload PDF'}
          <input type="file" accept="application/pdf" onChange={handleUpload} disabled={uploading} hidden />
        </label>
      </div>

      {error && <div className="admin-error">{error}</div>}

      <div className="admin-table-container">
        {loading ? (
          <div className="admin-loading">Loading documents...</div>
        ) : documents.length === 0 ? (
          <div className="admin-empty">No documents found. Upload a PDF to populate the knowledge base.</div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Size</th>
                <th>Date Added</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc._id}>
                  <td>
                    {editingId === doc._id ? (
                      <div className="edit-inline">
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          style={{ flex: 1 }}
                        />
                        <label className="icon-button">
                          <FileUp size={16} />
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={handleUpload}
                            hidden
                          />
                        </label>
                        <button className="icon-button success" onClick={() => saveEdit(doc._id)}><Check size={16} /></button>
                        <button className="icon-button danger" onClick={() => setEditingId(null)}><X size={16} /></button>
                      </div>
                    ) : (
                      doc.name
                    )}
                  </td>
                  <td>{formatSize(doc.size)}</td>
                  <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="actions-cell">
                    <button className="icon-button" onClick={() => startEdit(doc)} title="Edit">
                      <Edit2 size={16} />
                    </button>
                    <button className="icon-button danger" onClick={() => handleDelete(doc._id)} title="Delete">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
