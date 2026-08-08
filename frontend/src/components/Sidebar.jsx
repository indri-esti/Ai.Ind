import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
  FiMenu,
  FiPlus,
  FiMessageSquare,
  FiX,
} from "react-icons/fi";

import {
  FaTrash,
  FaCog,
  FaInfoCircle,
  FaSignOutAlt,
  FaUserCircle,
  FaGoogle,
} from "react-icons/fa";

import axios from "../api";

function Sidebar({
  messages,
  setMessages,
  history = [],
  setHistory,
  chatBaru,
  bukaChat,
  loadHistory,
}) {
  const navigate = useNavigate();

  const [profileOpen, setProfileOpen] = useState(false);
  const [user, setUser] = useState(null);

  const [mobile, setMobile] = useState(
    window.innerWidth < 768
  );

  const [settingOpen, setSettingOpen] = useState(false);

  const [open, setOpen] = useState(
    window.innerWidth >= 768
  );

  // =========================
  // AMBIL USER
  // =========================
  const ambilUser = () => {
    try {
      const data = localStorage.getItem("user");

      if (!data) {
        return null;
      }

      return JSON.parse(data);
    } catch (error) {
      console.log("User error:", error);
      return null;
    }
  };

  // =========================
  // EVENT USER BERUBAH
  // =========================
  const setCurrentUserEvent = () => {
    window.dispatchEvent(
      new Event("aiind-user-change")
    );
  };

  // =========================
  // LOAD USER
  // =========================
  useEffect(() => {
    setUser(ambilUser());
  }, []);

  // =========================
  // REFRESH USER / HISTORY
  // =========================
  useEffect(() => {
    const handleUserChange = () => {
      const currentUser = ambilUser();

      setUser(currentUser);

      if (loadHistory) {
        loadHistory();
      }
    };

    window.addEventListener(
      "storage",
      handleUserChange
    );

    window.addEventListener(
      "aiind-user-change",
      handleUserChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleUserChange
      );

      window.removeEventListener(
        "aiind-user-change",
        handleUserChange
      );
    };
  }, [loadHistory]);

  // =========================
  // RESPONSIVE
  // =========================
  useEffect(() => {
    const handleResize = () => {
      const isNowMobile =
        window.innerWidth < 768;

      setMobile(isNowMobile);

      if (isNowMobile) {
        setOpen(false);
      } else {
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

  // =========================
  // CLOSE SIDEBAR HP
  // =========================
  const closeMobileSidebar = () => {
    if (mobile) {
      setOpen(false);
    }
  };

  // =========================
  // CHAT BARU
  // =========================
  const handleChatBaru = () => {
    chatBaru();

    closeMobileSidebar();
  };

  // =========================
  // GANTI AKUN
  // =========================
  const handleChangeAccount = async () => {
    const result = await Swal.fire({
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

      customClass: {
        popup: "aiind-swal-popup",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    // Hanya hapus sesi login.
    // Data chat tetap berada di database.
    localStorage.removeItem("user");

    setUser(null);
    setMessages([]);

    if (setHistory) {
      setHistory([]);
    }

    setCurrentUserEvent();

    navigate("/login");
  };

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
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

      customClass: {
        popup: "aiind-swal-popup",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    // Jangan hapus data chat database.
    localStorage.removeItem("user");

    setUser(null);
    setMessages([]);

    if (setHistory) {
      setHistory([]);
    }

    setCurrentUserEvent();

    navigate("/login");
  };

  // =========================
  // ABOUT
  // =========================
  const handleAbout = () => {
    Swal.fire({
      title: "AI.Ind",

      html: `
        <div style="
          line-height:1.8;
          color:#9CB0C0;
        ">
          <strong style="
            color:#00C2FF;
            font-size:20px;
          ">
            AI.Ind
          </strong>
          <br>
          Buatan Indonesia 🇮🇩
          <br>
          <span style="font-size:13px;">
            Versi 1.0.0
          </span>
        </div>
      `,

      icon: "info",

      background: "#0B1D2A",
      color: "#fff",

      confirmButtonColor: "#00C2FF",

      customClass: {
        popup: "aiind-swal-popup",
      },
    });
  };

  // =========================
  // HAPUS CHAT DATABASE
  // =========================
  const handleDeleteChat = async (
    e,
    chat,
    index
  ) => {
    e.stopPropagation();

    if (!user?.id || !chat?.id) {
      return;
    }

    const result = await Swal.fire({
      title: "Hapus percakapan?",
      text: "Percakapan ini akan dihapus dari akunmu.",
      icon: "warning",

      background: "#0B1D2A",
      color: "#fff",

      showCancelButton: true,

      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",

      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#334155",

      customClass: {
        popup: "aiind-swal-popup",
      },
    });

    if (!result.isConfirmed) {
      return;
    }

    try {
      // Tetap menggunakan axios dari ../api
      // sehingga baseURL tetap:
      // https://Indr.pythonanywhere.com
      await axios.delete(
        `/chats/${chat.id}?user_id=${user.id}`
      );

      const data = [...history];

      data.splice(index, 1);

      setHistory(data);

      Swal.fire({
        title: "Terhapus",

        text: "Percakapan berhasil dihapus.",

        icon: "success",

        background: "#0B1D2A",
        color: "#fff",

        timer: 1200,
        showConfirmButton: false,

        customClass: {
          popup: "aiind-swal-popup",
        },
      });
    } catch (error) {
      console.error(
        "Delete Chat Error:",
        error
      );

      Swal.fire({
        title: "Gagal",

        text:
          error?.response?.data?.error ||
          "Percakapan tidak dapat dihapus.",

        icon: "error",

        background: "#0B1D2A",
        color: "#fff",

        confirmButtonColor: "#00C2FF",

        customClass: {
          popup: "aiind-swal-popup",
        },
      });
    }
  };

  // =========================
  // BUKA CHAT
  // =========================
  const handleOpenChat = (chat) => {
    if (bukaChat) {
      bukaChat(chat);
    }

    closeMobileSidebar();
  };

  return (
    <>
      {/* ================================================= */}
      {/* MOBILE MENU BUTTON */}
      {/* ================================================= */}

      {mobile && (
        <button
          onClick={() => setOpen(!open)}
          aria-label="Buka menu"
          style={{
            position: "fixed",
            top: "16px",
            left: "16px",

            zIndex: 1101,

            width: "46px",
            height: "46px",

            border:
              "1px solid rgba(0,194,255,.25)",

            borderRadius: "14px",

            background:
              "rgba(11,29,42,.92)",

            backdropFilter:
              "blur(16px)",

            WebkitBackdropFilter:
              "blur(16px)",

            color: "#00C2FF",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            cursor: "pointer",

            fontSize: "22px",

            boxShadow:
              "0 8px 30px rgba(0,0,0,.25)",
          }}
        >
          {open ? <FiX /> : <FiMenu />}
        </button>
      )}

      {/* ================================================= */}
      {/* MOBILE OVERLAY */}
      {/* ================================================= */}

      {mobile && open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: "fixed",
            inset: 0,

            background:
              "rgba(0,0,0,.55)",

            backdropFilter:
              "blur(3px)",

            WebkitBackdropFilter:
              "blur(3px)",

            zIndex: 1098,
          }}
        />
      )}

      {/* ================================================= */}
      {/* SIDEBAR */}
      {/* ================================================= */}

      <aside
        style={{
          position:
            mobile
              ? "fixed"
              : "relative",

          top: 0,

          left:
            mobile
              ? open
                ? 0
                : "-300px"
              : 0,

          width: "286px",

          maxWidth:
            "calc(100vw - 28px)",

          height: "100vh",

          background:
            "linear-gradient(180deg, #0B1D2A 0%, #081722 100%)",

          color: "#fff",

          transition:
            "left .28s cubic-bezier(.4,0,.2,1)",

          borderRight:
            "1px solid rgba(255,255,255,.07)",

          display: "flex",

          flexDirection: "column",

          zIndex: 1100,

          overflow: "hidden",

          boxSizing: "border-box",

          boxShadow: mobile
            ? "12px 0 40px rgba(0,0,0,.35)"
            : "none",
        }}
      >
        {/* ================================================= */}
        {/* HEADER */}
        {/* ================================================= */}

        <div
          style={{
            padding:
              mobile
                ? "78px 20px 18px"
                : "24px 20px 18px",

            flexShrink: 0,

            background:
              "linear-gradient(180deg, rgba(0,194,255,.035), transparent)",
          }}
        >
          {/* BRAND */}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                width: "46px",
                height: "46px",

                borderRadius: "15px",

                background:
                  "linear-gradient(135deg,#00C2FF,#0077FF)",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                fontSize: "22px",

                boxShadow:
                  "0 8px 25px rgba(0,194,255,.22)",
              }}
            >
              ✦
            </div>

            <div>
              <h3
                style={{
                  color: "#00C2FF",

                  fontWeight: "800",

                  margin: 0,

                  fontSize: "25px",

                  letterSpacing: "-.5px",
                }}
              >
                AI.Ind
              </h3>

              <div
                style={{
                  color: "#71879A",

                  fontSize: "11px",

                  marginTop: "2px",

                  letterSpacing: ".3px",
                }}
              >
                Buatan Indonesia 🇮🇩
              </div>
            </div>
          </div>

          {/* CHAT BARU */}

          <button
            onClick={handleChatBaru}
            style={{
              marginTop: "22px",

              width: "100%",

              boxSizing: "border-box",

              padding: "13px 14px",

              background:
                "linear-gradient(135deg,#00C2FF,#008CFF)",

              color: "#04121C",

              border: "none",

              borderRadius: "13px",

              fontWeight: "700",

              fontSize: "14px",

              display: "flex",

              alignItems: "center",

              justifyContent: "center",

              gap: "9px",

              cursor: "pointer",

              boxShadow:
                "0 8px 24px rgba(0,194,255,.16)",

              transition: ".2s",
            }}
          >
            <FiPlus size={19} />
            Chat Baru
          </button>
        </div>

        {/* ================================================= */}
        {/* RIWAYAT */}
        {/* ================================================= */}

        <div
          style={{
            flex: 1,

            overflowY: "auto",

            overflowX: "hidden",

            padding:
              "4px 14px 14px",

            minHeight: 0,

            scrollbarWidth: "thin",

            scrollbarColor:
              "#23445E transparent",
          }}
        >
          <div
            style={{
              display: "flex",

              alignItems: "center",

              justifyContent: "space-between",

              padding:
                "0 8px 10px",
            }}
          >
            <span
              style={{
                color: "#71879A",

                fontSize: "11px",

                fontWeight: "700",

                textTransform:
                  "uppercase",

                letterSpacing:
                  "1px",
              }}
            >
              Riwayat Chat
            </span>

            {history?.length > 0 && (
              <span
                style={{
                  color: "#466277",

                  fontSize: "10px",

                  background:
                    "rgba(255,255,255,.04)",

                  padding:
                    "3px 7px",

                  borderRadius: "20px",
                }}
              >
                {history.length}
              </span>
            )}
          </div>

          {/* EMPTY */}

          {!history ||
          history.length === 0 ? (
            <div
              style={{
                margin:
                  "8px 6px",

                padding:
                  "25px 14px",

                border:
                  "1px dashed rgba(255,255,255,.08)",

                borderRadius:
                  "14px",

                textAlign:
                  "center",
              }}
            >
              <FiMessageSquare
                size={24}
                color="#38566B"
              />

              <p
                style={{
                  color: "#71879A",

                  fontSize: "12px",

                  margin:
                    "10px 0 0",
                }}
              >
                Belum ada riwayat
              </p>
            </div>
          ) : (
            history.map(
              (chat, index) => (
                <div
                  key={chat.id}
                  style={{
                    width: "100%",

                    boxSizing:
                      "border-box",

                    background:
                      "rgba(18,43,60,.72)",

                    border:
                      "1px solid rgba(255,255,255,.045)",

                    borderRadius:
                      "13px",

                    padding:
                      "7px 7px 7px 10px",

                    display: "flex",

                    alignItems:
                      "center",

                    gap: "5px",

                    marginBottom:
                      "7px",

                    overflow:
                      "hidden",

                    transition:
                      ".2s",
                  }}
                >
                  {/* CHAT */}

                  <button
                    onClick={() =>
                      handleOpenChat(
                        chat
                      )
                    }
                    style={{
                      display:
                        "flex",

                      alignItems:
                        "center",

                      flex:
                        "1 1 auto",

                      minWidth: 0,

                      gap: "10px",

                      overflow:
                        "hidden",

                      background:
                        "transparent",

                      border: "none",

                      color: "#D8E6EF",

                      padding:
                        "7px 2px",

                      cursor:
                        "pointer",

                      textAlign:
                        "left",
                    }}
                  >
                    <div
                      style={{
                        width: "32px",
                        height: "32px",

                        flexShrink: 0,

                        borderRadius:
                          "10px",

                        background:
                          "rgba(0,194,255,.08)",

                        color:
                          "#00C2FF",

                        display:
                          "flex",

                        alignItems:
                          "center",

                        justifyContent:
                          "center",
                      }}
                    >
                      <FiMessageSquare
                        size={16}
                      />
                    </div>

                    <span
                      style={{
                        display:
                          "block",

                        flex:
                          "1 1 auto",

                        minWidth: 0,

                        overflow:
                          "hidden",

                        whiteSpace:
                          "nowrap",

                        textOverflow:
                          "ellipsis",

                        fontSize:
                          "13px",
                      }}
                    >
                      {chat.title ||
                        "Percakapan Baru"}
                    </span>
                  </button>

                  {/* DELETE */}

                  <button
                    onClick={(e) =>
                      handleDeleteChat(
                        e,
                        chat,
                        index
                      )
                    }
                    aria-label="Hapus chat"
                    style={{
                      flex:
                        "0 0 32px",

                      width:
                        "32px",

                      minWidth:
                        "32px",

                      height:
                        "32px",

                      padding: 0,

                      background:
                        "transparent",

                      border:
                        "none",

                      borderRadius:
                        "9px",

                      color:
                        "#71879A",

                      cursor:
                        "pointer",

                      display:
                        "flex",

                      alignItems:
                        "center",

                      justifyContent:
                        "center",

                      transition:
                        ".2s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color =
                        "#ff5c5c";

                      e.currentTarget.style.background =
                        "rgba(255,92,92,.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color =
                        "#71879A";

                      e.currentTarget.style.background =
                        "transparent";
                    }}
                  >
                    <FaTrash size={13} />
                  </button>
                </div>
              )
            )
          )}
        </div>

        {/* ================================================= */}
        {/* BOTTOM AREA */}
        {/* ================================================= */}

        <div
          style={{
            flexShrink: 0,

            padding:
              "12px 14px 16px",

            background:
              "rgba(6,18,28,.72)",

            borderTop:
              "1px solid rgba(255,255,255,.07)",

            boxShadow:
              "0 -8px 25px rgba(0,0,0,.12)",
          }}
        >
          {/* PROFILE */}

          <button
            onClick={() =>
              setProfileOpen(
                !profileOpen
              )
            }
            style={{
              width: "100%",

              display: "flex",

              alignItems:
                "center",

              gap: "11px",

              padding:
                "10px",

              borderRadius:
                "13px",

              background:
                "rgba(18,43,60,.75)",

              border:
                "1px solid rgba(255,255,255,.045)",

              color: "#fff",

              cursor:
                "pointer",

              textAlign:
                "left",
            }}
          >
            <FaUserCircle
              size={35}
              color="#00C2FF"
            />

            <div
              style={{
                flex: 1,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  fontWeight: "700",

                  fontSize: "13px",

                  overflow:
                    "hidden",

                  whiteSpace:
                    "nowrap",

                  textOverflow:
                    "ellipsis",
                }}
              >
                {user?.nama ||
                  "Belum Login"}
              </div>

              <div
                style={{
                  color: "#71879A",

                  fontSize: "10px",

                  marginTop:
                    "3px",

                  overflow:
                    "hidden",

                  whiteSpace:
                    "nowrap",

                  textOverflow:
                    "ellipsis",
                }}
              >
                {user?.email ||
                  "Masuk untuk menggunakan AI.Ind"}
              </div>
            </div>

            <span
              style={{
                color: "#71879A",
                fontSize: "16px",
              }}
            >
              {profileOpen
                ? "⌃"
                : "⌄"}
            </span>
          </button>

          {/* PROFILE MENU */}

          {profileOpen && (
            <div
              style={{
                marginTop:
                  "8px",

                padding:
                  "8px",

                background:
                  "rgba(18,43,60,.55)",

                border:
                  "1px solid rgba(255,255,255,.045)",

                borderRadius:
                  "12px",
              }}
            >
              {!user ? (
                <button
                  onClick={() =>
                    navigate(
                      "/login"
                    )
                  }
                  style={{
                    width: "100%",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      "10px",

                    padding:
                      "10px",

                    background:
                      "transparent",

                    border:
                      "none",

                    color:
                      "#fff",

                    cursor:
                      "pointer",

                    textAlign:
                      "left",

                    borderRadius:
                      "9px",
                  }}
                >
                  <FaGoogle
                    color="#00C2FF"
                  />

                  Login dengan Google
                </button>
              ) : (
                <button
                  onClick={
                    handleChangeAccount
                  }
                  style={{
                    width: "100%",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      "10px",

                    padding:
                      "10px",

                    background:
                      "transparent",

                    border:
                      "none",

                    color:
                      "#fff",

                    cursor:
                      "pointer",

                    textAlign:
                      "left",

                    borderRadius:
                      "9px",
                  }}
                >
                  <FaUserCircle
                    color="#00C2FF"
                  />

                  Ganti Akun
                </button>
              )}

              {user && (
                <button
                  onClick={
                    handleLogout
                  }
                  style={{
                    width: "100%",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    gap:
                      "10px",

                    padding:
                      "10px",

                    background:
                      "transparent",

                    border:
                      "none",

                    color:
                      "#ff6b6b",

                    cursor:
                      "pointer",

                    textAlign:
                      "left",

                    borderRadius:
                      "9px",
                  }}
                >
                  <FaSignOutAlt />

                  Keluar
                </button>
              )}
            </div>
          )}

          {/* SETTINGS */}

          <button
            onClick={() =>
              setSettingOpen(
                !settingOpen
              )
            }
            style={{
              width: "100%",

              display: "flex",

              alignItems:
                "center",

              gap:
                "10px",

              padding:
                "10px",

              marginTop:
                "8px",

              background:
                "transparent",

              border:
                "none",

              color:
                "#71879A",

              cursor:
                "pointer",

              textAlign:
                "left",

              borderRadius:
                "9px",
            }}
          >
            <FaCog />

            Pengaturan

            <span
              style={{
                marginLeft:
                  "auto",

                fontSize:
                  "15px",
              }}
            >
              {settingOpen
                ? "⌃"
                : "⌄"}
            </span>
          </button>

          {settingOpen && (
            <div
              style={{
                padding:
                  "5px 0 5px 30px",

                color:
                  "#71879A",

                fontSize:
                  "12px",

                lineHeight:
                  1.6,
              }}
            >
              Pengaturan akun dan sesi
              tersedia di menu profil.
            </div>
          )}

          {/* ABOUT */}

          <button
            onClick={handleAbout}
            style={{
              width: "100%",

              display:
                "flex",

              alignItems:
                "center",

              gap:
                "10px",

              padding:
                "10px",

              marginTop:
                "4px",

              background:
                "transparent",

              border:
                "none",

              borderTop:
                "1px solid rgba(255,255,255,.06)",

              color:
                "#71879A",

              cursor:
                "pointer",

              textAlign:
                "left",

              paddingTop:
                "13px",
            }}
          >
            <FaInfoCircle />

            Tentang AI.Ind
          </button>
        </div>
      </aside>

      {/* ================================================= */}
      {/* GLOBAL STYLE */}
      {/* ================================================= */}

      <style>
        {`
          .aiind-swal-popup {
            border: 1px solid rgba(0,194,255,.12) !important;
            border-radius: 18px !important;
            box-shadow: 0 20px 60px rgba(0,0,0,.45) !important;
          }

          @media (max-width: 767px) {
            .aiind-swal-popup {
              width: calc(100% - 32px) !important;
            }
          }

          button {
            -webkit-tap-highlight-color: transparent;
          }

          button:focus {
            outline: none;
          }

          aside::-webkit-scrollbar {
            width: 5px;
          }

          aside::-webkit-scrollbar-track {
            background: transparent;
          }

          aside::-webkit-scrollbar-thumb {
            background: #23445E;
            border-radius: 10px;
          }

          aside::-webkit-scrollbar-thumb:hover {
            background: #315D79;
          }
        `}
      </style>
    </>
  );
}

export default Sidebar;// update sidebar
