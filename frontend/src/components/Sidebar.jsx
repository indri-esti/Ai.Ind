import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
  FiPlus,
  FiMessageSquare,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiInfo,
  FiCheck,
} from "react-icons/fi";

import {
  FaTrash,
  FaCog,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";

function Sidebar({
  messages,
  setMessages,
  history = [],
  setHistory,
  chatBaru,
}) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);

  const [mobile, setMobile] = useState(
    window.innerWidth < 768
  );

  const [open, setOpen] = useState(
    window.innerWidth >= 768
  );

  const [settingOpen, setSettingOpen] = useState(false);

  // =====================================================
  // REF
  // =====================================================

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const openingChatRef = useRef(false);
  const lastOpenedKeyRef = useRef(null);
  const lastOpenedTimeRef = useRef(0);

  // =====================================================
  // USER KEY
  // =====================================================

  const getUserKey = (currentUser) => {
    if (!currentUser) return null;

    const identifier =
      currentUser.email ||
      currentUser.id ||
      currentUser.googleId ||
      currentUser.nama;

    if (!identifier) return null;

    return `history_${String(identifier)
      .trim()
      .toLowerCase()}`;
  };

  // =====================================================
  // HISTORY UNIQUE KEY
  // =====================================================

  const getChatKey = (chat) => {
    if (!chat) return null;

    // ID backend
    if (
      chat.chatId !== undefined &&
      chat.chatId !== null
    ) {
      return `backend_${String(chat.chatId)}`;
    }

    // ID lokal
    if (
      chat.id !== undefined &&
      chat.id !== null
    ) {
      return `local_${String(chat.id)}`;
    }

    // Berdasarkan pesan pertama
    if (
      Array.isArray(chat.messages) &&
      chat.messages.length > 0
    ) {
      const firstMessage = chat.messages[0];

      const text =
        firstMessage?.content ||
        firstMessage?.text ||
        firstMessage?.message ||
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

  // =====================================================
  // BERSIHKAN DUPLIKAT
  // =====================================================

  const cleanHistory = (list) => {
    if (!Array.isArray(list)) {
      return [];
    }

    const map = new Map();

    list.forEach((chat, index) => {
      if (!chat) return;

      const key = getChatKey(chat);

      if (!key) return;

      const normalizedChat = {
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

        messages: Array.isArray(chat.messages)
          ? chat.messages
          : [],

        title:
          chat.title ||
          "Percakapan baru",

        updatedAt:
          chat.updatedAt ||
          chat.createdAt ||
          Date.now(),
      };

      const existing = map.get(key);

      if (!existing) {
        map.set(key, normalizedChat);
        return;
      }

      const existingLength =
        Array.isArray(existing.messages)
          ? existing.messages.length
          : 0;

      const currentLength =
        normalizedChat.messages.length;

      const existingUpdated =
        Number(existing.updatedAt || 0);

      const currentUpdated =
        Number(normalizedChat.updatedAt || 0);

      /*
       * Pilih data yang lebih lengkap / lebih baru.
       */
      if (
        currentLength > existingLength ||
        currentUpdated > existingUpdated
      ) {
        map.set(key, normalizedChat);
      }
    });

    return Array.from(map.values()).sort(
      (a, b) =>
        Number(b.updatedAt || 0) -
        Number(a.updatedAt || 0)
    );
  };

  // =====================================================
  // HISTORY YANG SUDAH BERSIH
  // =====================================================

  const uniqueHistory = useMemo(() => {
    return cleanHistory(history);
  }, [history]);

  // =====================================================
  // LOAD USER
  // =====================================================

  useEffect(() => {
    const loadUser = () => {
      try {
        const data =
          localStorage.getItem("user");

        if (!data) {
          setUser(null);
          return;
        }

        const parsed = JSON.parse(data);

        if (
          parsed &&
          typeof parsed === "object"
        ) {
          setUser(parsed);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.log(
          "User error:",
          error
        );

        setUser(null);
      }
    };

    loadUser();

    window.addEventListener(
      "storage",
      loadUser
    );

    window.addEventListener(
      "aiind-user-updated",
      loadUser
    );

    return () => {
      window.removeEventListener(
        "storage",
        loadUser
      );

      window.removeEventListener(
        "aiind-user-updated",
        loadUser
      );
    };
  }, []);

  // =====================================================
  // RESPONSIVE
  // =====================================================

  useEffect(() => {
    const handleResize = () => {
      const isMobile =
        window.innerWidth < 768;

      setMobile(isMobile);

      if (!isMobile) {
        setOpen(true);
      }
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  // =====================================================
  // SWIPE
  // =====================================================

  const handleTouchStart = (e) => {
    if (!mobile) return;

    const touch = e.touches?.[0];

    if (!touch) return;

    touchStartX.current =
      touch.clientX;

    touchStartY.current =
      touch.clientY;
  };

  const handleTouchMove = (e) => {
    if (
      !mobile ||
      touchStartX.current === null ||
      touchStartY.current === null
    ) {
      return;
    }

    const touch = e.touches?.[0];

    if (!touch) return;

    const diffX =
      touch.clientX -
      touchStartX.current;

    const diffY =
      touch.clientY -
      touchStartY.current;

    // Jangan ganggu scroll vertikal
    if (
      Math.abs(diffY) >
      Math.abs(diffX)
    ) {
      return;
    }

    // Buka dari kiri
    if (
      !open &&
      touchStartX.current < 45 &&
      diffX > 55
    ) {
      setOpen(true);

      touchStartX.current = null;
      touchStartY.current = null;

      return;
    }

    // Tutup sidebar
    if (
      open &&
      diffX < -70
    ) {
      setOpen(false);

      touchStartX.current = null;
      touchStartY.current = null;
    }
  };

  const handleTouchEnd = () => {
    touchStartX.current = null;
    touchStartY.current = null;
  };

  // =====================================================
  // CLOSE MOBILE
  // =====================================================

  const closeMobileSidebar = () => {
    if (mobile) {
      setOpen(false);
    }
  };

  // =====================================================
  // CHAT BARU
  // =====================================================

  const handleChatBaru = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    /*
     * Jangan setHistory([]).
     * Jangan hapus localStorage.
     *
     * Home yang mengosongkan chat aktif.
     * History lama tetap tersimpan.
     */

    if (typeof chatBaru === "function") {
      chatBaru();
    }

    closeMobileSidebar();
  };

  // =====================================================
  // OPEN CHAT
  // =====================================================

  const handleOpenChat = (chat, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!chat) return;

    const chatKey =
      getChatKey(chat);

    const now = Date.now();

    /*
     * Anti double click / double event
     */
    if (openingChatRef.current) {
      return;
    }

    if (
      lastOpenedKeyRef.current ===
        chatKey &&
      now -
        lastOpenedTimeRef.current <
        700
    ) {
      return;
    }

    openingChatRef.current = true;

    lastOpenedKeyRef.current =
      chatKey;

    lastOpenedTimeRef.current =
      now;

    const chatMessages =
      Array.isArray(chat.messages)
        ? [...chat.messages]
        : [];

    /*
     * Set messages hanya satu kali.
     */
    setMessages(chatMessages);

    /*
     * Home akan:
     * - mengambil historyId
     * - mengambil chatId backend
     * - mengunci percakapan aktif
     */
    window.dispatchEvent(
      new CustomEvent(
        "aiind-load-chat",
        {
          detail: {
            chatId:
              chat.chatId !== undefined &&
              chat.chatId !== null
                ? Number(chat.chatId)
                : null,

            historyId:
              chat.id ?? null,

            chatKey,
          },
        }
      )
    );

    closeMobileSidebar();

    setTimeout(() => {
      openingChatRef.current =
        false;
    }, 700);
  };

  // =====================================================
  // DELETE HISTORY
  // =====================================================

  const handleDeleteHistory = (
    e,
    chatToDelete,
    index
  ) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    if (!chatToDelete) return;

    const deletedKey =
      getChatKey(chatToDelete);

    const newHistory =
      uniqueHistory.filter(
        (chat, i) => {
          if (i === index) {
            return false;
          }

          return (
            getChatKey(chat) !==
            deletedKey
          );
        }
      );

    /*
     * Hanya update state.
     *
     * Home adalah satu-satunya tempat
     * yang menyimpan history ke localStorage.
     */
    setHistory(newHistory);

    /*
     * Beritahu Home bahwa history berubah.
     */
    window.dispatchEvent(
      new CustomEvent(
        "aiind-history-updated",
        {
          detail: {
            history: newHistory,
          },
        }
      )
    );
  };

  // =====================================================
  // CHANGE ACCOUNT
  // =====================================================

  const handleChangeAccount = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    Swal.fire({
      title: "Ganti Akun?",
      text:
        "Kamu akan keluar dari akun saat ini.",
      icon: "warning",

      background: "#0B1D2A",
      color: "#fff",

      showCancelButton: true,

      confirmButtonText:
        "Ganti Akun",

      cancelButtonText:
        "Batal",

      confirmButtonColor:
        "#00C2FF",

      cancelButtonColor:
        "#334155",

      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setMessages([]);
        setSettingOpen(false);

        localStorage.removeItem(
          "user"
        );

        setUser(null);

        window.dispatchEvent(
          new Event(
            "aiind-user-updated"
          )
        );

        navigate("/login");
      }
    });
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    Swal.fire({
      title: "Keluar Akun?",
      text:
        "Apakah kamu yakin ingin keluar?",
      icon: "warning",

      background: "#0B1D2A",
      color: "#fff",

      showCancelButton: true,

      confirmButtonText:
        "Keluar",

      cancelButtonText:
        "Batal",

      confirmButtonColor:
        "#ef4444",

      cancelButtonColor:
        "#334155",

      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        setMessages([]);
        setSettingOpen(false);

        localStorage.removeItem(
          "user"
        );

        setUser(null);

        window.dispatchEvent(
          new Event(
            "aiind-user-updated"
          )
        );

        navigate("/login");
      }
    });
  };

  // =====================================================
  // ABOUT
  // =====================================================

  const handleAbout = () => {
    Swal.fire({
      title: "AI.Ind",

      html: `
        <div style="
          line-height:1.8;
          color:#A9C4D3;
        ">
          <strong style="
            color:#00C2FF;
            font-size:17px;
          ">
            AI.Ind
          </strong>

          <br>

          Asisten AI buatan Indonesia 🇮🇩

          <br><br>

          <span style="
            color:#71899A;
            font-size:13px;
          ">
            Teman cerdas untuk membantu
            belajar, mencari ide,
            pemrograman, dan berbagai
            aktivitas lainnya.
          </span>

          <br><br>

          <small style="
            color:#536B7D;
          ">
            Versi 1.0.0
          </small>
        </div>
      `,

      icon: "info",

      background: "#0B1D2A",
      color: "#fff",

      confirmButtonColor:
        "#00C2FF",

      reverseButtons: true,
    });
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <>
      <style>{`
        * {
          box-sizing: border-box;
        }

        /* ==========================================
           SIDEBAR
        ========================================== */

        .ai-sidebar {
          width: 274px;
          height: 100dvh;
          max-height: 100dvh;

          flex-shrink: 0;

          display: flex;
          flex-direction: column;

          position: relative;

          background:
            linear-gradient(
              180deg,
              #0A1B28 0%,
              #07151F 100%
            );

          border-right:
            1px solid
            rgba(255,255,255,.07);

          z-index: 1000;

          overflow: hidden;
        }

        /* ==========================================
           TOP
        ========================================== */

        .ai-sidebar-top {
          flex-shrink: 0;

          padding:
            22px
            18px
            16px;
        }

        .ai-brand-row {
          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 10px;
        }

        .ai-brand {
          display: flex;
          align-items: center;

          gap: 12px;

          min-width: 0;
        }

        .ai-brand-logo {
          width: 46px;
          height: 46px;

          min-width: 46px;

          border-radius: 14px;

          object-fit: cover;

          box-shadow:
            0 8px 28px
            rgba(0,194,255,.14);
        }

        .ai-brand-name {
          margin: 0;

          color: #fff;

          font-size: 20px;
          font-weight: 800;

          letter-spacing: -.5px;
        }

        .ai-brand-name span {
          color: #00C2FF;
        }

        .ai-brand-sub {
          margin-top: 3px;

          color: #6F8798;

          font-size: 11px;

          white-space: nowrap;
        }

        /* ==========================================
           NEW CHAT
        ========================================== */

        .ai-new-chat {
          width: 100%;

          margin-top: 22px;

          padding:
            12px
            15px;

          border:
            1px solid
            rgba(0,194,255,.18);

          border-radius: 14px;

          background:
            linear-gradient(
              135deg,
              rgba(0,194,255,.16),
              rgba(0,143,232,.08)
            );

          color: #DDF8FF;

          display: flex;
          align-items: center;

          gap: 10px;

          font-size: 13px;
          font-weight: 700;

          cursor: pointer;

          transition:
            background .2s ease,
            border-color .2s ease,
            transform .15s ease;

          -webkit-tap-highlight-color:
            transparent;
        }

        .ai-new-chat:hover {
          background:
            linear-gradient(
              135deg,
              rgba(0,194,255,.25),
              rgba(0,143,232,.12)
            );

          border-color:
            rgba(0,194,255,.35);

          transform:
            translateY(-1px);
        }

        .ai-new-chat:active {
          transform:
            scale(.98);
        }

        .ai-new-chat-icon {
          width: 29px;
          height: 29px;

          min-width: 29px;

          border-radius: 9px;

          background:
            #00C2FF;

          color:
            #06131C;

          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ==========================================
           HISTORY
        ========================================== */

        .ai-history {
          flex:
            1 1 0;

          min-height: 0;

          width: 100%;

          overflow-y: auto;
          overflow-x: hidden;

          padding:
            4px
            10px
            18px;

          scrollbar-width: thin;

          scrollbar-color:
            #1C3849
            transparent;

          -webkit-overflow-scrolling:
            touch;

          overscroll-behavior:
            contain;

          touch-action:
            pan-y;

          position: relative;
        }

        .ai-history::-webkit-scrollbar {
          width: 5px;
        }

        .ai-history::-webkit-scrollbar-track {
          background:
            transparent;
        }

        .ai-history::-webkit-scrollbar-thumb {
          background:
            #1C3849;

          border-radius:
            999px;
        }

        .ai-history::-webkit-scrollbar-thumb:hover {
          background:
            #2A5065;
        }

        /* ==========================================
           HISTORY TITLE
        ========================================== */

        .ai-history-title {
          display: flex;

          align-items: center;

          justify-content:
            space-between;

          padding:
            10px
            7px
            9px;

          color:
            #60798B;

          font-size:
            10px;

          font-weight:
            800;

          letter-spacing:
            1.2px;

          text-transform:
            uppercase;

          position:
            sticky;

          top: 0;

          z-index: 5;

          background:
            linear-gradient(
              180deg,
              #091A27 80%,
              rgba(9,26,39,0)
            );
        }

        .ai-history-count {
          min-width:
            21px;

          padding:
            3px 6px;

          border-radius:
            20px;

          background:
            rgba(255,255,255,.05);

          color:
            #6C8799;

          text-align:
            center;

          font-size:
            10px;
        }

        /* ==========================================
           EMPTY
        ========================================== */

        .ai-empty {
          padding:
            34px
            15px;

          text-align:
            center;

          color:
            #4F697B;
        }

        .ai-empty-icon {
          width:
            46px;

          height:
            46px;

          margin:
            0 auto
            11px;

          border-radius:
            14px;

          background:
            rgba(0,194,255,.06);

          color:
            #00C2FF;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;
        }

        .ai-empty p {
          margin:
            0;

          color:
            #6B8596;

          font-size:
            12px;
        }

        .ai-empty small {
          display:
            block;

          margin-top:
            5px;

          color:
            #3E5667;

          font-size:
            10px;

          line-height:
            1.5;
        }

        /* ==========================================
           HISTORY ITEM
        ========================================== */

        .ai-history-item {
          display:
            flex;

          align-items:
            center;

          gap:
            8px;

          width:
            100%;

          padding:
            8px;

          margin-bottom:
            4px;

          border:
            1px solid
            transparent;

          border-radius:
            13px;

          background:
            transparent;

          cursor:
            pointer;

          transition:
            background .16s ease,
            border-color .16s ease;

          -webkit-tap-highlight-color:
            transparent;

          user-select:
            none;

          touch-action:
            manipulation;
        }

        .ai-history-item:hover {
          background:
            rgba(255,255,255,.035);

          border-color:
            rgba(255,255,255,.045);
        }

        .ai-history-item:active {
          background:
            rgba(0,194,255,.07);
        }

        .ai-history-icon {
          width:
            35px;

          height:
            35px;

          min-width:
            35px;

          border-radius:
            10px;

          background:
            rgba(0,194,255,.07);

          color:
            #00C2FF;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;
        }

        .ai-history-text {
          flex:
            1;

          min-width:
            0;

          overflow:
            hidden;
        }

        .ai-history-name {
          color:
            #D8EAF2;

          font-size:
            12px;

          line-height:
            1.35;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .ai-history-meta {
          margin-top:
            3px;

          color:
            #506A7B;

          font-size:
            9px;
        }

        /* ==========================================
           DELETE
        ========================================== */

        .ai-delete {
          width:
            29px;

          height:
            29px;

          min-width:
            29px;

          border:
            0;

          border-radius:
            9px;

          background:
            transparent;

          color:
            #506979;

          display:
            flex;

          align-items:
            center;

          justify-content:
            center;

          cursor:
            pointer;

          opacity:
            0;

          transition:
            background .16s ease,
            color .16s ease,
            opacity .16s ease;

          -webkit-tap-highlight-color:
            transparent;
        }

        .ai-history-item:hover
        .ai-delete {
          opacity:
            1;
        }

        .ai-delete:hover {
          background:
            rgba(239,68,68,.1);

          color:
            #ff6b6b;
        }

        /* ==========================================
           BOTTOM
        ========================================== */

        .ai-sidebar-bottom {
          flex-shrink:
            0;

          padding:
            12px;

          border-top:
            1px solid
            rgba(255,255,255,.06);

          background:
            rgba(5,14,21,.5);
        }

        /* ==========================================
           USER
        ========================================== */

        .ai-user-card {
          display:
            flex;

          align-items:
            center;

          gap:
            10px;

          padding:
            10px;

          border-radius:
            13px;

          background:
            rgba(255,255,255,.025);

          border:
            1px solid
            rgba(255,255,255,.045);
        }

        .ai-user-icon {
          color:
            #00C2FF;

          flex-shrink:
            0;
        }

        .ai-user-info {
          min-width:
            0;

          flex:
            1;
        }

        .ai-user-name {
          color:
            #EAF8FF;

          font-size:
            12px;

          font-weight:
            700;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        .ai-user-email {
          margin-top:
            2px;

          color:
            #60798B;

          font-size:
            9px;

          white-space:
            nowrap;

          overflow:
            hidden;

          text-overflow:
            ellipsis;
        }

        /* ==========================================
           MENU
        ========================================== */

        .ai-menu {
          display:
            flex;

          align-items:
            center;

          gap:
            10px;

          padding:
            9px 8px;

          margin-top:
            5px;

          border-radius:
            10px;

          color:
            #71899A;

          font-size:
            12px;

          cursor:
            pointer;

          transition:
            background .16s ease,
            color .16s ease;

          -webkit-tap-highlight-color:
            transparent;
        }

        .ai-menu:hover {
          background:
            rgba(255,255,255,.035);

          color:
            #C9E5F0;
        }

        .ai-submenu {
          margin-left:
            24px;

          margin-bottom:
            3px;
        }

        .ai-submenu-item {
          display:
            flex;

          align-items:
            center;

          gap:
            9px;

          padding:
            8px;

          border-radius:
            9px;

          color:
            #8197A6;

          font-size:
            11px;

          cursor:
            pointer;

          -webkit-tap-highlight-color:
            transparent;
        }

        .ai-submenu-item:hover {
          background:
            rgba(255,255,255,.035);

          color:
            #fff;
        }

        .ai-about {
          border-top:
            1px solid
            rgba(255,255,255,.05);

          padding-top:
            9px;

          margin-top:
            3px;
        }

        /* ==========================================
           CLOSE
        ========================================== */

        .ai-mobile-close {
          display:
            none;
        }

        /* ==========================================
           MOBILE
        ========================================== */

        @media (max-width: 767px) {
          .ai-sidebar {
            position:
              fixed;

            top:
              0;

            left:
              0;

            width:
              min(292px, 84vw);

            height:
              100dvh;

            max-height:
              100dvh;

            transform:
              translateX(
                ${open ? "0" : "-105%"}
              );

            transition:
              transform
              .28s
              cubic-bezier(
                .22,
                .61,
                .36,
                1
              );

            box-shadow:
              ${
                open
                  ? "12px 0 45px rgba(0,0,0,.38)"
                  : "none"
              };

            overscroll-behavior:
              contain;
          }

          .ai-sidebar-top {
            padding:
              calc(
                18px +
                env(safe-area-inset-top)
              )
              16px
              15px;
          }

          .ai-history {
            padding:
              4px
              10px
              calc(
                18px +
                env(safe-area-inset-bottom)
              );

            overflow-y:
              scroll;

            touch-action:
              pan-y;

            -webkit-overflow-scrolling:
              touch;

            overscroll-behavior:
              contain;
          }

          .ai-mobile-close {
            width:
              31px;

            height:
              31px;

            min-width:
              31px;

            border:
              0;

            border-radius:
              9px;

            background:
              rgba(255,255,255,.05);

            color:
              #7690A1;

            display:
              flex;

            align-items:
              center;

            justify-content:
              center;

            cursor:
              pointer;

            -webkit-tap-highlight-color:
              transparent;
          }

          .ai-delete {
            opacity:
              1;
          }

          .ai-history-item {
            min-height:
              51px;

            padding:
              8px
              7px;

            margin-bottom:
              5px;
          }

          .ai-history-title {
            padding:
              10px
              7px;
          }

          .ai-new-chat {
            min-height:
              48px;
          }
        }
      `}</style>

      {/* ==================================================
          AREA SWIPE
      ================================================== */}

      {mobile && !open && (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "45px",
            height: "100%",
            zIndex: 997,
            pointerEvents: "auto",
            touchAction: "pan-y",
          }}
        />
      )}

      {/* ==================================================
          OVERLAY
      ================================================== */}

      {mobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background:
              "rgba(0,0,0,.48)",
            backdropFilter:
              "blur(3px)",
            WebkitBackdropFilter:
              "blur(3px)",
            zIndex: 998,
          }}
        />
      )}

      {/* ==================================================
          SIDEBAR
      ================================================== */}

      <aside
        className="ai-sidebar"
        onTouchStart={(e) => {
          if (
            e.target.closest(
              ".ai-history"
            )
          ) {
            return;
          }

          handleTouchStart(e);
        }}
        onTouchMove={(e) => {
          if (
            e.target.closest(
              ".ai-history"
            )
          ) {
            return;
          }

          handleTouchMove(e);
        }}
        onTouchEnd={(e) => {
          if (
            e.target.closest(
              ".ai-history"
            )
          ) {
            return;
          }

          handleTouchEnd(e);
        }}
      >
        {/* ==================================================
            TOP
        ================================================== */}

        <div className="ai-sidebar-top">
          <div className="ai-brand-row">
            <div className="ai-brand">
              <img
                src="/logo.svg"
                alt="AI.Ind"
                className="ai-brand-logo"
              />

              <div>
                <h2 className="ai-brand-name">
                  AI
                  <span>.Ind</span>
                </h2>

                <div className="ai-brand-sub">
                  Asisten AI buatan Indonesia 🇮🇩
                </div>
              </div>
            </div>

            {mobile && (
              <button
                type="button"
                className="ai-mobile-close"
                onClick={() =>
                  setOpen(false)
                }
                aria-label="Tutup sidebar"
              >
                <FiX size={17} />
              </button>
            )}
          </div>

          <button
            type="button"
            className="ai-new-chat"
            onClick={handleChatBaru}
          >
            <span className="ai-new-chat-icon">
              <FiPlus size={17} />
            </span>

            <span>
              Percakapan baru
            </span>
          </button>
        </div>

        {/* ==================================================
            HISTORY
        ================================================== */}

        <div
          className="ai-history"
          onTouchStart={() => {}}
          onTouchMove={() => {}}
          onTouchEnd={() => {}}
        >
          <div className="ai-history-title">
            <span>
              Riwayat percakapan
            </span>

            {uniqueHistory.length > 0 && (
              <span className="ai-history-count">
                {uniqueHistory.length}
              </span>
            )}
          </div>

          {uniqueHistory.length === 0 ? (
            <div className="ai-empty">
              <div className="ai-empty-icon">
                <FiMessageSquare
                  size={20}
                />
              </div>

              <p>
                Belum ada percakapan
              </p>

              <small>
                Pesan yang kamu kirim
                akan otomatis tersimpan
              </small>
            </div>
          ) : (
            uniqueHistory.map(
              (chat, index) => {
                const chatKey =
                  getChatKey(chat);

                return (
                  <div
                    key={chatKey}
                    className="ai-history-item"
                    onClick={(e) =>
                      handleOpenChat(
                        chat,
                        e
                      )
                    }
                  >
                    <div className="ai-history-icon">
                      <FiMessageSquare
                        size={15}
                      />
                    </div>

                    <div className="ai-history-text">
                      <div className="ai-history-name">
                        {chat.title ||
                          "Percakapan baru"}
                      </div>

                      <div className="ai-history-meta">
                        {Array.isArray(
                          chat.messages
                        )
                          ? `${chat.messages.length} pesan`
                          : "Percakapan"}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="ai-delete"
                      onClick={(e) =>
                        handleDeleteHistory(
                          e,
                          chat,
                          index
                        )
                      }
                      aria-label="Hapus percakapan"
                    >
                      <FaTrash
                        size={11}
                      />
                    </button>
                  </div>
                );
              }
            )
          )}
        </div>

        {/* ==================================================
            BOTTOM
        ================================================== */}

        <div className="ai-sidebar-bottom">
          <div className="ai-user-card">
            <FaUserCircle
              size={32}
              className="ai-user-icon"
            />

            <div className="ai-user-info">
              <div className="ai-user-name">
                {user?.nama ||
                  "Belum Login"}
              </div>

              <div className="ai-user-email">
                {user?.email ||
                  "Masuk untuk menggunakan AI.Ind"}
              </div>
            </div>

            {user && (
              <FiCheck
                size={14}
                color="#00C2FF"
              />
            )}
          </div>

          {/* PENGATURAN */}

          <div
            className="ai-menu"
            onClick={() =>
              setSettingOpen(
                (prev) => !prev
              )
            }
          >
            <FaCog size={14} />

            <span
              style={{
                flex: 1,
              }}
            >
              Pengaturan
            </span>

            {settingOpen ? (
              <FiChevronUp
                size={14}
              />
            ) : (
              <FiChevronDown
                size={14}
              />
            )}
          </div>

          {settingOpen && (
            <div className="ai-submenu">
              <div
                className="ai-submenu-item"
                onClick={
                  handleChangeAccount
                }
              >
                <FaUserCircle
                  color="#00C2FF"
                />

                Ganti Akun
              </div>

              <div
                className="ai-submenu-item"
                style={{
                  color:
                    "#ff6b6b",
                }}
                onClick={
                  handleLogout
                }
              >
                <FaSignOutAlt />

                Keluar
              </div>
            </div>
          )}

          {/* ABOUT */}

          <div
            className="ai-menu ai-about"
            onClick={handleAbout}
          >
            <FiInfo size={15} />

            Tentang AI.Ind
          </div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;