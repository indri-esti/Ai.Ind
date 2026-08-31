import { Row, Col } from "react-bootstrap";

import { FiX, FiImage } from "react-icons/fi";

import { useState, useEffect, useRef } from "react";

import { AdMob, BannerAd } from "@capgo/capacitor-admob";

import axios from "../api";

import Header from "../components/Header";

import ChatBox from "../components/ChatBox";

import ChatInput from "../components/ChatInput";

import Loading from "../components/Loading";

import Typing from "../components/Typing";

import Sidebar from "../components/Sidebar";

import Welcome from "../components/Welcome";

function Home() {
  // ==========================================
  // BERSIHKAN RESPONSE AI
  // ==========================================
  const bersihkanJawabanAI = (teks) => {
    if (!teks) return "";

    let hasil = String(teks);

    hasil = hasil.replace(
      /<think>[\s\S]*?<\/think>/gi,
      ""
    );

    hasil = hasil.replace(
      /<think>[\s\S]*$/gi,
      ""
    );

    hasil = hasil.replace(
      /<\/?think>/gi,
      ""
    );

    hasil = hasil.replace(
      /^(Here's|Heres|Here is)\s+a\s+thinking\s+process\s*:[\s\S]*$/i,
      ""
    );

    hasil = hasil.replace(
      /\n{3,}/g,
      "\n\n"
    );

    return hasil.trim();
  };

  // ==========================================
  // STATE
  // ==========================================
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(null);

  // ==========================================
  // REF HISTORY
  // ==========================================
  const activeHistoryIdRef = useRef(null);
  const historyLoadedRef = useRef(false);
  const historySaveTimeoutRef = useRef(null);
  const chatEndRef = useRef(null);

  // ==========================================
  // USER KEY
  // ==========================================
  const getUserKey = (user) => {
    if (!user) return null;

    const identifier =
      user.email ||
      user.id ||
      user.googleId ||
      user.nama;

    if (!identifier) {
      return null;
    }

    return `history_${String(identifier)
      .trim()
      .toLowerCase()}`;
  };

  // ==========================================
  // CHAT KEY
  // ==========================================
  const getChatKey = (chat) => {
    if (!chat) return null;

    if (
      chat.chatId !== undefined &&
      chat.chatId !== null
    ) {
      return `backend_${String(chat.chatId)}`;
    }

    if (
      chat.id !== undefined &&
      chat.id !== null
    ) {
      return `local_${String(chat.id)}`;
    }

    if (
      Array.isArray(chat.messages) &&
      chat.messages.length > 0
    ) {
      const first = chat.messages[0];

      const text =
        first?.content ||
        first?.text ||
        first?.message ||
        "";

      if (text) {
        return `content_${String(text)
          .trim()
          .toLowerCase()
          .slice(0, 150)}`;
      }
    }

    return `title_${String(
      chat.title || "Percakapan baru"
    )
      .trim()
      .toLowerCase()}`;
  };

  // ==========================================
  // CLEAN HISTORY
  // ==========================================
  const cleanHistory = (list) => {
    if (!Array.isArray(list)) {
      return [];
    }

    const map = new Map();

    list.forEach((chat, index) => {
      if (!chat) return;

      const key = getChatKey(chat);

      if (!key) return;

      const normalized = {
        ...chat,

        id:
          chat.id ??
          chat.chatId ??
          `local_${Date.now()}_${index}`,

        chatId:
          chat.chatId !== undefined &&
          chat.chatId !== null
            ? Number(chat.chatId)
            : null,

        title:
          chat.title ||
          "Percakapan baru",

        messages:
          Array.isArray(chat.messages)
            ? chat.messages
            : [],

        updatedAt:
          chat.updatedAt ||
          chat.createdAt ||
          Date.now(),
      };

      const existing = map.get(key);

      if (!existing) {
        map.set(key, normalized);
        return;
      }

      const existingLength =
        Array.isArray(existing.messages)
          ? existing.messages.length
          : 0;

      const currentLength =
        normalized.messages.length;

      const existingTime = Number(
        existing.updatedAt || 0
      );

      const currentTime = Number(
        normalized.updatedAt || 0
      );

      if (
        currentLength > existingLength ||
        currentTime > existingTime
      ) {
        map.set(key, normalized);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        Number(b.updatedAt || 0) -
        Number(a.updatedAt || 0)
    );
  };

  // ==========================================
  // LOAD USER HISTORY
  // ==========================================
  useEffect(() => {
    const loadHistory = () => {
      try {
        const savedUser =
          localStorage.getItem("user");

        if (!savedUser) {
          setHistory([]);
          historyLoadedRef.current = true;
          return;
        }

        const user = JSON.parse(savedUser);
        const userKey = getUserKey(user);

        if (!userKey) {
          setHistory([]);
          historyLoadedRef.current = true;
          return;
        }

        const savedHistory =
          localStorage.getItem(userKey);

        if (!savedHistory) {
          setHistory([]);
          historyLoadedRef.current = true;
          return;
        }

        const parsed = JSON.parse(savedHistory);
        const cleaned = cleanHistory(parsed);

        setHistory(cleaned);

        localStorage.setItem(
          userKey,
          JSON.stringify(cleaned)
        );

        historyLoadedRef.current = true;
      } catch (error) {
        console.error(
          "History load error:",
          error
        );

        setHistory([]);
        historyLoadedRef.current = true;
      }
    };

    loadHistory();

    window.addEventListener(
      "storage",
      loadHistory
    );

    window.addEventListener(
      "aiind-user-updated",
      loadHistory
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadHistory
      );

      window.removeEventListener(
        "aiind-user-updated",
        loadHistory
      );
    };
  }, []);

  // ==========================================
  // HISTORY UPDATE DARI SIDEBAR
  // ==========================================
  useEffect(() => {
    const handleHistoryUpdate = (event) => {
      const incoming =
        event.detail?.history;

      if (!Array.isArray(incoming)) {
        return;
      }

      const cleaned =
        cleanHistory(incoming);

      setHistory(cleaned);
    };

    window.addEventListener(
      "aiind-history-updated",
      handleHistoryUpdate
    );

    return () => {
      window.removeEventListener(
        "aiind-history-updated",
        handleHistoryUpdate
      );
    };
  }, []);

  // ==========================================
  // AUTO SAVE HISTORY
  // ==========================================
  useEffect(() => {
    if (!historyLoadedRef.current) {
      return;
    }

    const savedUser =
      localStorage.getItem("user");

    if (!savedUser) {
      return;
    }

    let user;

    try {
      user = JSON.parse(savedUser);
    } catch {
      return;
    }

    const userKey = getUserKey(user);

    if (!userKey) {
      return;
    }

    const cleaned = cleanHistory(history);

    if (historySaveTimeoutRef.current) {
      clearTimeout(
        historySaveTimeoutRef.current
      );
    }

    historySaveTimeoutRef.current =
      setTimeout(() => {
        try {
          localStorage.setItem(
            userKey,
            JSON.stringify(cleaned)
          );
        } catch (error) {
          console.error(
            "Gagal menyimpan history:",
            error
          );
        }
      }, 200);

    return () => {
      if (historySaveTimeoutRef.current) {
        clearTimeout(
          historySaveTimeoutRef.current
        );
      }
    };
  }, [history]);

  // ==========================================
  // AUTO SAVE CHAT AKTIF
  // ==========================================
  useEffect(() => {
    if (
      !historyLoadedRef.current ||
      messages.length === 0
    ) {
      return;
    }

    try {
      const savedUser =
        localStorage.getItem("user");

      if (!savedUser) {
        return;
      }

      const user = JSON.parse(savedUser);
      const userKey = getUserKey(user);

      if (!userKey) {
        return;
      }

      if (!activeHistoryIdRef.current) {
        activeHistoryIdRef.current =
          `local_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`;
      }

      const historyId =
        activeHistoryIdRef.current;

      const firstUserMessage =
        messages.find(
          (item) => item?.role === "user"
        );

      const title =
        firstUserMessage?.content
          ?.trim()
          ?.slice(0, 80) ||
        "Percakapan baru";

      const updatedChat = {
        id: historyId,

        chatId:
          currentChatId !== null &&
          currentChatId !== undefined
            ? Number(currentChatId)
            : null,

        title,

        messages: [...messages],

        updatedAt: Date.now(),
      };

      setHistory((prev) => {
        const cleaned = cleanHistory(prev);

        const existingIndex =
          cleaned.findIndex(
            (chat) =>
              String(chat.id) ===
              String(historyId)
          );

        let newHistory;

        if (existingIndex >= 0) {
          newHistory = [...cleaned];

          newHistory[existingIndex] =
            updatedChat;
        } else {
          const withoutDuplicate =
            cleaned.filter(
              (chat) =>
                getChatKey(chat) !==
                getChatKey(updatedChat)
            );

          newHistory = [
            updatedChat,
            ...withoutDuplicate,
          ];
        }

        return cleanHistory(newHistory);
      });
    } catch (error) {
      console.error(
        "Auto history error:",
        error
      );
    }
  }, [messages, currentChatId]);

  // ==========================================
  // TERIMA CHAT DARI SIDEBAR
  // ==========================================
  useEffect(() => {
    const handleLoadChat = (event) => {
      const detail =
        event.detail || {};

      if (
        detail.historyId !== undefined &&
        detail.historyId !== null
      ) {
        activeHistoryIdRef.current =
          detail.historyId;
      }

      if (
        detail.chatId !== undefined &&
        detail.chatId !== null
      ) {
        setCurrentChatId(
          Number(detail.chatId)
        );
      } else {
        setCurrentChatId(null);
      }
    };

    window.addEventListener(
      "aiind-load-chat",
      handleLoadChat
    );

    return () => {
      window.removeEventListener(
        "aiind-load-chat",
        handleLoadChat
      );
    };
  }, []);

  // ==========================================
  // ADMOB
  // ==========================================
  useEffect(() => {
    let banner = null;

    const tampilkanBanner = async () => {
      try {
        await AdMob.start();

        banner = new BannerAd({
          adUnitId:
            "ca-app-pub-5699049952148750/4400311367",

          position: "bottom",
        });

        await banner.show();

        console.log(
          "Banner AdMob berhasil ditampilkan"
        );
      } catch (error) {
        console.error(
          "AdMob error:",
          error
        );
      }
    };

    tampilkanBanner();

    return () => {
      if (banner) {
        banner.hide().catch(() => {});
      }
    };
  }, []);

  // ==========================================
  // IMAGE
  // ==========================================
  const pilihGambar = (event) => {
    const input = event?.target;
    const file = input?.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert(
        "Silakan pilih file gambar."
      );

      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert(
        "Ukuran gambar maksimal 10 MB."
      );

      event.target.value = "";
      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };

  const hapusGambar = () => {
    setSelectedImage(null);

    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ==========================================
  // AUTO SCROLL
  // ==========================================
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // ==========================================
  // PAGE LOADING
  // ==========================================
  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // CLEAN IMAGE URL
  // ==========================================
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  // ==========================================
  // CHAT BARU
  // ==========================================
  const chatBaru = () => {
    setMessages([]);
    setCurrentChatId(null);
    activeHistoryIdRef.current = null;
    hapusGambar();
  };

  // ==========================================
  // FILE TO BASE64
  // ==========================================
  const fileToBase64 = (file) => {
    return new Promise(
      (resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
          resolve(reader.result);
        };

        reader.onerror = () => {
          reject(
            new Error(
              "Gagal membaca gambar."
            )
          );
        };

        reader.readAsDataURL(file);
      }
    );
  };

  // ==========================================
  // KIRIM PESAN
  // ==========================================
  const kirimPesan = async () => {
    if (
      (!message.trim() && !selectedImage) ||
      loading
    ) {
      return;
    }

    const savedUser =
      localStorage.getItem("user");

    let currentUser = {};

    try {
      currentUser = savedUser
        ? JSON.parse(savedUser)
        : {};
    } catch (error) {
      console.error(
        "Data user tidak valid:",
        error
      );

      currentUser = {};
    }

    const userId = Number(
      currentUser?.id
    );

    if (
      !Number.isInteger(userId) ||
      userId <= 0
    ) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sesi login kamu tidak valid. Silakan logout lalu login kembali.",
        },
      ]);

      return;
    }

    // ======================================
    // SIMPAN DATA PESAN SEBELUM STATE BERUBAH
    // ======================================
    const pesanText =
      message.trim() ||
      "Tolong analisis gambar ini.";

    const imageFile =
      selectedImage;

    const previewAtSend =
      imagePreview;

    // ID unik untuk pesan user
    const userMessageId =
      `user_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 8)}`;

    // ======================================
    // BUAT HISTORY ID JIKA BELUM ADA
    // ======================================
    if (!activeHistoryIdRef.current) {
      activeHistoryIdRef.current =
        `local_${Date.now()}_${Math.random()
          .toString(36)
          .slice(2, 8)}`;
    }

    try {
      setLoading(true);

      // ======================================
      // GAMBAR USER LANGSUNG MASUK CHAT
      // ======================================
      const userMessage = {
        id: userMessageId,
        role: "user",
        content: pesanText,

        /*
         * Untuk sementara gunakan preview.
         * Setelah Base64 selesai, akan diganti
         * dengan Base64 agar aman untuk history.
         */
        image: previewAtSend || null,
      };

      setMessages((prev) => [
        ...prev,
        userMessage,
      ]);

      // Kosongkan input teks SEKARANG
      setMessage("");

      // ======================================
      // SCROLL LANGSUNG KE PESAN USER
      // ======================================
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });

      // ======================================
      // UBAH GAMBAR KE BASE64
      // ======================================
      let imageBase64 = null;

      if (imageFile) {
        imageBase64 =
          await fileToBase64(imageFile);

        // ====================================
        // GANTI PREVIEW DENGAN BASE64
        // ====================================
        setMessages((prev) =>
          prev.map((item) =>
            item.id === userMessageId
              ? {
                  ...item,
                  image: imageBase64,
                }
              : item
          )
        );
      }

      // ======================================
      // HAPUS PREVIEW INPUT
      // ======================================
      if (imageFile) {
        hapusGambar();
      }

      // ======================================
      // BACKEND
      // ======================================
      const res = await axios.post(
        "/chat",
        {
          message: pesanText,
          user_id: userId,

          chat_id:
            currentChatId
              ? Number(currentChatId)
              : null,

          image: imageBase64,
        }
      );

      // ======================================
      // CHAT ID BACKEND
      // ======================================
      if (
        res.data?.chat_id !== undefined &&
        res.data?.chat_id !== null
      ) {
        setCurrentChatId(
          Number(res.data.chat_id)
        );
      }

      // ======================================
      // JAWABAN AI
      // ======================================
      const jawabanAI =
        bersihkanJawabanAI(
          res.data?.reply
        );

      setMessages((prev) => [
        ...prev,
        {
          id: `assistant_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,

          role: "assistant",

          content:
            jawabanAI ||
            "AI tidak memberikan jawaban.",
        },
      ]);

      // ======================================
      // SCROLL KE JAWABAN AI
      // ======================================
      requestAnimationFrame(() => {
        chatEndRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      });
    } catch (err) {
      console.error(
        "Kirim pesan error:",
        err
      );

      let errorMessage =
        "Terjadi kesalahan saat menghubungi AI.";

      if (err.response) {
        const backendError =
          err.response?.data?.error ||
          err.response?.data?.message;

        errorMessage =
          backendError ||
          `Backend mengembalikan error ${err.response.status}.`;
      } else if (err.request) {
        errorMessage =
          "Backend tidak dapat dihubungi. Periksa koneksi internet atau status server.";
      } else if (err.message) {
        errorMessage = err.message;
      }

      setMessages((prev) => [
        ...prev,
        {
          id: `error_${Date.now()}_${Math.random()
            .toString(36)
            .slice(2, 8)}`,

          role: "assistant",

          content: errorMessage,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================
  if (pageLoading) {
    return <Loading />;
  }

  // ==========================================
  // RENDER
  // ==========================================
  return (
    <>
      <style>{`
        .home-page {
          min-height: 100dvh;
          height: 100dvh;
          display: flex;
          overflow: hidden;
          color: #fff;
          background:
            radial-gradient(
              circle at 50% -20%,
              rgba(0,194,255,.09),
              transparent 35%
            ),
            #081420;
        }

        .home-main {
          flex: 1;
          min-width: 0;
          height: 100dvh;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .home-header {
          flex-shrink: 0;
          position: relative;
          z-index: 10;
        }

        .home-header-container {
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0;
        }

        .home-chat-area {
          flex: 1;
          min-height: 0;
          overflow: hidden;
        }

        .home-chat-container {
          width: 100%;
          height: 100%;
          max-width: 1100px;
          margin: auto;
          padding: 0 22px;
        }

        .home-chat-column {
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .home-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 12px 4px 165px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          scrollbar-width: thin;
          scrollbar-color: #1B3445 transparent;
        }

        .home-welcome {
          flex: 1;
          min-height: 0;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 25px 10px 40px;
        }

        .home-welcome-content {
          width: 100%;
          max-width: 720px;
          text-align: center;
        }

        .home-logo-wrapper {
          position: relative;
          width: 96px;
          height: 96px;
          margin: 0 auto 24px;
        }

        .home-logo-glow {
          position: absolute;
          inset: -28px;
          border-radius: 50%;
          background: rgba(0,194,255,.08);
          filter: blur(28px);
        }

        .home-logo-box {
          position: relative;
          width: 96px;
          height: 96px;
          border-radius: 27px;
          overflow: hidden;
          border: 1px solid rgba(24,216,255,.2);
          box-shadow: 0 18px 55px rgba(0,194,255,.15);
        }

        .home-logo-box img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .home-title {
          margin: 0;
          color: #fff;
          font-size: clamp(28px, 5vw, 43px);
          font-weight: 800;
          letter-spacing: -1.5px;
          line-height: 1.15;
        }

        .home-title span {
          color: #00C2FF;
        }

        .home-subtitle {
          margin: 12px 0 0;
          color: #CDE4ED;
          font-size: clamp(14px, 2vw, 18px);
          font-weight: 600;
        }

        .home-description {
          max-width: 570px;
          margin: 10px auto 0;
          color: #71899A;
          font-size: 13px;
          line-height: 1.7;
        }

        .home-suggestions {
          margin-top: 22px;
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .home-suggestion-button {
          padding: 9px 14px;
          border: 1px solid rgba(0,194,255,.13);
          border-radius: 999px;
          background: rgba(13,35,49,.72);
          color: #8EACBC;
          font-size: 11px;
          cursor: pointer;
          transition: .2s ease;
        }

        .home-suggestion-button:hover {
          color: #DDF8FF;
          border-color: rgba(0,194,255,.35);
          background: rgba(0,194,255,.08);
          transform: translateY(-1px);
        }

        .home-input-area {
          position: absolute;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 100;
          pointer-events: auto;
          padding: 40px 22px 18px;
          background:
            linear-gradient(
              to top,
              #081420 68%,
              rgba(8,20,32,.92) 82%,
              transparent
            );
        }

        .home-input-container {
          width: 100%;
          max-width: 1100px;
          margin: auto;
        }

        .home-input-row {
          width: 100%;
          min-width: 0;
          position: relative;
          z-index: 101;
          pointer-events: auto;
        }

        .home-input-row > * {
          width: 100%;
          min-width: 0;
          position: relative;
          z-index: 102;
          pointer-events: auto;
        }

        .home-input-row button,
        .home-input-row label,
        .home-input-row input,
        .home-input-row [role="button"] {
          pointer-events: auto !important;
          touch-action: manipulation;
        }

        .home-disclaimer {
          margin-top: 7px;
          text-align: center;
          color: #435C6D;
          font-size: 9px;
        }

        .home-image-preview {
          margin-bottom: 9px;
        }

        .home-image-preview-inner {
          position: relative;
          width: min(210px, 70vw);
          max-height: 140px;
          overflow: hidden;
          border-radius: 15px;
          border: 1px solid rgba(24,216,255,.18);
          background: rgba(10,31,45,.95);
        }

        .home-image-preview-inner img {
          display: block;
          width: 100%;
          max-height: 140px;
          object-fit: cover;
        }

        .home-image-remove {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 29px;
          height: 29px;
          border: 0;
          border-radius: 50%;
          background: rgba(5,15,24,.82);
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .home-image-label {
          position: absolute;
          left: 7px;
          bottom: 7px;
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 5px 8px;
          border-radius: 999px;
          background: rgba(5,15,24,.78);
          color: #D8F6FF;
          font-size: 9px;
        }

        @media (max-width: 767px) {
          .home-header-container {
            padding: 0;
            margin: 0;
            max-width: none;
          }

          .home-chat-container {
            padding: 0 8px;
          }

          .home-messages {
            padding: 6px 2px 145px;
            gap: 10px;
          }

          .home-welcome {
            padding: 15px 8px 30px;
          }

          .home-logo-wrapper,
          .home-logo-box {
            width: 78px;
            height: 78px;
          }

          .home-logo-wrapper {
            margin-bottom: 17px;
          }

          .home-title {
            font-size: clamp(25px, 8vw, 34px);
            letter-spacing: -.9px;
          }

          .home-subtitle {
            font-size: 14px;
            margin-top: 9px;
          }

          .home-description {
            padding: 0 12px;
            font-size: 11px;
            line-height: 1.6;
          }

          .home-suggestions {
            margin-top: 15px;
            gap: 6px;
          }

          .home-suggestion-button {
            padding: 8px 10px;
            font-size: 10px;
          }

          .home-input-area {
            padding:
              28px 8px
              calc(
                9px +
                env(safe-area-inset-bottom)
              );
          }

          .home-disclaimer {
            font-size: 8px;
          }
        }
      `}</style>

      <div className="home-page">
        <Sidebar
          messages={messages}
          setMessages={setMessages}
          history={history}
          setHistory={setHistory}
          chatBaru={chatBaru}
        />

        <main className="home-main">
          <div className="home-header">
            <div className="home-header-container">
              <Header />
            </div>
          </div>

          <div className="home-chat-area">
            <div className="home-chat-container">
              <Row
                style={{
                  height: "100%",
                  margin: 0,
                }}
              >
                <Col
                  xs={12}
                  className="home-chat-column"
                  style={{
                    padding: 0,
                  }}
                >
                  <div className="home-messages">
                    {messages.length === 0 &&
                      !loading && (
                        <Welcome
                          message={message}
                          setMessage={setMessage}
                        />
                      )}

                    {messages.length > 0 && (
                      <ChatBox
                        messages={messages}
                        loading={false}
                        chatEndRef={chatEndRef}
                      />
                    )}

                    {loading && <Typing />}

                    <div ref={chatEndRef} />
                  </div>
                </Col>
              </Row>
            </div>
          </div>

          <div className="home-input-area">
            <div className="home-input-container">
              {imagePreview && (
                <div className="home-image-preview">
                  <div className="home-image-preview-inner">
                    <img
                      src={imagePreview}
                      alt="Preview gambar"
                    />

                    <button
                      type="button"
                      className="home-image-remove"
                      onClick={hapusGambar}
                      title="Hapus gambar"
                    >
                      <FiX size={15} />
                    </button>

                    <div className="home-image-label">
                      <FiImage size={13} />
                      Gambar siap dianalisis
                    </div>
                  </div>
                </div>
              )}

              <div className="home-input-row">
                <ChatInput
                  message={message}
                  setMessage={setMessage}
                  kirimPesan={kirimPesan}
                  loading={loading}
                  fileInputRef={fileInputRef}
                  pilihGambar={pilihGambar}
                  imagePreview={imagePreview}
                  hapusGambar={hapusGambar}
                />
              </div>

              <div className="home-disclaimer">
                AI.Ind dapat membuat
                kesalahan. Periksa kembali
                informasi penting.
              </div>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export default Home;

