import { Row, Col } from "react-bootstrap";
import { FiPlus, FiX, FiImage } from "react-icons/fi";
import { useState, useEffect, useRef } from "react";
import axios from "../api";

import Header from "../components/Header";
import ChatBox from "../components/ChatBox";
import ChatInput from "../components/ChatInput";
import Loading from "../components/Loading";
import Typing from "../components/Typing";
import Sidebar from "../components/Sidebar";

function Home() {
  
  // ==================================================
  // BERSIHKAN RESPONSE AI
  // ==================================================

  const bersihkanJawabanAI = (teks) => {

    if (!teks) {
      return "";
    }

    let hasil = String(teks);

    // Hapus <think>...</think>
    hasil = hasil.replace(
      /<think>[\s\S]*?<\/think>/gi,
      ""
    );

    // Hapus <think> jika tidak ada penutup
    hasil = hasil.replace(
      /<think>[\s\S]*$/gi,
      ""
    );

    // Hapus tag think yang tersisa
    hasil = hasil.replace(
      /<\/?think>/gi,
      ""
    );

    // Hapus "Here's a thinking process..."
    hasil = hasil.replace(
      /^\s*(Here's|Heres|Here is)\s+a\s+thinking\s+process\s*:[\s\S]*$/i,
      ""
    );

    // Rapikan baris kosong
    hasil = hasil.replace(
      /\n{3,}/g,
      "\n\n"
    );

    return hasil.trim();
  };

  // ==================================================
  // STATE
  // ==================================================

  const [message, setMessage] =
    useState("");

  const [messages, setMessages] =
    useState([]);

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState(null);

  const fileInputRef =
    useRef(null);

  const [history, setHistory] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [pageLoading, setPageLoading] =
    useState(true);

  const [currentChatId, setCurrentChatId] =
    useState(null);

  const chatEndRef =
    useRef(null);


  // ==================================================
  // PILIH GAMBAR
  // ==================================================

  const pilihGambar = (event) => {

    const file =
      event.target.files?.[0];

    if (!file) return;


    // Hanya gambar
    if (!file.type.startsWith("image/")) {

      alert(
        "Silakan pilih file gambar."
      );

      event.target.value = "";

      return;
    }


    // Batas 10 MB
    if (
      file.size >
      10 * 1024 * 1024
    ) {

      alert(
        "Ukuran gambar maksimal 10 MB."
      );

      event.target.value = "";

      return;
    }


    setSelectedImage(file);


    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(
      previewUrl
    );
  };


  // ==================================================
  // HAPUS GAMBAR
  // ==================================================

  const hapusGambar = () => {

    setSelectedImage(null);


    if (imagePreview) {

      URL.revokeObjectURL(
        imagePreview
      );

    }


    setImagePreview(null);


    if (
      fileInputRef.current
    ) {

      fileInputRef.current.value =
        "";

    }
  };


  // ==================================================
  // AUTO SCROLL
  // ==================================================

  useEffect(() => {

    chatEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });

  }, [
    messages,
    loading,
  ]);


  // ==================================================
  // PAGE LOADING
  // ==================================================

  useEffect(() => {

    const timer =
      setTimeout(() => {

        setPageLoading(false);

      }, 1800);


    return () =>
      clearTimeout(timer);

  }, []);


  // ==================================================
  // CHAT BARU
  // ==================================================

  const chatBaru = () => {

    if (
      messages.length > 0
    ) {

      const chat = {

        id: Date.now(),

        title:
          messages.find(
            (m) =>
              m.role === "user"
          )?.content ||
          "Percakapan Baru",

        messages,

      };


      setHistory((prev) => [

        chat,

        ...prev,

      ]);
    }


    setMessages([]);

    setCurrentChatId(null);

    hapusGambar();
  };


  // ==================================================
  // GAMBAR → BASE64
  // ==================================================

  const fileToBase64 = (file) => {

    return new Promise(
      (resolve, reject) => {

        const reader =
          new FileReader();


        reader.onload = () => {

          resolve(
            reader.result
          );

        };


        reader.onerror = () => {

          reject(
            new Error(
              "Gagal membaca gambar."
            )
          );

        };


        reader.readAsDataURL(
          file
        );

      }
    );
  };


  // ==================================================
  // KIRIM PESAN
  // ==================================================

  const kirimPesan =
    async () => {

      if (
        (!message.trim() &&
          !selectedImage) ||
        loading
      ) {

        return;

      }


      // ==================================================
      // CEK USER LOGIN
      // ==================================================

      const savedUser =
        localStorage.getItem(
          "user"
        );


      let currentUser = {};


      try {

        currentUser =
          savedUser
            ? JSON.parse(
                savedUser
              )
            : {};

      } catch (error) {

        console.error(
          "Data user tidak valid:",
          error
        );

        currentUser = {};

      }


      const userId =
        Number(
          currentUser?.id
        );


      if (
        !Number.isInteger(
          userId
        ) ||
        userId <= 0
      ) {

        console.error(
          "USER ID TIDAK VALID:",
          currentUser
        );


        setMessages(
          (prev) => [

            ...prev,

            {

              role:
                "assistant",

              content:
                "Sesi login kamu tidak valid. Silakan logout lalu login kembali.",

            },

          ]
        );


        return;
      }


      try {

        setLoading(true);


        // ==================================================
        // PESAN
        // ==================================================

        const pesanText =
          message.trim() ||
          "Tolong analisis gambar ini.";


        // ==================================================
        // GAMBAR → BASE64
        // ==================================================

        let imageBase64 =
          null;


        if (
          selectedImage
        ) {

          imageBase64 =
            await fileToBase64(
              selectedImage
            );

        }


        // ==================================================
        // TAMPILKAN PESAN USER
        // ==================================================

        setMessages((prev) => [
  ...prev,
  {
    role: "user",
    content: pesanText,
    image: imagePreview || null,
  },
]);


        // ==================================================
        // BERSIHKAN INPUT
        // ==================================================

        setMessage("");


        // ==================================================
        // KIRIM KE BACKEND
        // ==================================================

        const res =
          await axios.post(
            "/chat",
            {

              message:
                pesanText,

              user_id:
                userId,

              chat_id:
                currentChatId
                  ? Number(
                      currentChatId
                    )
                  : null,

              // GAMBAR
              image:
                imageBase64,

            }
          );


        // ==================================================
        // CHAT ID
        // ==================================================

        if (
          res.data?.chat_id
        ) {

          setCurrentChatId(
            res.data.chat_id
          );

        }


        // ==================================================
        // JAWABAN AI
        // ==================================================

        // ==================================================
// JAWABAN AI
// ==================================================

const jawabanAI =
  bersihkanJawabanAI(
    res.data?.reply
  );

setMessages(
  (prev) => [
    ...prev,
    {
      role: "assistant",

      content:
        jawabanAI ||
        "AI tidak memberikan jawaban.",
    },
  ]
);


        // ==================================================
        // HAPUS GAMBAR SETELAH TERKIRIM
        // ==================================================

        hapusGambar();


      } catch (err) {

        console.error(
          "Kirim pesan error:",
          err
        );


        let errorMessage =
          "Server tidak dapat dihubungi.";


        if (
          err.response
        ) {

          errorMessage =
            err.response?.data?.error ||
            `Error ${err.response.status}`;

        } else if (
          err.request
        ) {

          errorMessage =
            "Backend belum berjalan.";

        }


        setMessages(
          (prev) => [

            ...prev,

            {

              role:
                "assistant",

              content:
                errorMessage,

            },

          ]
        );


      } finally {

        setLoading(false);

      }

    };


  // ==================================================
  // LOADING
  // ==================================================

  if (pageLoading) {

    return <Loading />;

  }

  // ==================================================
  // RENDER
  // ==================================================
  return (
    <>
      <style>
        {`
          .home-page {
            background:
              radial-gradient(
                circle at 50% -10%,
                rgba(0,194,255,.08),
                transparent 35%
              ),
              #081420;
            min-height: 100vh;
            height: 100vh;
            color: #fff;
            display: flex;
            overflow: hidden;
          }

          .home-main {
            flex: 1;
            display: flex;
            flex-direction: column;
            min-width: 0;
            height: 100vh;
            position: relative;
          }

          .home-header {
            position: relative;
            z-index: 10;
            flex-shrink: 0;
          }

          .home-header-container {
            width: 100%;
            max-width: 1050px;
            margin: 0 auto;
            padding: 14px 20px 0;
          }

          .home-chat-area {
            flex: 1;
            min-height: 0;
            overflow: hidden;
          }

          .home-chat-container {
            width: 100%;
            height: 100%;
            max-width: 1050px;
            margin: 0 auto;
            padding: 0 20px;
          }

          .home-chat-column {
            height: 100%;
            display: flex;
            flex-direction: column;
            min-height: 0;
          }

          .home-messages {
            flex: 1;
            min-height: 0;
            overflow-y: auto;
            overflow-x: hidden;
            padding: 10px 4px 155px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            scrollbar-width: thin;
            scrollbar-color: #1B3445 transparent;
          }

          .home-welcome {
            flex: 1;
            min-height: 0;
            width: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 25px 10px 35px;
          }

          .home-welcome-content {
            width: 100%;
            max-width: 650px;
            text-align: center;
          }

          .home-logo-wrapper {
            position: relative;
            width: 108px;
            height: 108px;
            margin: 0 auto 20px;
          }

          .home-logo-box {
            position: relative;
            width: 108px;
            height: 108px;
            border-radius: 27px;
            overflow: hidden;
            border: 1px solid rgba(24,216,255,.18);
            box-shadow: 0 15px 45px rgba(0,194,255,.15);
          }

          .home-logo-box svg {
            display: block;
            width: 100%;
            height: 100%;
          }

          .home-title {
            margin: 0 0 8px;
            font-size: clamp(26px, 5vw, 42px);
            font-weight: 800;
            line-height: 1.15;
            letter-spacing: -1.2px;
            background:
              linear-gradient(
                90deg,
                #18D8FF,
                #00C2FF,
                #008FE8
              );
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
          }

          .home-subtitle {
            margin: 0 auto 10px;
            color: #E7F3FA;
            font-size: clamp(15px, 3vw, 19px);
            font-weight: 600;
          }

          .home-description {
            max-width: 540px;
            margin: 0 auto;
            color: #8A9BB5;
            font-size: 14px;
            line-height: 1.7;
          }

          .home-suggestions {
            margin-top: 22px;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 9px;
          }

          .home-suggestion-button {
            padding: 9px 14px;
            border-radius: 999px;
            border: 1px solid rgba(0,194,255,.18);
            background: rgba(18,43,60,.65);
            color: #A9C4D3;
            font-size: 12px;
            cursor: pointer;
            transition: .2s ease;
            backdrop-filter: blur(10px);
          }

          .home-input-area {
            position: absolute;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 20;
            background:
              linear-gradient(
                to top,
                #081420 72%,
                rgba(8,20,32,.94) 82%,
                transparent
              );
            padding: 35px 20px 18px;
          }

          .home-input-container {
            width: 100%;
            max-width: 1050px;
            margin: 0 auto;
          }

          .home-disclaimer {
            text-align: center;
            color: #536B7D;
            font-size: 10px;
            margin-top: 7px;
          }

          @media (max-width: 768px) {
            .home-page {
              height: 100dvh;
              min-height: 100dvh;
            }

            .home-main {
              height: 100dvh;
            }

            .home-header-container {
              padding: 10px 12px 0;
            }

            .home-chat-container {
              padding: 0 10px;
            }

            .home-messages {
              padding:
                5px 2px 135px;
              gap: 10px;
            }

            .home-welcome {
              align-items: center;
              padding:
                15px 8px 30px;
            }

            .home-welcome-content {
              max-width: 100%;
            }

            .home-logo-wrapper {
              width: 82px;
              height: 82px;
              margin-bottom: 14px;
            }

            .home-logo-box {
              width: 82px;
              height: 82px;
              border-radius: 21px;
            }

            .home-title {
              font-size: clamp(
                24px,
                8vw,
                34px
              );
              letter-spacing: -.8px;
            }

            .home-subtitle {
              font-size: 14px;
              padding: 0 8px;
            }

            .home-description {
              font-size: 12px;
              line-height: 1.55;
              padding: 0 10px;
            }

            .home-suggestions {
              margin-top: 16px;
              gap: 7px;
              padding: 0 5px;
            }

            .home-suggestion-button {
              padding: 8px 11px;
              font-size: 11px;
            }

            .home-input-area {
              padding:
                25px 10px 10px;
            }

            .home-disclaimer {
              font-size: 9px;
              margin-top: 5px;
            }
          }

          @media (max-width: 400px) {
            .home-header-container {
              padding-left: 8px;
              padding-right: 8px;
            }

            .home-chat-container {
              padding-left: 6px;
              padding-right: 6px;
            }

            .home-welcome {
              padding-top: 8px;
              padding-bottom: 20px;
            }

            .home-logo-wrapper {
              width: 70px;
              height: 70px;
              margin-bottom: 10px;
            }

            .home-logo-box {
              width: 70px;
              height: 70px;
              border-radius: 18px;
            }

            .home-title {
              font-size: 24px;
            }

            .home-subtitle {
              font-size: 13px;
            }

            .home-description {
              font-size: 11px;
            }

            .home-suggestions {
              margin-top: 12px;
            }

            .home-suggestion-button {
              padding: 7px 9px;
              font-size: 10px;
            }

            .home-input-area {
              padding:
                20px 7px 8px;
            }
          }
        `}
      </style>

      <div className="home-page">
        <Sidebar
          messages={messages}
          setMessages={setMessages}
          history={history}
          setHistory={setHistory}
          chatBaru={chatBaru}
        />

        <div className="home-main">

          {/* ==========================================
              HEADER
          ========================================== */}
          <div className="home-header">
            <div className="home-header-container">
              <Header />
            </div>
          </div>

          {/* ==========================================
              CHAT AREA
          ========================================== */}
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

                    {/* ==========================================
                        WELCOME SCREEN
                    ========================================== */}
                    {messages.length === 0 &&
                      !loading && (
                        <div className="home-welcome">
                          <div className="home-welcome-content">

                            {/* LOGO */}
                            <div className="home-logo-wrapper">
                              <div
                                style={{
                                  position:
                                    "absolute",
                                  inset: "-18px",
                                  borderRadius:
                                    "38px",
                                  background:
                                    "rgba(0,194,255,.06)",
                                  filter:
                                    "blur(18px)",
                                }}
                              />

                              <div className="home-logo-box">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 512 512"
                                  width="108"
                                  height="108"
                                >
                                  <defs>
                                    <linearGradient
                                      id="homeBg"
                                      x1="0"
                                      y1="0"
                                      x2="1"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor="#0B1B2B"
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor="#07111D"
                                      />
                                    </linearGradient>

                                    <linearGradient
                                      id="homeCyan"
                                      x1="0"
                                      y1="0"
                                      x2="1"
                                      y2="1"
                                    >
                                      <stop
                                        offset="0%"
                                        stopColor="#18D8FF"
                                      />
                                      <stop
                                        offset="100%"
                                        stopColor="#008FE8"
                                      />
                                    </linearGradient>

                                    <filter
                                      id="homeGlow"
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
                                    fill="url(#homeBg)"
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
                                    fill="url(#homeCyan)"
                                  />

                                  <circle
                                    cx="256"
                                    cy="98"
                                    r="9"
                                    fill="#18D8FF"
                                    filter="url(#homeGlow)"
                                  />

                                  <rect
                                    x="137"
                                    y="145"
                                    width="238"
                                    height="190"
                                    rx="58"
                                    fill="url(#homeCyan)"
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
                                    d="M190 365 C190 345 206 332 226 332 H286 C306 332 322 345 322 365 V382 H190Z"
                                    fill="url(#homeCyan)"
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
                              </div>
                            </div>

                            {/* TITLE */}
                            <h1 className="home-title">
                              Selamat Datang di AI.Ind
                            </h1>

                            <p className="home-subtitle">
                              Asisten AI Buatan
                              Indonesia 🇮🇩
                            </p>

                            <p className="home-description">
                              Teman cerdas untuk
                              belajar, mencari ide,
                              menjawab pertanyaan,
                              dan membantu berbagai
                              aktivitasmu.
                            </p>

                            {/* QUICK SUGGESTIONS */}
                            <div className="home-suggestions">
                              {[
                                "Bantu belajar",
                                "Cari ide",
                                "Jelaskan sesuatu",
                              ].map(
                                (item) => (
                                  <button
                                    key={item}
                                    type="button"
                                    onClick={() =>
                                      setMessage(
                                        item
                                      )
                                    }
                                    className="home-suggestion-button"
                                  >
                                    {item}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                    {/* CHAT */}
                    {/* CHAT */}
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

          {/* ==========================================
              INPUT AREA
          ========================================== */}
          <div className="home-input-area">
            <div className="home-input-container">

              {/* PREVIEW GAMBAR */}
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
                      <FiX size={16} />
                    </button>

                    <div className="home-image-label">
                      <FiImage size={14} />
                      Gambar siap dianalisis
                    </div>

                  </div>
                </div>
              )}

              {/* INPUT ROW */}
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

              {/* DISCLAIMER */}
              <div className="home-disclaimer">
                AI.Ind dapat membuat
                kesalahan. Periksa kembali
                informasi penting.
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default Home;