import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
FiMenu,
FiPlus,
FiMessageSquare,
FiChevronDown,
FiChevronUp,
} from "react-icons/fi";

import {
FaTrash,
FaCog,
FaInfoCircle,
FaSignOutAlt,
FaUserCircle,
FaGoogle,
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

const isMobile = window.innerWidth < 768;

const [mobile, setMobile] = useState(isMobile);
const [settingOpen, setSettingOpen] = useState(false);
const [open, setOpen] = useState(!isMobile);

const skipSaveRef = useRef(false);

console.log("SIDEBAR AKTIF");

// ==================================================
// LOGO AI.IND
// ==================================================
const Logo = ({ size = 48 }) => (
<svg
xmlns="http://www.w3.org/2000/svg"
viewBox="0 0 512 512"
width={size}
height={size}
style={{
display: "block",
borderRadius: "14px",
flexShrink: 0,
}}
>
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0%" stopColor="#0B1B2B" />
<stop offset="100%" stopColor="#07111D" />
</linearGradient>

    <linearGradient id="cyan" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stopColor="#18D8FF" />
      <stop offset="100%" stopColor="#008FE8" />
    </linearGradient>

    <filter
      id="glow"
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
    fill="url(#bg)"
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
    fill="url(#cyan)"
  />

  <circle
    cx="256"
    cy="98"
    r="9"
    fill="#18D8FF"
    filter="url(#glow)"
  />

  <rect
    x="137"
    y="145"
    width="238"
    height="190"
    rx="58"
    fill="url(#cyan)"
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
    d="M190 365
       C190 345 206 332 226 332
       H286
       C306 332 322 345 322 365
       V382
       H190Z"
    fill="url(#cyan)"
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

);

// ==================================================
// KEY RIWAYAT PER AKUN
// ==================================================
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

// ==================================================
// AMBIL USER
// ==================================================
useEffect(() => {
const loadUser = () => {
try {
const data = localStorage.getItem("user");

    if (data) {
      const parsedUser = JSON.parse(data);
      setUser(parsedUser);
    } else {
      setUser(null);
    }
  } catch (err) {
    console.log("User error:", err);
    setUser(null);
  }
};

loadUser();

const handleStorage = () => {
  loadUser();
};

window.addEventListener("storage", handleStorage);

return () => {
  window.removeEventListener("storage", handleStorage);
};

}, []);

// ==================================================
// LOAD RIWAYAT SESUAI AKUN
// ==================================================
useEffect(() => {
const userKey = getUserKey(user);

skipSaveRef.current = true;

if (!userKey) {
  setHistory([]);
  return;
}

try {
  const savedHistory = localStorage.getItem(userKey);

  if (savedHistory) {
    const parsedHistory = JSON.parse(savedHistory);

    if (Array.isArray(parsedHistory)) {
      setHistory(parsedHistory);
    } else {
      setHistory([]);
    }
  } else {
    setHistory([]);
  }
} catch (err) {
  console.log("History error:", err);
  setHistory([]);
}

setTimeout(() => {
  skipSaveRef.current = false;
}, 0);

}, [user]);

// ==================================================
// SIMPAN RIWAYAT SESUAI AKUN
// ==================================================
useEffect(() => {
const userKey = getUserKey(user);

if (!userKey) return;

if (skipSaveRef.current) return;

try {
  localStorage.setItem(
    userKey,
    JSON.stringify(
      Array.isArray(history) ? history : []
    )
  );
} catch (err) {
  console.log("Gagal menyimpan history:", err);
}

}, [history, user]);

// ==================================================
// RESPONSIVE
// ==================================================
useEffect(() => {
const handleResize = () => {
const isNowMobile = window.innerWidth < 768;

  setMobile(isNowMobile);

  setOpen((prev) => {
    if (isNowMobile) return false;
    return true;
  });
};

window.addEventListener("resize", handleResize);

return () => {
  window.removeEventListener("resize", handleResize);
};

}, []);

// ==================================================
// TUTUP SIDEBAR SAAT PILIH CHAT DI HP
// ==================================================
const closeMobileSidebar = () => {
if (mobile) {
setOpen(false);
}
};

// ==================================================
// GANTI AKUN
// ==================================================
const handleChangeAccount = () => {
Swal.fire({
title: "Ganti Akun?",
text: "Kamu akan keluar dari akun saat ini.",
icon: "warning",
background: "#122B3C",
color: "#fff",
showCancelButton: true,
confirmButtonText: "Ganti Akun",
cancelButtonText: "Batal",
confirmButtonColor: "#00C2FF",
cancelButtonColor: "#ef4444",
borderRadius: "16px",
}).then((result) => {
if (result.isConfirmed) {
setMessages([]);
setHistory([]);

    localStorage.removeItem("user");

    setUser(null);
    setSettingOpen(false);

    navigate("/login");
  }
});

};

// ==================================================
// LOGOUT
// ==================================================
const handleLogout = () => {
Swal.fire({
title: "Keluar Akun?",
text: "Apakah kamu yakin ingin keluar?",
icon: "warning",
background: "#122B3C",
color: "#fff",
showCancelButton: true,
confirmButtonText: "Keluar",
cancelButtonText: "Batal",
confirmButtonColor: "#ef4444",
cancelButtonColor: "#475569",
borderRadius: "16px",
}).then((result) => {
if (result.isConfirmed) {
setMessages([]);
setHistory([]);

    localStorage.removeItem("user");

    setUser(null);
    setSettingOpen(false);

    navigate("/login");
  }
});

};

// ==================================================
// CHAT BARU
// ==================================================
const handleChatBaru = () => {
if (typeof chatBaru === "function") {
chatBaru();
}

closeMobileSidebar();

};

// ==================================================
// HAPUS RIWAYAT
// ==================================================
const handleDeleteHistory = (e, index) => {
e.stopPropagation();

const newHistory = [...history];
newHistory.splice(index, 1);

setHistory(newHistory);

const userKey = getUserKey(user);

if (userKey) {
  try {
    localStorage.setItem(
      userKey,
      JSON.stringify(newHistory)
    );
  } catch (err) {
    console.log("Gagal menghapus history:", err);
  }
}

};

// ==================================================
// TENTANG
// ==================================================
const handleAbout = () => {
  Swal.fire({
    title: "AI.Ind",
    html: `
      <div style="line-height:1.7">
        <b>AI.Ind</b><br>
        Buatan Indonesia 🇮🇩<br><br>
        <span style="color:#8A9BB5">
          Asisten AI untuk membantu aktivitasmu.
        </span><br><br>
        Versi 1.0.0
      </div>
    `,
    icon: "info",
    background: "#122B3C",
    color: "#fff",
    confirmButtonColor: "#00C2FF",
    borderRadius: "16px",
  });
};


// ==================================================
// RENDER
// ==================================================
return (
<>
{/* TOMBOL MENU HP */}
{mobile && (
<button
onClick={() => setOpen(!open)}
aria-label="Buka menu"
style={{
position: "fixed",
top: "18px",
left: "18px",
zIndex: 1001,
background: "#00C2FF",
color: "#081420",
border: "none",
borderRadius: "12px",
width: "46px",
height: "46px",
cursor: "pointer",
fontSize: "22px",
display: "flex",
alignItems: "center",
justifyContent: "center",
boxShadow: "0 6px 20px rgba(0,194,255,.25)",
}}
>
<FiMenu />
</button>
)}

  {/* OVERLAY HP */}
  {mobile && open && (
    <div
      onClick={() => setOpen(false)}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,.55)",
        backdropFilter: "blur(2px)",
        zIndex: 998,
      }}
    />
  )}

  {/* SIDEBAR */}
  <div
    style={{
      position: mobile ? "fixed" : "relative",
      top: 0,
      left: mobile
        ? open
          ? 0
          : "-280px"
        : 0,
      width: "260px",
      height: "100vh",
      background:
        "linear-gradient(180deg, #0B1D2A 0%, #091923 100%)",
      color: "#fff",
      transition: ".3s ease",
      borderRight: "1px solid #1B3445",
      display: "flex",
      flexDirection: "column",
      zIndex: 999,
      overflow: "hidden",
      boxShadow:
        mobile && open
          ? "8px 0 30px rgba(0,0,0,.25)"
          : "none",
    }}
  >
    {/* BAGIAN ATAS */}
    <div
      style={{
        padding: "22px",
        paddingBottom: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "11px",
          marginTop: mobile ? "55px" : "0",
        }}
      >
        <Logo size={50} />

        <div>
          <h3
            style={{
              color: "#00C2FF",
              fontWeight: "800",
              margin: 0,
              fontSize: "24px",
              letterSpacing: ".2px",
            }}
          >
            AI.Ind
          </h3>

          <small
            style={{
              color: "#8A9BB5",
              fontSize: "12px",
            }}
          >
            Buatan Indonesia 🇮🇩
          </small>
        </div>
      </div>

      <button
        onClick={handleChatBaru}
        style={{
          marginTop: "22px",
          width: "100%",
          padding: "12px 14px",
          background:
            "linear-gradient(135deg,#00C2FF,#009FE3)",
          color: "#081420",
          border: "none",
          borderRadius: "11px",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "9px",
          cursor: "pointer",
          boxShadow:
            "0 5px 18px rgba(0,194,255,.16)",
        }}
      >
        <FiPlus size={18} />
        Chat Baru
      </button>
    </div>

    {/* RIWAYAT */}
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        overflowX: "hidden",
        padding: "0 18px 12px",
        minHeight: 0,
        scrollbarWidth: "thin",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "4px 4px 10px",
        }}
      >
        <p
          style={{
            color: "#8A9BB5",
            fontSize: "12px",
            fontWeight: "700",
            margin: 0,
            textTransform: "uppercase",
            letterSpacing: ".7px",
          }}
        >
          Riwayat Chat
        </p>

        {history && history.length > 0 && (
          <span
            style={{
              fontSize: "11px",
              color: "#60788D",
            }}
          >
            {history.length}
          </span>
        )}
      </div>

      {!history || history.length === 0 ? (
        <div
          style={{
            padding: "24px 12px",
            textAlign: "center",
            color: "#61798D",
          }}
        >
          <FiMessageSquare
            size={28}
            style={{
              opacity: 0.5,
              marginBottom: "8px",
            }}
          />

          <p
            style={{
              fontSize: "13px",
              margin: 0,
            }}
          >
            Belum ada riwayat
          </p>

          <small
            style={{
              display: "block",
              marginTop: "5px",
              fontSize: "11px",
            }}
          >
            Percakapanmu akan muncul di sini
          </small>
        </div>
      ) : (
        history.map((chat, index) => (
          <div
            key={
              chat.id ||
              `${chat.title}-${index}`
            }
            style={{
              background:
                "linear-gradient(135deg,#122B3C,#102736)",
              borderRadius: "11px",
              padding: "10px",
              display: "flex",
              alignItems: "center",
              marginBottom: "8px",
              cursor: "pointer",
              transition: ".2s",
              border:
                "1px solid rgba(255,255,255,.035)",
            }}
          >
            <div
              onClick={() => {
                setMessages(
                  Array.isArray(chat.messages)
                    ? chat.messages
                    : []
                );

                closeMobileSidebar();
              }}
              style={{
                display: "flex",
                alignItems: "center",
                flex: 1,
                minWidth: 0,
                gap: "10px",
              }}
            >
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  minWidth: "32px",
                  borderRadius: "9px",
                  background:
                    "rgba(0,194,255,.08)",
                  color: "#00C2FF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <FiMessageSquare size={15} />
              </div>

              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  color: "#E7F3FA",
                  fontSize: "13px",
                }}
              >
                {chat.title ||
                  "Percakapan baru"}
              </span>
            </div>

            <button
              onClick={(e) =>
                handleDeleteHistory(
                  e,
                  index
                )
              }
              aria-label="Hapus riwayat"
              style={{
                width: "30px",
                height: "30px",
                borderRadius: "8px",
                background: "transparent",
                border: "none",
                color: "#71899A",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: ".2s",
              }}
            >
              <FaTrash size={13} />
            </button>
          </div>
        ))
      )}
    </div>

    {/* MENU BAWAH */}
    <div
      style={{
        flexShrink: 0,
        padding: "14px 18px 16px",
        background: "#0B1D2A",
        borderTop: "1px solid #1B3445",
        boxShadow:
          "0 -5px 18px rgba(0,0,0,.15)",
      }}
    >
      {/* PROFIL - TANPA DROPDOWN */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "11px",
          marginBottom: "8px",
          padding: "11px",
          borderRadius: "12px",
          background: "#122B3C",
          border:
            "1px solid rgba(255,255,255,.035)",
        }}
      >
        <FaUserCircle
          size={34}
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
              fontWeight: "600",
              fontSize: "14px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {user?.nama || "Belum Login"}
          </div>

          <small
            style={{
              color: "#8A9BB5",
              fontSize: "11px",
              display: "block",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
            }}
          >
            {user?.email ||
              "Masuk untuk menggunakan AI.Ind"}
          </small>
        </div>
      </div>

      {/* PENGATURAN */}
      <div
        onClick={() =>
          setSettingOpen(!settingOpen)
        }
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "9px 10px",
          color: "#8A9BB5",
          cursor: "pointer",
          borderRadius: "9px",
        }}
      >
        <FaCog />

        <span style={{ flex: 1 }}>
          Pengaturan
        </span>

        {settingOpen ? (
          <FiChevronUp size={15} />
        ) : (
          <FiChevronDown size={15} />
        )}
      </div>

      {settingOpen && (
        <div
          style={{
            marginLeft: "18px",
            marginTop: "5px",
            marginBottom: "5px",
            display: "flex",
            flexDirection: "column",
            gap: "5px",
          }}
        >
          {!user ? (
            <div
              onClick={() =>
                navigate("/login")
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px",
                borderRadius: "8px",
                cursor: "pointer",
                color: "#fff",
                fontSize: "13px",
              }}
            >
              <FaGoogle color="#4285F4" />
              Login dengan Google
            </div>
          ) : (
            <div
              onClick={handleChangeAccount}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "8px",
                borderRadius: "8px",
                cursor: "pointer",
                color: "#fff",
                fontSize: "13px",
              }}
            >
              <FaUserCircle color="#00C2FF" />
              Ganti Akun
            </div>
          )}

          <div
            onClick={handleLogout}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "8px",
              borderRadius: "8px",
              cursor: "pointer",
              color: "#ff6b6b",
              fontSize: "13px",
            }}
          >
            <FaSignOutAlt />
            Keluar
          </div>
        </div>
      )}

      {/* TENTANG */}
      <div
        onClick={handleAbout}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          padding: "11px 10px 4px",
          marginTop: "5px",
          color: "#8A9BB5",
          cursor: "pointer",
          flexShrink: 0,
          position: "relative",
          zIndex: 5,
          borderTop:
            "1px solid rgba(255,255,255,.07)",
        }}
      >
        <FaInfoCircle />
        Tentang AI.Ind
      </div>
    </div>
  </div>
</>

);
}

export default Sidebar;