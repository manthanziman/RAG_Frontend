import { Paperclip, SendHorizonal } from "lucide-react"

function MessageInput({ value, onChange, onSend, onFileAttach, disabled }) {
  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) {
      return
    }
    onFileAttach(file)
    event.target.value = ''
  }

  return (
    <div className="message-input-bar">
      <label className="file-button">
        <Paperclip/>
        <input type="file" onChange={handleFileChange} aria-label="Attach document" accept="application/pdf" />
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

      <button className="button button-send" type="button" onClick={onSend} disabled={disabled || value.trim().length === 0}>
        <SendHorizonal/>
      </button>
    </div>
  )
}

export default MessageInput
