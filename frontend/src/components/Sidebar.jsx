import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
  FiMenu,
  FiPlus,
  FiMessageSquare,
  FiX,
  FiChevronDown,
  FiSettings,
  FiInfo,
  FiUser,
} from "react-icons/fi";

import {
  FaTrash,
  FaSignOutAlt,
  FaUserCircle,
} from "react-icons/fa";

import axios from "../api";

function Logo({ size = 46 }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background:
          "linear-gradient(135deg,#18D8FF,#008FE8)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#07111D",
        fontSize: size * 0.52,
        boxShadow:
          "0 0 24px rgba(0,194,255,.2)",
        flexShrink: 0,
      }}
    >
      🤖
    </div>
  );
}

function Sidebar({
  history = [],
  setHistory,
  chatBaru,
  bukaChat,
  loadHistory,
}) {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [settingOpen, setSettingOpen] = useState(false);

  const [mobile, setMobile] = useState(
    window.innerWidth < 768
  );

  const [open, setOpen] = useState(
    window.innerWidth >= 768
  );

  const getUser = () => {
    try {
      const data = localStorage.getItem("user");
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setUser(getUser());

    const userChange = () => {
      setUser(getUser());
      loadHistory?.();
    };

    window.addEventListener(
      "aiind-user-change",
      userChange
    );

    return () =>
      window.removeEventListener(
        "aiind-user-change",
        userChange
      );
  }, []);

  useEffect(() => {
    const resize = () => {
      const isMobile = window.innerWidth < 768;

      setMobile(isMobile);
      setOpen(!isMobile);
    };

    window.addEventListener("resize", resize);

    return () =>
      window.removeEventListener("resize", resize);
  }, []);

  const closeMobile = () => {
    if (mobile) setOpen(false);
  };

  const handleNewChat = () => {
    chatBaru?.();
    closeMobile();
  };

  const logout = async () => {
    const result = await Swal.fire({
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
    });

    if (!result.isConfirmed) return;

    localStorage.removeItem("user");
    setUser(null);
    setHistory?.([]);

    window.dispatchEvent(
      new Event("aiind-user-change")
    );

    navigate("/login");
  };

  const deleteChat = async (e, chat, index) => {
    e.stopPropagation();

    if (!user?.id || !chat?.id) return;

    const result = await Swal.fire({
      title: "Hapus percakapan?",
      text: "Percakapan ini akan dihapus.",
      icon: "warning",
      background: "#0B1D2A",
      color: "#fff",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#334155",
    });

    if (!result.isConfirmed) return;

    try {
      await axios.delete(
        `/chats/${chat.id}?user_id=${user.id}`
      );

      const next = [...history];
      next.splice(index, 1);
      setHistory?.(next);
    } catch (error) {
      Swal.fire({
        title: "Gagal",
        text:
          error.response?.data?.error ||
          "Chat tidak dapat dihapus.",
        icon: "error",
        background: "#0B1D2A",
        color: "#fff",
        confirmButtonColor: "#00C2FF",
      });
    }
  };

  const about = () => {
    Swal.fire({
      title: "AI.Ind",
      html: `
        <div style="color:#9CB0C0;line-height:1.8">
          <div style="font-size:55px">🤖</div>
          <b style="color:#00C2FF;font-size:20px">
            AI.Ind
          </b>
          <br/>
          Buatan Indonesia 🇮🇩
          <br/>
          <small>Asisten AI Indonesia</small>
          <br/>
          <small>Versi 1.0.0</small>
        </div>
      `,
      background: "#0B1D2A",
      color: "#fff",
      confirmButtonColor: "#00C2FF",
    });
  };

  return (
    <>
      {mobile && (
        <button
          className="aiind-menu-button"
          onClick={() => setOpen(!open)}
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      )}

      {mobile && open && (
        <div
          className="aiind-overlay"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`aiind-sidebar ${
          open ? "open" : ""
        }`}
      >
        <div className="aiind-sidebar-header">
          <div className="aiind-brand">
            <Logo size={48} />

            <div>
              <h2>AI.Ind</h2>
              <small>Buatan Indonesia 🇮🇩</small>
            </div>
          </div>

          <button
            className="aiind-new-chat"
            onClick={handleNewChat}
          >
            <FiPlus size={19} />
            Chat Baru
          </button>
        </div>

        <div className="aiind-history">
          <div className="aiind-history-title">
            <span>Riwayat Chat</span>

            {history.length > 0 && (
              <small>{history.length}</small>
            )}
          </div>

          {history.length === 0 ? (
            <div className="aiind-empty-history">
              <FiMessageSquare size={22} />
              <span>Belum ada percakapan</span>
            </div>
          ) : (
            history.map((chat, index) => (
              <div
                key={chat.id || index}
                className="aiind-history-item"
                onClick={() => {
                  bukaChat?.(chat);
                  closeMobile();
                }}
              >
                <FiMessageSquare />

                <span>
                  {chat.title ||
                    chat.name ||
                    chat.messages?.[0]
                      ?.content ||
                    "Percakapan baru"}
                </span>

                <button
                  onClick={(e) =>
                    deleteChat(e, chat, index)
                  }
                >
                  <FaTrash />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="aiind-sidebar-bottom">
          <div
            className="aiind-profile"
            onClick={() =>
              setProfileOpen(!profileOpen)
            }
          >
            <FaUserCircle size={34} />

            <div>
              <b>
                {user?.nama ||
                  user?.name ||
                  "Belum Login"}
              </b>

              <small>
                {user?.email || "Masuk dengan akun"}
              </small>
            </div>

            <FiChevronDown
              className={
                profileOpen ? "rotate" : ""
              }
            />
          </div>

          {profileOpen && (
            <div className="aiind-profile-menu">
              {!user ? (
                <button
                  onClick={() =>
                    navigate("/login")
                  }
                >
                  <FiUser />
                  Masuk
                </button>
              ) : (
                <button onClick={logout}>
                  <FaSignOutAlt />
                  Keluar
                </button>
              )}
            </div>
          )}

          <button
            className="aiind-bottom-button"
            onClick={() =>
              setSettingOpen(!settingOpen)
            }
          >
            <FiSettings />
            Pengaturan
          </button>

          {settingOpen && (
            <div className="aiind-setting">
              <button onClick={about}>
                <FiInfo />
                Tentang AI.Ind
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

export default Sidebar;