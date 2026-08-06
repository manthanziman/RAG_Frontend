import { Paperclip, SendHorizonal, X } from 'lucide-react'

function formatFileSize(bytes) {
  if (!bytes) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / (1024 ** exponent)
  return `${value.toFixed(exponent === 0 ? 0 : 1)} ${units[exponent]}`
}

function MessageInput({ value, attachedFiles, onChange, onSend, onFileAttach, onRemoveAttachment, disabled }) {
  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || [])
    if (!selectedFiles.length) {
      return
    }

    onFileAttach(selectedFiles)
    event.target.value = ''
  }

  return (
    <div className="message-input-bar">
      <div className="message-input-shell">
        {attachedFiles.length > 0 && (
          <div className="attachment-preview">
            {attachedFiles.map((file, index) => (
              <div className="attachment-chip" key={`${file.name}-${index}`}>
                <div className="attachment-meta">
                  <span className="attachment-name">{file.name}</span>
                  <span className="attachment-size">{formatFileSize(file.size)}</span>
                </div>
                <button
                  type="button"
                  className="attachment-remove"
                  onClick={() => onRemoveAttachment(index)}
                  aria-label={`Remove ${file.name}`}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="message-input-row">
          <label className="file-button" aria-label="Attach document">
            <Paperclip />
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              aria-label="Attach document"
              accept="application/pdf"
              disabled={disabled}
            />
          </label>

          <textarea
            className="message-textarea"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()
                onSend()
              }
            }}
            placeholder="Send a message..."
            rows={2}
            disabled={disabled}
          />

          <button
            className="button button-send"
            type="button"
            onClick={onSend}
            disabled={disabled || (value.trim().length === 0 && attachedFiles.length === 0)}
          >
            <SendHorizonal />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessageInput
