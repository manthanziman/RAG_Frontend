import { SendHorizonal } from 'lucide-react'

function MessageInput({ value, onChange, onSend, disabled }) {
  return (
    <div className="message-input-bar">
      <div className="message-input-shell">
        <div className="message-input-row">

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
            disabled={disabled || value.trim().length === 0}
          >
            <SendHorizonal />
          </button>
        </div>
      </div>
    </div>
  )
}

export default MessageInput
