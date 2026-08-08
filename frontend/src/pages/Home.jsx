import { useEffect, useRef, useState } from "react";
import axios from "../api";

import Header from "../components/Header";
import ChatBox from "../components/ChatBox";
import ChatInput from "../components/ChatInput";
import Loading from "../components/Loading";
import Sidebar from "../components/Sidebar";
import Welcome from "../components/Welcome";

function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [history, setHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const chatEndRef = useRef(null);

  const getUser = () => {
    try {
      const data = localStorage.getItem("user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  const loadHistory = async () => {
    const user = getUser();

    if (!user?.id) {
      setHistory([]);
      return;
    }

    try {
      const res = await axios.get(
        `/chats?user_id=${encodeURIComponent(user.id)}`
      );

      setHistory(
        Array.isArray(res.data)
          ? res.data
          : res.data?.chats || []
      );
    } catch (error) {
      console.error("History Error:", error);
      setHistory([]);
    }
  };

  useEffect(() => {
    const start = async () => {
      await loadHistory();
      setPageLoading(false);
    };

    start();
  }, []);

  useEffect(() => {
    const handleUserChange = () => {
      const user = getUser();

      setMessages([]);
      setMessage("");
      setCurrentChatId(null);

      if (user?.id) {
        loadHistory();
      } else {
        setHistory([]);
      }
    };

    window.addEventListener(
      "aiind-user-change",
      handleUserChange
    );

    return () =>
      window.removeEventListener(
        "aiind-user-change",
        handleUserChange
      );
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  const chatBaru = () => {
    setMessages([]);
    setMessage("");
    setCurrentChatId(null);
  };

  const bukaChat = async (chat) => {
    const user = getUser();

    if (!chat?.id || !user?.id) return;

    try {
      const res = await axios.get(
        `/chats/${chat.id}?user_id=${encodeURIComponent(
          user.id
        )}`
      );

      const data = res.data?.chat || res.data;

      setMessages(data?.messages || []);
      setCurrentChatId(data?.id || chat.id);
    } catch (error) {
      console.error("Open Chat Error:", error);

      setMessages(chat.messages || []);
      setCurrentChatId(chat.id);
    }
  };

  const kirimPesan = async () => {
    if (!message.trim() || loading) return;

    const user = getUser();

    if (!user?.id) {
      alert("Silakan login terlebih dahulu.");
      return;
    }

    const text = message.trim();

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
        user_id: user.id,
        chat_id: currentChatId,
      });

      const reply =
        res.data?.reply ||
        res.data?.message ||
        "Maaf, AI.Ind tidak memberikan jawaban.";

      if (res.data?.chat_id) {
        setCurrentChatId(res.data.chat_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: reply,
        },
      ]);

      await loadHistory();
    } catch (error) {
      console.error("Chat Error:", error);

      const errorMessage =
        error.response?.data?.error ||
        error.response
          ? `Server error (${error.response.status}).`
          : error.request
          ? "Backend tidak memberikan respons."
          : error.message || "Terjadi kesalahan.";

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
    <div className="aiind-app">
      <Sidebar
        messages={messages}
        setMessages={setMessages}
        history={history}
        setHistory={setHistory}
        chatBaru={chatBaru}
        bukaChat={bukaChat}
        loadHistory={loadHistory}
      />

      <main className="aiind-main">
        <header className="aiind-header">
          <Header />
        </header>

        <section className="aiind-chat-area">
          <div className="aiind-chat-content">
            <Welcome messages={messages} />

            {messages.length > 0 && (
              <ChatBox
                messages={messages}
                loading={loading}
                chatEndRef={chatEndRef}
              />
            )}

            {loading && (
              <div className="aiind-typing">
                <span>AI.Ind</span>
                <i />
                <i />
                <i />
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </section>

        <div className="aiind-input">
          <ChatInput
            message={message}
            setMessage={setMessage}
            kirimPesan={kirimPesan}
            loading={loading}
          />
        </div>
      </main>
    </div>
  );
}

export default Home;