import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import {
  FiMenu,
  FiPlus,
  FiMessageSquare,
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
  

const [profileOpen, setProfileOpen] = useState(false);

console.log("SIDEBAR AKTIF");

  const navigate = useNavigate();


  const [user, setUser] = useState(null);


  const isMobile = window.innerWidth < 768;

const [mobile, setMobile] = useState(isMobile);

  const [settingOpen, setSettingOpen] = useState(false);

  const [open, setOpen] = useState(!isMobile);



  // ambil user aman
  useEffect(() => {

    try {
      const data = localStorage.getItem("user");

      if(data){
        setUser(JSON.parse(data));
      }

    } catch(err){
      console.log("User error:", err);
      setUser(null);
    }

  }, []);



  // responsive
  useEffect(() => {
  const handleResize = () => {
    const isNowMobile = window.innerWidth < 768;

    setMobile(isNowMobile);

    // hanya ubah otomatis saat berpindah desktop <-> mobile
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



const handleChangeAccount = () => {

 Swal.fire({

    title:"Ganti Akun?",

    text:"Kamu akan keluar dari akun saat ini.",

    icon:"warning",

    background:"#122B3C",

    color:"#fff",

    showCancelButton:true,

    confirmButtonText:"Ganti Akun",

    cancelButtonText:"Batal",

    confirmButtonColor:"#00C2FF",

    cancelButtonColor:"#ef4444"

 }).then((result)=>{


    if(result.isConfirmed){

      localStorage.removeItem("user");

      setUser(null);


      navigate("/login");

    }


 });


};



const handleLogout = () => {


 Swal.fire({

 title:"Keluar Akun?",

 text:"Apakah kamu yakin?",

 icon:"warning",

 background:"#122B3C",

 color:"#fff",

 showCancelButton:true,

 confirmButtonText:"Keluar",

 cancelButtonText:"Batal",

 confirmButtonColor:"#ef4444"


 }).then((result)=>{


 if(result.isConfirmed){

   localStorage.removeItem("user");

   setUser(null);


   navigate("/login");

 }


 });


};



const handleAbout = ()=>{

 Swal.fire({

 title:"AI.Ind",

 html:`
 <b>AI.Ind</b><br>
 Buatan Indonesia 🇮🇩<br><br>
 Versi 1.0.0
 `,

 icon:"info",

 background:"#122B3C",

 color:"#fff"

 });

};

  return (
  <>
    {/* Tombol Menu */}
    {mobile && (
      <button
        onClick={() => setOpen(!open)}
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
          boxShadow: "0 4px 15px rgba(0,194,255,.25)",
        }}
      >
        <FiMenu />
      </button>
    )}

    {/* Overlay HP */}
    {mobile && open && (
      <div
        onClick={() => setOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,.45)",
          zIndex: 998,
        }}
      />
    )}

    {/* Sidebar */}
   <div
style={{
  position: mobile ? "fixed" : "relative",
  top: 0,
  left: mobile ? (open ? 0 : "-270px") : 0,
  width: "260px",
  height: "100vh",
  background: "#0B1D2A",
  color: "#fff",
  transition: ".3s ease",
  borderRight: "1px solid #1B3445",
  display: "flex",
  flexDirection: "column",
  zIndex: 999,
  overflow: "hidden",
}}
>
      {/* Atas */}
      <div
        style={{
          padding: "22px",
        }}
      >
        <h3
          style={{
            color: "#00C2FF",
            fontWeight: "700",
            marginBottom: "5px",
            marginTop: mobile ? "55px" : "0",
            fontSize: "32px",
          }}
        >
          AI.Ind
        </h3>

        <small
          style={{
            color: "#8A9BB5",
            fontSize: "16px",
          }}
        >
          Buatan Indonesia
        </small>

        <button
          onClick={chatBaru}
          style={{
            marginTop: "25px",
            width: "100%",
            padding: "12px",
            background: "#00C2FF",
            color: "#081420",
            border: "none",
            borderRadius: "10px",
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10px",
            cursor: "pointer",
          }}
        >
          <FiPlus />
          Chat Baru
        </button>
      </div>

      {/* Riwayat */}
     <div
style={{
  flex: 1,
  overflowY:"auto",
  overflowX:"hidden",
  padding: "0 22px 12px",
  minHeight:0,
}}
>
        <p
          style={{
            color: "#8A9BB5",
            fontSize: "13px",
            marginBottom: "10px",
          }}
        >
          Riwayat Chat
        </p>

        {!history || history.length === 0 ? (
          <p
            style={{
              color: "#8A9BB5",
              fontSize: "13px",
            }}
          >
            Belum ada riwayat
          </p>
        ) : (
        
history.map((chat, index) => (
  <div
    key={chat.id}
    style={{
      background: "#122B3C",
      borderRadius: "12px",
      padding: "12px",
      display: "flex",
      alignItems: "center",
      marginBottom: "10px",
      cursor: "pointer",
      transition: ".2s",
    }}
  >
    <div
      onClick={() => {
        setMessages(chat.messages);

        if (mobile) {
          setOpen(false);
        }
      }}
      style={{
        display: "flex",
        alignItems: "center",
        flex: 1,
        gap: "10px",
      }}
    >
      <FiMessageSquare />

      <span
        style={{
          flex: 1,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
        }}
      >
        {chat.title}
      </span>
    </div>

    <button
      onClick={(e) => {
        e.stopPropagation();

        const data = [...history];
        data.splice(index, 1);

        setHistory(data);
        localStorage.setItem("history", JSON.stringify(data));
      }}
      style={{
        background: "transparent",
        border: "none",
        color: "#ff5c5c",
        cursor: "pointer",
        fontSize: "16px",
      }}
    >
      <FaTrash />
    </button>
  </div>
))
        )}
      </div>

           {/* Menu bawah */}
      <div
  style={{
    flexShrink: 0,
    padding: "16px 20px",
    background: "#0B1D2A",
    borderTop: "1px solid #1B3445",
    boxShadow: "0 -2px 10px rgba(0,0,0,.2)",
  }}
>
        {/* Profil */}
       <div
  onClick={() => setProfileOpen(!profileOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "15px",
            padding: "12px",
            borderRadius: "12px",
            background: "#122B3C",
            cursor: "pointer",
          }}
        >
<FaUserCircle 
  size={35} 
  color="#00C2FF"
/>

          <div style={{ flex: 1 }}>
            <div
              style={{
                fontWeight: "600",
                fontSize: "15px",
              }}
            >
              {user?.nama || "Belum Login"}
            </div>

            <small style={{ color: "#8A9BB5" }}>
              {user?.email || "Masuk untuk menggunakan AI.Ind"}
            </small>
          </div>
        </div>

        {/* Pengaturan */}
        <div
          onClick={() => setSettingOpen(!settingOpen)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "10px",
            color: "#8A9BB5",
            cursor: "pointer",
          }}
        >
          <FaCog />
          Pengaturan
        </div>

        {settingOpen && (
         <div
  style={{
    marginLeft: "18px",
    marginTop: "6px",
    marginBottom: "8px",
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  }}
>
            {!user ? (
              <div
                onClick={() => navigate("/login")}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                <FaGoogle />
                Login dengan Google
              </div>
            ) : (
              <div
                onClick={handleChangeAccount}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  cursor: "pointer",
                  color: "#fff",
                }}
              >
                <FaUserCircle />
Ganti Akun
              </div>
            )}

            <div
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                cursor: "pointer",
                color: "#ff6b6b",
              }}
            >
              <FaSignOutAlt />
              Keluar
            </div>
          </div>
        )}

        {/* Tentang */}
       <div
  onClick={handleAbout}
  style={{
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "10px",
    color: "#8A9BB5",
    cursor: "pointer",
    flexShrink:0,
    position: "relative",
    zIndex: 5,
    marginTop:"12px",
paddingTop:"12px",
borderTop:"1px solid rgba(255,255,255,.08)",
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