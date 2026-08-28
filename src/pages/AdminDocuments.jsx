import { useState, useEffect } from 'react';
import { apiFetch } from '../api';
import { FileUp, Trash2, Edit2, Check, X } from 'lucide-react';

export default function AdminDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [uploading, setUploading] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDescription, setUploadDescription] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
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
    event.preventDefault();
    if (!uploadFile) return setError('Please choose a PDF file.');

    if (uploadFile.type !== 'application/pdf') {
      return setError('Only PDF files are supported.');
    }

    setUploading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', uploadFile);
    formData.append('description', uploadDescription.trim());

    try {
      await apiFetch('/documents/chunk', {
        method: 'POST',
        body: formData,
      });

      await fetchDocuments();
      setShowUploadForm(false);
      setUploadFile(null);
      setUploadDescription('');
    } catch (err) {
      setError(err.message || 'Failed to upload document');
    } finally {
      setUploading(false);
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
    setEditDescription(doc.description || '');
    setEditFile(null);
  };

  const saveEdit = async (id) => {
    try {
      if (editFile) {
        const formData = new FormData();
        formData.append('file', editFile);
        if (editName) formData.append('name', editName);
        formData.append('description', editDescription);

        await apiFetch(`/documents/${id}`, {
          method: 'PUT',
          body: formData,
        });
      } else {
        await apiFetch(`/documents/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: editName, description: editDescription }),
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
        <button className="button button-primary" onClick={() => setShowUploadForm(true)} disabled={uploading}>
          <FileUp size={16} />
          {uploading ? 'Uploading...' : 'Upload PDF'}
        </button>
      </div>

      {showUploadForm && (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => !uploading && setShowUploadForm(false)}>
          <form className="modal" onSubmit={handleUpload} onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload document</h2>
              <button type="button" className="icon-button" onClick={() => setShowUploadForm(false)} disabled={uploading} title="Close">
                <X size={18} />
              </button>
            </div>
            <div className="form-group">
              <label htmlFor="upload-file">PDF file</label>
              <input id="upload-file" type="file" accept="application/pdf" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} disabled={uploading} required />
            </div>
            <div className="form-group">
              <label htmlFor="upload-description">Description</label>
              <textarea id="upload-description" value={uploadDescription} onChange={(event) => setUploadDescription(event.target.value)} placeholder="What is this document about?" rows="4" disabled={uploading} />
            </div>
            <div className="modal-actions">
              <button type="button" className="button" onClick={() => setShowUploadForm(false)} disabled={uploading}>Cancel</button>
              <button type="submit" className="button button-primary" disabled={uploading || !uploadFile}>
                <FileUp size={16} />
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </form>
        </div>
      )}

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
                <th>Description</th>
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
                        <input
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          placeholder="Description"
                          style={{ flex: 1 }}
                        />
                        <label className="icon-button">
                          <FileUp size={16} />
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(event) => setEditFile(event.target.files?.[0] || null)}
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
                  <td>
                    {doc.description ? (
                      <span className="description-preview" title={doc.description}>
                        {doc.description}
                      </span>
                    ) : (
                      <span className="text-muted">No description</span>
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
