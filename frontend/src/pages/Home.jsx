import { Container, Row, Col } from "react-bootstrap";
import { useState, useEffect, useRef } from "react";
import axios from "../api";

import Header from "../components/Header";
import ChatBox from "../components/ChatBox";
import ChatInput from "../components/ChatInput";
import Loading from "../components/Loading";
import Sidebar from "../components/Sidebar";

function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [history, setHistory] = useState([]);

  const [currentChatId, setCurrentChatId] = useState(null);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const chatEndRef = useRef(null);

  // =========================
  // AMBIL USER
  // =========================
  const getUser = () => {
    try {
      const data = localStorage.getItem("user");

      if (!data) return null;

      return JSON.parse(data);
    } catch (error) {
      console.error("User error:", error);
      return null;
    }
  };

  // =========================
  // AMBIL RIWAYAT DARI DATABASE
  // =========================
  const loadHistory = async () => {
    const user = getUser();

    if (!user?.id) {
      setHistory([]);
      return;
    }

    try {
      const res = await axios.get(
        `/chats?user_id=${user.id}`
      );

      if (Array.isArray(res.data)) {
        setHistory(res.data);
      } else if (Array.isArray(res.data?.chats)) {
        setHistory(res.data.chats);
      } else {
        setHistory([]);
      }
    } catch (error) {
      console.error("History Error:", error);
      setHistory([]);
    }
  };

  // =========================
  // LOAD SAAT HOME DIBUKA
  // =========================
  useEffect(() => {
    const start = async () => {
      await loadHistory();

      const timer = setTimeout(() => {
        setPageLoading(false);
      }, 500);

      return () => clearTimeout(timer);
    };

    start();
  }, []);

  // =========================
  // AUTO SCROLL
  // =========================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, loading]);

  // =========================
  // CHAT BARU
  // =========================
  const chatBaru = () => {
    setMessages([]);
    setMessage("");
    setCurrentChatId(null);
  };

  // =========================
  // BUKA CHAT DARI SIDEBAR
  // =========================
  const bukaChat = async (chat) => {
    if (!chat?.id) return;

    const user = getUser();

    if (!user?.id) return;

    try {
      const res = await axios.get(
        `/chats/${chat.id}?user_id=${user.id}`
      );

      const chatData = res.data?.chat || res.data;

      if (chatData?.messages) {
        setMessages(chatData.messages);
        setCurrentChatId(chatData.id || chat.id);
      } else {
        setMessages([]);
        setCurrentChatId(chat.id);
      }
    } catch (error) {
      console.error("Open Chat Error:", error);

      // Fallback jika messages sudah dikirim dari endpoint history
      if (Array.isArray(chat.messages)) {
        setMessages(chat.messages);
        setCurrentChatId(chat.id);
      }
    }
  };

  // =========================
  // KIRIM PESAN
  // =========================
  const kirimPesan = async () => {
    if (!message.trim() || loading) return;

    const user = getUser();

    if (!user?.id) {
      alert("Silakan login terlebih dahulu.");
      return;
    }

    const text = message.trim();

    setMessage("");

    // Tampilkan pesan user langsung
    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: text,
      },
    ]);

    setLoading(true);

    try {
      const res = await axios.post("/chat", {
        message: text,
        user_id: user.id,
        chat_id: currentChatId,
      });

      const reply =
        res.data?.reply ||
        res.data?.message ||
        "Maaf, AI.Ind tidak memberikan jawaban.";

      const newChatId = res.data?.chat_id;

      // Simpan ID chat yang dibuat backend
      if (newChatId) {
        setCurrentChatId(newChatId);
      }

      // Tampilkan jawaban AI
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
        },
      ]);

      // Refresh daftar chat dari database
      await loadHistory();
    } catch (err) {
      console.error("Chat Error:", err);

      let errorMessage =
        "Maaf, terjadi kesalahan saat menghubungi AI.Ind.";

      if (err.response) {
        errorMessage =
          err.response.data?.error ||
          `Server error (${err.response.status}).`;
      } else if (err.request) {
        errorMessage =
          "Backend tidak memberikan respons. Periksa koneksi internet atau server.";
      } else {
        errorMessage =
          err.message || "Terjadi kesalahan.";
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // PAGE LOADING
  // =========================
  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        height: "100vh",
        background:
          "radial-gradient(circle at top, #10263A 0%, #081420 45%, #050D15 100%)",
        color: "#fff",
        display: "flex",
        overflow: "hidden",
      }}
    >
      {/* SIDEBAR */}
      <Sidebar
        messages={messages}
        setMessages={setMessages}
        history={history}
        setHistory={setHistory}
        chatBaru={chatBaru}
        bukaChat={bukaChat}
        loadHistory={loadHistory}
      />

      {/* MAIN */}
      <main
        style={{
          flex: 1,
          minWidth: 0,
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            flexShrink: 0,
            padding: "14px 18px 8px",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
        >
          <Header />
        </div>

        {/* CHAT AREA */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "8px 16px 150px",
            scrollbarWidth: "thin",
            scrollbarColor: "#23445E transparent",
          }}
        >
          <Container
            fluid
            style={{
              maxWidth: "920px",
              margin: "0 auto",
              padding: 0,
            }}
          >
            <Row>
              <Col xs={12} style={{ padding: 0 }}>

                {/* WELCOME */}
                {messages.length === 0 && !loading && (
                  <div
                    style={{
                      minHeight: "55vh",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      textAlign: "center",
                      padding: "30px 20px",
                    }}
                  >
                    <div
                      style={{
                        width: "76px",
                        height: "76px",
                        borderRadius: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          "linear-gradient(135deg, #00C2FF, #0077FF)",
                        boxShadow:
                          "0 12px 40px rgba(0,194,255,.25)",
                        marginBottom: "20px",
                        fontSize: "34px",
                      }}
                    >
                      🤖
                    </div>

                    <h2
                      style={{
                        fontWeight: 700,
                        marginBottom: "8px",
                        fontSize: "clamp(24px, 5vw, 32px)",
                      }}
                    >
                      Halo 👋
                    </h2>

                    <p
                      style={{
                        color: "#9CB0C0",
                        maxWidth: "520px",
                        margin: 0,
                        lineHeight: 1.6,
                      }}
                    >
                      Saya{" "}
                      <b style={{ color: "#00C2FF" }}>
                        AI.Ind
                      </b>
                      .
                      <br />
                      Tanyakan apa saja dan mari mulai percakapan.
                    </p>
                  </div>
                )}

                {/* MESSAGES */}
                {messages.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "14px",
                    }}
                  >
                    <ChatBox
                      messages={messages}
                      loading={loading}
                      chatEndRef={chatEndRef}
                    />
                  </div>
                )}

                {/* TYPING */}
                {loading && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginTop: "16px",
                      marginBottom: "10px",
                      animation: "fadeIn .25s ease",
                    }}
                  >
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        borderRadius: "13px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background:
                          "linear-gradient(135deg, #123B56, #0D2538)",
                        border:
                          "1px solid rgba(0,194,255,.18)",
                        boxShadow:
                          "0 5px 20px rgba(0,0,0,.18)",
                      }}
                    >
                      <span style={{ fontSize: "17px" }}>
                        ✦
                      </span>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "5px",
                        padding: "11px 15px",
                        borderRadius: "16px",
                        background:
                          "rgba(19,40,63,.85)",
                        border:
                          "1px solid rgba(255,255,255,.06)",
                      }}
                    >
                      <span
                        style={{
                          color: "#8FA7B8",
                          fontSize: "13px",
                          marginRight: "3px",
                        }}
                      >
                        AI.Ind
                      </span>

                      <span className="ai-dot" />
                      <span className="ai-dot delay1" />
                      <span className="ai-dot delay2" />
                    </div>
                  </div>
                )}

                <div ref={chatEndRef} />
              </Col>
            </Row>
          </Container>
        </div>

        {/* INPUT AREA */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            padding:
              "12px max(16px, calc((100vw - 920px) / 2)) 18px",
            background:
              "linear-gradient(to top, #081420 72%, rgba(8,20,32,0))",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              pointerEvents: "auto",
              maxWidth: "920px",
              margin: "0 auto",
            }}
          >
            <ChatInput
              message={message}
              setMessage={setMessage}
              kirimPesan={kirimPesan}
              loading={loading}
            />

            <div
              style={{
                textAlign: "center",
                color: "#607789",
                fontSize: "10px",
                marginTop: "7px",
              }}
            >
              AI.Ind dapat melakukan kesalahan. Periksa kembali informasi penting.
            </div>
          </div>
        </div>
      </main>

      {/* ANIMATION */}
      <style>
        {`
          @keyframes fadeIn {
            from {
              opacity: 0;
              transform: translateY(5px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          @keyframes typingDot {
            0%, 60%, 100% {
              transform: translateY(0);
              opacity: .35;
            }
            30% {
              transform: translateY(-4px);
              opacity: 1;
            }
          }

          .ai-dot {
            width: 5px;
            height: 5px;
            border-radius: 50%;
            background: #00C2FF;
            display: inline-block;
            animation: typingDot 1.2s infinite ease-in-out;
          }

          .ai-dot.delay1 {
            animation-delay: .15s;
          }

          .ai-dot.delay2 {
            animation-delay: .3s;
          }

          @media (max-width: 576px) {
            main {
              width: 100%;
            }
          }

          * {
            box-sizing: border-box;
          }
        `}
      </style>
    </div>
  );
}

export default Home;