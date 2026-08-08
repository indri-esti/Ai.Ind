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

  // ==================================================
  // GET USER
  // ==================================================

  const getUser = () => {
    try {
      const data = localStorage.getItem("user");

      if (!data) {
        return null;
      }

      const user = JSON.parse(data);

      if (!user || !user.id) {
        return null;
      }

      return user;
    } catch (error) {
      console.error("Get User Error:", error);
      return null;
    }
  };

  // ==================================================
  // LOAD HISTORY
  // ==================================================

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

  // ==================================================
  // INITIAL LOAD
  // ==================================================

  useEffect(() => {
    const start = async () => {
      await loadHistory();
      setPageLoading(false);
    };

    start();
  }, []);

  // ==================================================
  // USER CHANGE
  // ==================================================

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

  // ==================================================
  // AUTO SCROLL
  // ==================================================

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ==================================================
  // CHAT BARU
  // ==================================================

  const chatBaru = () => {
    setMessages([]);
    setMessage("");
    setCurrentChatId(null);
  };

  // ==================================================
  // BUKA CHAT
  // ==================================================

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

  // ==================================================
  // KIRIM PESAN
  // ==================================================

  const kirimPesan = async () => {
    if (!message.trim() || loading) return;

    const user = getUser();

    // Pastikan user benar-benar tersedia
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
        user_id: Number(user.id),
        chat_id: currentChatId
          ? Number(currentChatId)
          : null,
      });

      const reply =
        res.data?.reply ||
        res.data?.message ||
        "Maaf, AI.Ind tidak memberikan jawaban.";

      // Backend membuat chat baru
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

      let errorMessage = "Terjadi kesalahan.";

      if (error.response) {
        errorMessage =
          error.response.data?.error ||
          error.response.data?.message ||
          `Server error (${error.response.status}).`;

        // Kalau backend mengatakan belum login
        if (error.response.status === 401) {
          errorMessage =
            "Sesi login tidak ditemukan. Silakan login kembali.";
        }
      } else if (error.request) {
        errorMessage =
          "Backend tidak memberikan respons.";
      } else if (error.message) {
        errorMessage = error.message;
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
  // PAGE LOADING
  // ==================================================

  if (pageLoading) {
    return <Loading />;
  }

  // ==================================================
  // UI
  // ==================================================

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