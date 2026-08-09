import { Container, Row, Col } from "react-bootstrap";
import { useState, useEffect, useRef } from "react";
import axios from "../api";

import Header from "../components/Header";
import ChatBox from "../components/ChatBox";
import ChatInput from "../components/ChatInput";
import Loading from "../components/Loading";
import Typing from "../components/Typing";
import Sidebar from "../components/Sidebar";

function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [history, setHistory] = useState([]);

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const [currentChatId, setCurrentChatId] =
    useState(null);

  const chatEndRef = useRef(null);

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  // ==================================================
  // AUTO SCROLL
  // ==================================================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ==================================================
  // PAGE LOADING
  // ==================================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  // ==================================================
  // CHAT BARU
  // ==================================================
  const chatBaru = () => {
    if (messages.length > 0) {
      const chat = {
        id: Date.now(),
        title:
          messages.find(
            (m) => m.role === "user"
          )?.content ||
          "Percakapan Baru",
        messages,
      };

      setHistory((prev) => [
        chat,
        ...prev,
      ]);
    }

    setMessages([]);
    setCurrentChatId(null);
  };

  // ==================================================
  // KIRIM PESAN
  // ==================================================
  const kirimPesan = async () => {
    if (!message.trim() || loading) return;

    const text = message;

    setMessage("");

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: text,
      },
    ]);

    setLoading(true);

    try {
      const res = await axios.post(
        "/chat",
        {
          message: text,
          user_id: Number(user.id),
          chat_id: currentChatId
            ? Number(currentChatId)
            : null,
        }
      );

      if (res.data.chat_id) {
        setCurrentChatId(
          res.data.chat_id
        );
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            res.data.reply ||
            "AI tidak memberikan jawaban.",
        },
      ]);
    } catch (err) {
      console.error(err);

      let errorMessage =
        "Server tidak dapat dihubungi.";

      if (err.response) {
        errorMessage = `Error ${err.response.status}`;
      } else if (err.request) {
        errorMessage =
          "Backend belum berjalan.";
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

  // ==================================================
  // LOADING
  // ==================================================
  if (pageLoading) {
    return <Loading />;
  }

  // ==================================================
  // RENDER
  // ==================================================
  return (
    <div
      style={{
        background:
          "radial-gradient(circle at 50% -10%, rgba(0,194,255,.08), transparent 35%), #081420",
        minHeight: "100vh",
        color: "#fff",
        display: "flex",
        overflow: "hidden",
      }}
    >
      <Sidebar
        messages={messages}
        setMessages={setMessages}
        history={history}
        setHistory={setHistory}
        chatBaru={chatBaru}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
          height: "100vh",
          position: "relative",
        }}
      >
        {/* ==========================================
            HEADER
        ========================================== */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
          }}
        >
          <Container
            fluid
            style={{
              maxWidth: "1050px",
              padding:
                "14px 20px 0",
            }}
          >
            <Header />
          </Container>
        </div>

        {/* ==========================================
            CHAT AREA
        ========================================== */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
          }}
        >
          <Container
            fluid
            style={{
              height: "100%",
              maxWidth: "1050px",
              padding:
                "0 20px",
            }}
          >
            <Row
              style={{
                height: "100%",
              }}
            >
              <Col
                xs={12}
                style={{
                  height: "100%",
                  display: "flex",
                  flexDirection:
                    "column",
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    overflowX: "hidden",
                    padding:
                      "10px 4px 155px",
                    display: "flex",
                    flexDirection:
                      "column",
                    gap: "12px",
                    scrollbarWidth:
                      "thin",
                    scrollbarColor:
                      "#1B3445 transparent",
                  }}
                >
                  {/* ==========================================
                      WELCOME SCREEN
                  ========================================== */}
                  {messages.length === 0 &&
                    !loading && (
                      <div
                        style={{
                          flex: 1,
                          minHeight:
                            "calc(100vh - 240px)",
                          display: "flex",
                          alignItems:
                            "center",
                          justifyContent:
                            "center",
                          padding:
                            "30px 10px",
                        }}
                      >
                        <div
                          style={{
                            width: "100%",
                            maxWidth:
                              "650px",
                            textAlign:
                              "center",
                          }}
                        >
                          {/* LOGO */}
                          <div
                            style={{
                              position:
                                "relative",
                              width:
                                "108px",
                              height:
                                "108px",
                              margin:
                                "0 auto 24px",
                            }}
                          >
                            <div
                              style={{
                                position:
                                  "absolute",
                                inset:
                                  "-18px",
                                borderRadius:
                                  "38px",
                                background:
                                  "rgba(0,194,255,.06)",
                                filter:
                                  "blur(18px)",
                              }}
                            />

                            <div
                              style={{
                                position:
                                  "relative",
                                width:
                                  "108px",
                                height:
                                  "108px",
                                borderRadius:
                                  "27px",
                                overflow:
                                  "hidden",
                                border:
                                  "1px solid rgba(24,216,255,.18)",
                                boxShadow:
                                  "0 15px 45px rgba(0,194,255,.15)",
                              }}
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 512 512"
                                width="108"
                                height="108"
                              >
                                <defs>
                                  <linearGradient
                                    id="homeBg"
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#0B1B2B"
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#07111D"
                                    />
                                  </linearGradient>

                                  <linearGradient
                                    id="homeCyan"
                                    x1="0"
                                    y1="0"
                                    x2="1"
                                    y2="1"
                                  >
                                    <stop
                                      offset="0%"
                                      stopColor="#18D8FF"
                                    />
                                    <stop
                                      offset="100%"
                                      stopColor="#008FE8"
                                    />
                                  </linearGradient>

                                  <filter
                                    id="homeGlow"
                                    x="-50%"
                                    y="-50%"
                                    width="200%"
                                    height="200%"
                                  >
                                    <feGaussianBlur
                                      stdDeviation="10"
                                      result="blur"
                                    />

                                    <feMerge>
                                      <feMergeNode in="blur" />
                                      <feMergeNode in="SourceGraphic" />
                                    </feMerge>
                                  </filter>
                                </defs>

                                <rect
                                  width="512"
                                  height="512"
                                  rx="110"
                                  fill="url(#homeBg)"
                                />

                                <circle
                                  cx="256"
                                  cy="256"
                                  r="170"
                                  fill="#00C2FF"
                                  opacity="0.06"
                                />

                                <circle
                                  cx="256"
                                  cy="256"
                                  r="135"
                                  fill="#00C2FF"
                                  opacity="0.04"
                                />

                                <rect
                                  x="244"
                                  y="105"
                                  width="24"
                                  height="42"
                                  rx="12"
                                  fill="url(#homeCyan)"
                                />

                                <circle
                                  cx="256"
                                  cy="98"
                                  r="9"
                                  fill="#18D8FF"
                                  filter="url(#homeGlow)"
                                />

                                <rect
                                  x="137"
                                  y="145"
                                  width="238"
                                  height="190"
                                  rx="58"
                                  fill="url(#homeCyan)"
                                />

                                <rect
                                  x="112"
                                  y="195"
                                  width="25"
                                  height="75"
                                  rx="12"
                                  fill="#11BCEB"
                                />

                                <rect
                                  x="375"
                                  y="195"
                                  width="25"
                                  height="75"
                                  rx="12"
                                  fill="#11BCEB"
                                />

                                <rect
                                  x="153"
                                  y="161"
                                  width="206"
                                  height="158"
                                  rx="45"
                                  fill="#0B1B2B"
                                  opacity="0.18"
                                />

                                <circle
                                  cx="207"
                                  cy="225"
                                  r="18"
                                  fill="#07111D"
                                />

                                <circle
                                  cx="305"
                                  cy="225"
                                  r="18"
                                  fill="#07111D"
                                />

                                <rect
                                  x="207"
                                  y="271"
                                  width="98"
                                  height="13"
                                  rx="6.5"
                                  fill="#07111D"
                                />

                                <circle
                                  cx="256"
                                  cy="205"
                                  r="5"
                                  fill="#FFFFFF"
                                  opacity="0.25"
                                />

                                <path
                                  d="M190 365 C190 345 206 332 226 332 H286 C306 332 322 345 322 365 V382 H190Z"
                                  fill="url(#homeCyan)"
                                  opacity="0.9"
                                />

                                <path
                                  d="M214 355 H298"
                                  stroke="#FFFFFF"
                                  strokeWidth="6"
                                  strokeLinecap="round"
                                  opacity="0.2"
                                />
                              </svg>
                            </div>
                          </div>

                          {/* TITLE */}
                          <h1
                            style={{
                              margin:
                                "0 0 8px",
                              fontSize:
                                "clamp(30px, 6vw, 42px)",
                              fontWeight:
                                "800",
                              letterSpacing:
                                "-1.2px",
                              background:
                                "linear-gradient(90deg,#18D8FF,#00C2FF,#008FE8)",
                              WebkitBackgroundClip:
                                "text",
                              WebkitTextFillColor:
                                "transparent",
                            }}
                          >
                            AI.Ind
                          </h1>

                          <p
                            style={{
                              margin:
                                "0 auto 10px",
                              color:
                                "#E7F3FA",
                              fontSize:
                                "clamp(16px, 3vw, 19px)",
                              fontWeight:
                                "600",
                            }}
                          >
                            Asisten AI Buatan
                            Indonesia 🇮🇩
                          </p>

                          <p
                            style={{
                              maxWidth:
                                "540px",
                              margin:
                                "0 auto",
                              color:
                                "#8A9BB5",
                              fontSize:
                                "14px",
                              lineHeight:
                                "1.7",
                            }}
                          >
                            Teman cerdas untuk
                            belajar, mencari ide,
                            menjawab pertanyaan,
                            dan membantu berbagai
                            aktivitasmu.
                          </p>

                          {/* QUICK SUGGESTIONS */}
                          <div
                            style={{
                              marginTop:
                                "26px",
                              display:
                                "flex",
                              justifyContent:
                                "center",
                              flexWrap:
                                "wrap",
                              gap: "9px",
                            }}
                          >
                            {[
                              "Bantu belajar",
                              "Cari ide",
                              "Jelaskan sesuatu",
                            ].map(
                              (item) => (
                                <button
                                  key={item}
                                  type="button"
                                  onClick={() =>
                                    setMessage(
                                      item
                                    )
                                  }
                                  style={{
                                    padding:
                                      "9px 14px",
                                    borderRadius:
                                      "999px",
                                    border:
                                      "1px solid rgba(0,194,255,.18)",
                                    background:
                                      "rgba(18,43,60,.65)",
                                    color:
                                      "#A9C4D3",
                                    fontSize:
                                      "12px",
                                    cursor:
                                      "pointer",
                                    transition:
                                      ".2s ease",
                                    backdropFilter:
                                      "blur(10px)",
                                  }}
                                >
                                  {item}
                                </button>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                  {/* CHAT */}
                  <ChatBox
                    messages={messages}
                    loading={false}
                    chatEndRef={chatEndRef}
                  />

                  {loading && <Typing />}

                  <div ref={chatEndRef} />
                </div>
              </Col>
            </Row>
          </Container>
        </div>

        {/* ==========================================
            INPUT AREA
        ========================================== */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 20,
            background:
              "linear-gradient(to top, #081420 72%, rgba(8,20,32,.94) 82%, transparent)",
            padding:
              "35px 20px 18px",
          }}
        >
          <div
            style={{
              maxWidth:
                "1050px",
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
                textAlign:
                  "center",
                color:
                  "#536B7D",
                fontSize:
                  "10px",
                marginTop:
                  "7px",
              }}
            >
              AI.Ind dapat membuat
              kesalahan. Periksa kembali
              informasi penting.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;