import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
  FiPlus,
  FiMessageSquare,
  FiChevronDown,
  FiChevronUp,
  FiX,
  FiInfo,
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

  // ==========================================
  // SWIPE
  // ==========================================

  const touchStartX = useRef(null);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    if (!mobile) return;

    const touch = e.touches[0];

    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  };

  const handleTouchMove = (e) => {
    if (!mobile || touchStartX.current === null) return;

    const touch = e.touches[0];

    const diffX =
      touch.clientX - touchStartX.current;

    const diffY =
      touch.clientY - touchStartY.current;

    // Abaikan kalau gerakannya lebih dominan vertikal
    if (Math.abs(diffY) > Math.abs(diffX)) {
      return;
    }

    // Dari kiri → kanan = buka
    if (
      !open &&
      touchStartX.current < 35 &&
      diffX > 55
    ) {
      setOpen(true);
      touchStartX.current = null;
      touchStartY.current = null;
    }

    // Kanan → kiri = tutup
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

  // ==========================================
  // USER KEY
  // ==========================================

  const getUserKey = (currentUser) => {
    if (!currentUser) return null;

    const identifier =
      currentUser.email ||
      currentUser.id ||
      currentUser.googleId ||
      currentUser.nama;

    if (!identifier) return null;

    return `history_${String(identifier).toLowerCase()}`;
  };

  // ==========================================
  // LOAD USER
  // ==========================================

  useEffect(() => {
    const loadUser = () => {
      try {
        const data =
          localStorage.getItem("user");

        if (!data) {
          setUser(null);
          return;
        }

        const parsed =
          JSON.parse(data);

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

    return () => {
      window.removeEventListener(
        "storage",
        loadUser
      );
    };
  }, []);

  // ==========================================
  // LOAD HISTORY SESUAI USER
  // ==========================================

  useEffect(() => {
    const userKey =
      getUserKey(user);

    if (!userKey) {
      setHistory([]);
      return;
    }

    try {
      const saved =
        localStorage.getItem(userKey);

      if (!saved) {
        setHistory([]);
        return;
      }

      const parsed =
        JSON.parse(saved);

      setHistory(
        Array.isArray(parsed)
          ? parsed
          : []
      );
    } catch (error) {
      console.log(
        "History error:",
        error
      );

      setHistory([]);
    }
  }, [user, setHistory]);

  // ==========================================
  // RESPONSIVE
  // ==========================================

  useEffect(() => {
    const handleResize = () => {
      const isNowMobile =
        window.innerWidth < 768;

      setMobile(isNowMobile);

      if (!isNowMobile) {
        setOpen(true);
      } else {
        setOpen(false);
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

  // ==========================================
  // TUTUP MOBILE
  // ==========================================

  const closeMobileSidebar = () => {
    if (mobile) {
      setOpen(false);
    }
  };

  // ==========================================
  // CHAT BARU
  // ==========================================

  const handleChatBaru = () => {
    if (typeof chatBaru === "function") {
      chatBaru();
    }

    closeMobileSidebar();
  };

  // ==========================================
  // LOAD CHAT
  // ==========================================

  const handleOpenChat = (chat) => {
    setMessages(
      Array.isArray(chat.messages)
        ? chat.messages
        : []
    );

    // Backend chat ID
    if (chat.chatId) {
      window.dispatchEvent(
        new CustomEvent(
          "aiind-load-chat",
          {
            detail: {
              chatId: chat.chatId,
            },
          }
        )
      );
    }

    closeMobileSidebar();
  };

  // ==========================================
  // DELETE HISTORY
  // ==========================================

  const handleDeleteHistory = (
    e,
    index
  ) => {
    e.stopPropagation();

    const newHistory =
      [...history];

    newHistory.splice(index, 1);

    setHistory(newHistory);

    const userKey =
      getUserKey(user);

    if (userKey) {
      try {
        localStorage.setItem(
          userKey,
          JSON.stringify(newHistory)
        );
      } catch (error) {
        console.log(
          "Gagal menghapus history:",
          error
        );
      }
    }
  };

  // ==========================================
  // CHANGE ACCOUNT
  // ==========================================

  const handleChangeAccount = () => {
    if (!user) {
      navigate("/login");
      return;
    }

    Swal.fire({
      title: "Ganti Akun?",
      text: "Kamu akan keluar dari akun saat ini.",
      icon: "warning",
      background: "#0B1D2A",
      color: "#fff",
      showCancelButton: true,
      confirmButtonText: "Ganti Akun",
      cancelButtonText: "Batal",
      confirmButtonColor: "#00C2FF",
      cancelButtonColor: "#334155",
      borderRadius: "18px",
    }).then((result) => {
      if (result.isConfirmed) {
        setMessages([]);
        setHistory([]);

        localStorage.removeItem(
          "user"
        );

        setUser(null);
        setSettingOpen(false);

        navigate("/login");
      }
    });
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const handleLogout = () => {
    Swal.fire({
      title: "Keluar Akun?",
      text: "Apakah kamu yakin ingin keluar?",
      icon: "warning",
      background: "#0B1D2A",
      color: "#fff",
      showCancelButton: true,
      confirmButtonText: "Keluar",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#334155",
      borderRadius: "18px",
    }).then((result) => {
      if (result.isConfirmed) {
        setMessages([]);
        setHistory([]);

        localStorage.removeItem(
          "user"
        );

        setUser(null);
        setSettingOpen(false);

        navigate("/login");
      }
    });
  };

  // ==========================================
  // ABOUT
  // ==========================================

  const handleAbout = () => {
    Swal.fire({
      title: "AI.Ind",
      html: `
        <div style="
          line-height:1.8;
          color:#A9C4D3;
        ">
          <strong style="color:#00C2FF">
            AI.Ind
          </strong>
          <br>
          Asisten AI buatan Indonesia 🇮🇩
          <br><br>
          <span style="color:#71899A">
            Teman cerdas untuk membantu
            belajar, mencari ide,
            pemrograman, dan berbagai
            aktivitas lainnya.
          </span>
          <br><br>
          <small style="color:#536B7D">
            Versi 1.0.0
          </small>
        </div>
      `,
      icon: "info",
      background: "#0B1D2A",
      color: "#fff",
      confirmButtonColor: "#00C2FF",
      borderRadius: "18px",
    });
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <>
      <style>
        {`
          .ai-sidebar {
            width: 274px;
            height: 100dvh;
            flex-shrink: 0;
            background:
              linear-gradient(
                180deg,
                #0A1B28 0%,
                #07151F 100%
              );
            border-right:
              1px solid rgba(255,255,255,.07);
            display: flex;
            flex-direction: column;
            position: relative;
            z-index: 1000;
            overflow: hidden;
          }

          .ai-sidebar-top {
            padding: 22px 18px 16px;
          }

          .ai-brand {
            display: flex;
            align-items: center;
            gap: 12px;
          }

          .ai-brand-logo {
            width: 46px;
            height: 46px;
            border-radius: 14px;
            object-fit: cover;
            box-shadow:
              0 8px 28px rgba(0,194,255,.14);
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
          }

          .ai-new-chat {
            width: 100%;
            margin-top: 22px;
            padding: 12px 15px;
            border: 1px solid rgba(0,194,255,.18);
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
            transition: .2s ease;
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
            transform: translateY(-1px);
          }

          .ai-new-chat-icon {
            width: 28px;
            height: 28px;
            border-radius: 9px;
            background: #00C2FF;
            color: #06131C;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .ai-history {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            padding: 4px 12px 15px;
            scrollbar-width: thin;
            scrollbar-color:
              #1C3849 transparent;
          }

          .ai-history-title {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 7px 9px;
            color: #60798B;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 1.2px;
            text-transform: uppercase;
          }

          .ai-history-count {
            min-width: 20px;
            padding: 3px 6px;
            border-radius: 20px;
            background: rgba(255,255,255,.04);
            color: #587285;
            text-align: center;
            font-size: 10px;
          }

          .ai-empty {
            padding: 32px 15px;
            text-align: center;
            color: #4F697B;
          }

          .ai-empty-icon {
            width: 44px;
            height: 44px;
            margin: 0 auto 11px;
            border-radius: 14px;
            background: rgba(0,194,255,.06);
            color: #00C2FF;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .ai-empty p {
            margin: 0;
            font-size: 12px;
          }

          .ai-empty small {
            display: block;
            margin-top: 5px;
            color: #3E5667;
            font-size: 10px;
          }

          .ai-history-item {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 7px;
            margin-bottom: 4px;
            border-radius: 13px;
            border: 1px solid transparent;
            background: transparent;
            cursor: pointer;
            transition: .18s ease;
          }

          .ai-history-item:hover {
            background: rgba(255,255,255,.035);
            border-color:
              rgba(255,255,255,.045);
          }

          .ai-history-icon {
            width: 34px;
            height: 34px;
            min-width: 34px;
            border-radius: 10px;
            background: rgba(0,194,255,.07);
            color: #00C2FF;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .ai-history-text {
            flex: 1;
            min-width: 0;
          }

          .ai-history-name {
            color: #D8EAF2;
            font-size: 12px;
            line-height: 1.35;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .ai-history-meta {
            margin-top: 3px;
            color: #506A7B;
            font-size: 9px;
          }

          .ai-delete {
            width: 28px;
            height: 28px;
            border: 0;
            border-radius: 9px;
            background: transparent;
            color: #506979;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transition: .18s ease;
          }

          .ai-history-item:hover .ai-delete {
            opacity: 1;
          }

          .ai-delete:hover {
            background: rgba(239,68,68,.1);
            color: #ff6b6b;
          }

          .ai-sidebar-bottom {
            flex-shrink: 0;
            padding: 12px;
            border-top:
              1px solid rgba(255,255,255,.06);
            background:
              rgba(5,14,21,.35);
          }

          .ai-user-card {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px;
            border-radius: 13px;
            background: rgba(255,255,255,.025);
            border:
              1px solid rgba(255,255,255,.045);
          }

          .ai-user-icon {
            color: #00C2FF;
            flex-shrink: 0;
          }

          .ai-user-info {
            min-width: 0;
            flex: 1;
          }

          .ai-user-name {
            color: #EAF8FF;
            font-size: 12px;
            font-weight: 700;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .ai-user-email {
            margin-top: 2px;
            color: #60798B;
            font-size: 9px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }

          .ai-menu {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 8px;
            margin-top: 5px;
            border-radius: 10px;
            color: #71899A;
            font-size: 12px;
            cursor: pointer;
            transition: .18s ease;
          }

          .ai-menu:hover {
            background: rgba(255,255,255,.035);
            color: #C9E5F0;
          }

          .ai-submenu {
            margin-left: 24px;
            margin-bottom: 3px;
          }

          .ai-submenu-item {
            display: flex;
            align-items: center;
            gap: 9px;
            padding: 8px;
            border-radius: 9px;
            color: #8197A6;
            font-size: 11px;
            cursor: pointer;
          }

          .ai-submenu-item:hover {
            background: rgba(255,255,255,.035);
            color: #fff;
          }

          .ai-about {
            border-top:
              1px solid rgba(255,255,255,.05);
            padding-top: 9px;
            margin-top: 3px;
          }

          .ai-mobile-close {
            display: none;
          }

          @media (max-width: 767px) {
            .ai-sidebar {
              position: fixed;
              top: 0;
              left: 0;
              width: min(290px, 82vw);
              transform:
                translateX(
                  ${open ? "0" : "-105%"}
                );
              transition:
                transform .28s cubic-bezier(.22,.61,.36,1);
              box-shadow:
                ${open
                  ? "12px 0 45px rgba(0,0,0,.38)"
                  : "none"};
              touch-action: pan-y;
            }

            .ai-mobile-close {
              width: 30px;
              height: 30px;
              border: 0;
              border-radius: 9px;
              background: rgba(255,255,255,.04);
              color: #7690A1;
              display: flex;
              align-items: center;
              justify-content: center;
              cursor: pointer;
            }

            .ai-brand-row {
              display: flex;
              align-items: center;
              justify-content: space-between;
            }

            .ai-delete {
              opacity: 1;
            }
          }
        `}
      </style>

      {/* AREA SWIPE */}
      {mobile && (
        <div
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: open ? "100%" : "38px",
            height: "100%",
            zIndex: open ? 997 : 997,
            pointerEvents: open
              ? "none"
              : "auto",
            touchAction: "pan-y",
          }}
        />
      )}

      {/* OVERLAY */}
      {mobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,.48)",
            backdropFilter: "blur(3px)",
            zIndex: 998,
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className="ai-sidebar"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* TOP */}
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
                  AI<span>.Ind</span>
                </h2>

                <div className="ai-brand-sub">
                  Asisten AI buatan Indonesia 🇮🇩
                </div>
              </div>
            </div>

            {mobile && (
              <button
                className="ai-mobile-close"
                onClick={() => setOpen(false)}
                aria-label="Tutup sidebar"
              >
                <FiX size={17} />
              </button>
            )}
          </div>

          <button
            className="ai-new-chat"
            onClick={handleChatBaru}
          >
            <span className="ai-new-chat-icon">
              <FiPlus size={17} />
            </span>

            <span>Percakapan baru</span>
          </button>
        </div>

        {/* HISTORY */}
        <div className="ai-history">
          <div className="ai-history-title">
            <span>Riwayat percakapan</span>

            {history.length > 0 && (
              <span className="ai-history-count">
                {history.length}
              </span>
            )}
          </div>

          {!history ||
          history.length === 0 ? (
            <div className="ai-empty">
              <div className="ai-empty-icon">
                <FiMessageSquare size={20} />
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
            history.map(
              (chat, index) => (
                <div
                  key={
                    chat.id ||
                    `${chat.title}-${index}`
                  }
                  className="ai-history-item"
                  onClick={() =>
                    handleOpenChat(chat)
                  }
                >
                  <div className="ai-history-icon">
                    <FiMessageSquare size={15} />
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
                    className="ai-delete"
                    onClick={(e) =>
                      handleDeleteHistory(
                        e,
                        index
                      )
                    }
                    aria-label="Hapus percakapan"
                  >
                    <FaTrash size={11} />
                  </button>
                </div>
              )
            )
          )}
        </div>

        {/* BOTTOM */}
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
          </div>

          <div
            className="ai-menu"
            onClick={() =>
              setSettingOpen(
                !settingOpen
              )
            }
          >
            <FaCog size={14} />

            <span style={{ flex: 1 }}>
              Pengaturan
            </span>

            {settingOpen ? (
              <FiChevronUp size={14} />
            ) : (
              <FiChevronDown size={14} />
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
                  color: "#ff6b6b",
                }}
                onClick={handleLogout}
              >
                <FaSignOutAlt />
                Keluar
              </div>
            </div>
          )}

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

