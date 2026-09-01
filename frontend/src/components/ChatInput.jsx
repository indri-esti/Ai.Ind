import { Form, Button } from "react-bootstrap";
import { FaPaperPlane } from "react-icons/fa";
import { FiPlus } from "react-icons/fi";

function ChatInput({
  message,
  setMessage,
  kirimPesan,
  loading,
  fileInputRef,
  pilihGambar,
  imagePreview,
}) {
  const handleKirim = () => {
    if (loading) return;

    if (!message.trim() && !imagePreview) {
      return;
    }

    kirimPesan();
  };

  const handlePlusClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (loading) return;

    if (fileInputRef?.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="chat-input-root">
      <Form
        onSubmit={(e) => {
          e.preventDefault();
          handleKirim();
        }}
      >
        <div className="chat-input-row">

          {/* ==================================================
              TOMBOL PLUS / UPLOAD
          ================================================== */}

          <div className="home-plus-wrapper">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={pilihGambar}
              disabled={loading}
              className="home-plus-file"
              tabIndex="-1"
              aria-hidden="true"
            />

            <button
              type="button"
              className={`home-plus-button ${
                loading ? "is-disabled" : ""
              }`}
              onClick={handlePlusClick}
              disabled={loading}
              aria-label="Tambah gambar"
              title="Tambah gambar"
            >
              <span className="home-plus-icon">
                <FiPlus
                  size={23}
                  strokeWidth={2.5}
                />
              </span>
            </button>
          </div>

          {/* ==================================================
              CHAT INPUT
          ================================================== */}

          <div className="chat-input-box">

            <Form.Control
              as="textarea"
              rows={1}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
              }}
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !e.shiftKey
                ) {
                  e.preventDefault();

                  if (
                    !loading &&
                    (
                      message.trim() ||
                      imagePreview
                    )
                  ) {
                    handleKirim();
                  }
                }
              }}
              placeholder="Ketik pertanyaan untuk AI.Ind..."
              className="chat-input"
            />

            {/* ==================================================
                SEND
            ================================================== */}

            <Button
              type="submit"
              className="send-btn"
              disabled={
                loading ||
                (
                  !message.trim() &&
                  !imagePreview
                )
              }
            >
              <span className="send-icon">
                <FaPaperPlane
                  size={17}
                />
              </span>
            </Button>

          </div>
        </div>
      </Form>
    </div>
  );
}

export default ChatInput;