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

  const [history, setHistory] = useState(() => {
    const data = localStorage.getItem("history");
    return data ? JSON.parse(data) : [];
  });

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  useEffect(() => {
    const timer = setTimeout(() => {
  setPageLoading(false);
}, 1800);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "history",
      JSON.stringify(history)
    );
  }, [history]);

  const chatBaru = () => {
  if (messages.length > 0) {
    const chat = {
      id: Date.now(),
      title:
        messages.find((m) => m.role === "user")?.content ||
        "Percakapan Baru",
      messages,
    };

    setHistory((prev) => [chat, ...prev]);
  }

  setMessages([]);
};

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

const res = await axios.post("/chat", {
  message: text,
  user_id: Number(user.id),
  chat_id: currentChatId
    ? Number(currentChatId)
    : null,
});      


    } catch (err) {
      console.error(err);

      let errorMessage = "Server tidak dapat dihubungi.";

      if (err.response) {
        errorMessage = `Error ${err.response.status}`;
      } else if (err.request) {
        errorMessage = "Backend belum berjalan.";
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

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div
      style={{
        background: "#081420",
        minHeight: "100vh",
        color: "#fff",
        display: "flex",
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
        }}
      >
        <Container
          fluid
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            padding: "18px",
            maxWidth: "980px",
          }}
        >
          <Header />

          <Row
            style={{
              flex: 1,
              marginTop: "10px",
            }}
          >
            <Col
              xs={12}
              style={{
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  paddingBottom: "140px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
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

        <div
          style={{
            position: "sticky",
            bottom: 0,
            background: "#081420",
            padding: "12px 18px 20px",
            borderTop: "1px solid rgba(255,255,255,.05)",
          }}
        >
          <ChatInput
            message={message}
            setMessage={setMessage}
            kirimPesan={kirimPesan}
            loading={loading}
          />
        </div>
      </div>
    </div>
  );
}

export default Home;
