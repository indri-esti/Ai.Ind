import { Row, Col } from "react-bootstrap";

import { FiPlus, FiX, FiImage } from "react-icons/fi";

import { useState, useEffect, useRef } from "react";

import { AdMob, BannerAd } from "@capgo/capacitor-admob";

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
      /^\s*(Here's|Heres|Here is)\s+a\s+thinking\s+process\s*:[\s\S]*$/i,
      ""
    );

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
  // ADMOB BANNER
  // ==================================================

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


  // ==================================================
  // PILIH GAMBAR
  // ==================================================

  const pilihGambar = (event) => {

    const file =
      event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {

      alert(
        "Silakan pilih file gambar."
      );

      event.target.value = "";

      return;
    }

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

            role:
              "user",

            content:
              pesanText,

            image:
              imagePreview ||
              null,

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

        const jawabanAI =
          bersihkanJawabanAI(
            res.data?.reply
          );

        setMessages(
          (prev) => [

            ...prev,

            {

              role:
                "assistant",

              content:
                jawabanAI ||
                "AI tidak memberikan jawaban.",

            },

          ]
        );

        // ==================================================
        // HAPUS GAMBAR
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

          // Jangan lagi mengatakan backend mati.
          // Request sudah dikirim tetapi tidak mendapat
          // response dari server.

          errorMessage =
            "Tidak dapat terhubung ke Backend AI.Ind. Periksa koneksi internet, URL API, atau CORS.";

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

          * {
            box-sizing: border-box;
          }

          .home-page {
            width: 100%;
            height: 100vh;
            min-height: 100vh;

            background:
              radial-gradient(
                circle at 50% -10%,
                rgba(0,194,255,.08),
                transparent 35%
              ),
              #081420;

            color: #fff;

            display: flex;

            overflow: hidden;
          }


          /* ==================================================
             MAIN
          ================================================== */

          .home-main {

            flex: 1;

            width: 100%;
            min-width: 0;

            height: 100vh;
            min-height: 0;

            display: flex;
            flex-direction: column;

            position: relative;

            overflow: hidden;
          }


          /* ==================================================
             HEADER
          ================================================== */

          .home-header {

            width: 100%;

            position: relative;

            z-index: 10;

            flex-shrink: 0;
          }

          .home-header-container {

            width: 100%;

            max-width: 1180px;

            margin: 0 auto;

            padding:
              14px 24px 0;
          }


          /* ==================================================
             CHAT AREA
          ================================================== */

          .home-chat-area {

            flex: 1;

            width: 100%;

            min-height: 0;

            overflow: hidden;
          }

          .home-chat-container {

            width: 100%;
            height: 100%;

            max-width: 1180px;

            margin: 0 auto;

            padding:
              0 24px;
          }

          .home-chat-column {

            height: 100%;

            min-height: 0;

            display: flex;

            flex-direction: column;
          }


          /* ==================================================
             MESSAGES
          ================================================== */

          .home-messages {

            flex: 1;

            width: 100%;

            min-height: 0;

            overflow-y: auto;
            overflow-x: hidden;

            padding:
              10px 4px 180px;

            display: flex;

            flex-direction: column;

            gap: 12px;

            scrollbar-width: thin;

            scrollbar-color:
              #1B3445
              transparent;
          }

          .home-messages::-webkit-scrollbar {

            width: 6px;
          }

          .home-messages::-webkit-scrollbar-track {

            background: transparent;
          }

          .home-messages::-webkit-scrollbar-thumb {

            background: #1B3445;

            border-radius: 20px;
          }


          /* ==================================================
             WELCOME
          ================================================== */

          .home-welcome {

            flex: 1;

            min-height: 0;

            width: 100%;

            display: flex;

            align-items: center;

            justify-content: center;

            padding:
              30px 15px 50px;
          }

          .home-welcome-content {

            width: 100%;

            max-width: 700px;

            margin: 0 auto;

            text-align: center;
          }


          /* ==================================================
             LOGO
          ================================================== */

          .home-logo-wrapper {

            position: relative;

            width: 108px;
            height: 108px;

            margin:
              0 auto 20px;
          }

          .home-logo-box {

            position: relative;

            width: 108px;
            height: 108px;

            border-radius: 27px;

            overflow: hidden;

            border:
              1px solid
              rgba(24,216,255,.18);

            box-shadow:
              0 15px 45px
              rgba(0,194,255,.15);
          }

          .home-logo-box svg {

            display: block;

            width: 100%;
            height: 100%;
          }


          /* ==================================================
             TITLE
          ================================================== */

          .home-title {

            margin:
              0 0 8px;

            font-size:
              clamp(28px, 4vw, 44px);

            font-weight: 800;

            line-height: 1.15;

            letter-spacing:
              -1.2px;

            background:
              linear-gradient(
                90deg,
                #18D8FF,
                #00C2FF,
                #008FE8
              );

            -webkit-background-clip:
              text;

            -webkit-text-fill-color:
              transparent;
          }

          .home-subtitle {

            margin:
              0 auto 10px;

            color:
              #E7F3FA;

            font-size:
              clamp(15px, 2vw, 19px);

            font-weight:
              600;
          }

          .home-description {

            width: 100%;

            max-width: 560px;

            margin:
              0 auto;

            color:
              #8A9BB5;

            font-size:
              14px;

            line-height:
              1.7;
          }


          /* ==================================================
             SUGGESTIONS
          ================================================== */

          .home-suggestions {

            margin-top:
              22px;

            display:
              flex;

            justify-content:
              center;

            align-items:
              center;

            flex-wrap:
              wrap;

            gap:
              9px;
          }

          .home-suggestion-button {

            padding:
              9px 14px;

            border-radius:
              999px;

            border:
              1px solid
              rgba(0,194,255,.18);

            background:
              rgba(18,43,60,.65);

            color:
              #A9C4D3;

            font-size:
              12px;

            cursor:
              pointer;

            transition:
              .2s ease;

            backdrop-filter:
              blur(10px);

            white-space:
              normal;
          }

          .home-suggestion-button:hover {

            transform:
              translateY(-1px);

            border-color:
              rgba(0,194,255,.4);
          }


          /* ==================================================
             INPUT
          ================================================== */

          .home-input-area {

            position:
              absolute;

            left:
              0;

            right:
              0;

            bottom:
              0;

            z-index:
              20;

            width:
              100%;

            background:
              linear-gradient(
                to top,
                #081420 72%,
                rgba(8,20,32,.94) 82%,
                transparent
              );

            padding:
              35px 24px 18px;
          }

          .home-input-container {

            width:
              100%;

            max-width:
              1050px;

            margin:
              0 auto;
          }

          .home-disclaimer {

            width:
              100%;

            text-align:
              center;

            color:
              #536B7D;

            font-size:
              10px;

            line-height:
              1.4;

            margin-top:
              7px;

            padding:
              0 5px;
          }


          /* ==================================================
             DESKTOP BESAR
          ================================================== */

          @media (min-width: 1400px) {

            .home-header-container,
            .home-chat-container {

              max-width:
                1280px;
            }

            .home-input-container {

              max-width:
                1150px;
            }

            .home-welcome-content {

              max-width:
                760px;
            }

            .home-title {

              font-size:
                46px;
            }

            .home-description {

              font-size:
                15px;
            }
          }


          /* ==================================================
             TABLET
          ================================================== */

          @media (max-width: 992px) {

            .home-header-container {

              padding:
                12px 18px 0;
            }

            .home-chat-container {

              padding:
                0 18px;
            }

            .home-input-area {

              padding:
                30px 18px 14px;
            }

            .home-messages {

              padding-bottom:
                165px;
            }

            .home-welcome {

              padding:
                25px 12px 40px;
            }

          }


          /* ==================================================
             HP
          ================================================== */

          @media (max-width: 768px) {

            .home-page {

              width: 100%;

              height: 100dvh;

              min-height: 100dvh;

              overflow: hidden;
            }

            .home-main {

              width: 100%;

              height: 100dvh;

              min-height: 0;
            }

            .home-header-container {

              padding:
                9px 12px 0;
            }

            .home-chat-container {

              padding:
                0 10px;
            }

            .home-messages {

              padding:
                5px 2px 145px;

              gap:
                10px;
            }

            .home-welcome {

              align-items:
                center;

              padding:
                15px 8px 35px;
            }

            .home-welcome-content {

              max-width:
                100%;
            }

            .home-logo-wrapper {

              width:
                82px;

              height:
                82px;

              margin:
                0 auto 14px;
            }

            .home-logo-box {

              width:
                82px;

              height:
                82px;

              border-radius:
                21px;
            }

            .home-title {

              font-size:
                clamp(
                  24px,
                  8vw,
                  34px
                );

              letter-spacing:
                -.8px;
            }

            .home-subtitle {

              font-size:
                14px;

              line-height:
                1.4;

              padding:
                0 8px;
            }

            .home-description {

              font-size:
                12px;

              line-height:
                1.55;

              padding:
                0 10px;
            }

            .home-suggestions {

              margin-top:
                16px;

              gap:
                7px;

              padding:
                0 5px;
            }

            .home-suggestion-button {

              padding:
                8px 11px;

              font-size:
                11px;

              max-width:
                100%;
            }

            .home-input-area {

              padding:
                25px 10px 10px;
            }

            .home-input-container {

              max-width:
                100%;
            }

            .home-disclaimer {

              font-size:
                9px;

              margin-top:
                5px;
            }

          }


          /* ==================================================
             HP KECIL
          ================================================== */

          @media (max-width: 480px) {

            .home-header-container {

              padding:
                7px 8px 0;
            }

            .home-chat-container {

              padding:
                0 6px;
            }

            .home-messages {

              padding:
                4px 1px 138px;

              gap:
                8px;
            }

            .home-welcome {

              padding:
                10px 5px 25px;
            }

            .home-logo-wrapper {

              width:
                70px;

              height:
                70px;

              margin-bottom:
                10px;
            }

            .home-logo-box {

              width:
                70px;

              height:
                70px;

              border-radius:
                18px;
            }

            .home-title {

              font-size:
                24px;
            }

            .home-subtitle {

              font-size:
                13px;
            }

            .home-description {

              font-size:
                11px;

              line-height:
                1.5;
            }

            .home-suggestions {

              margin-top:
                12px;

              gap:
                6px;
            }

            .home-suggestion-button {

              padding:
                7px 9px;

              font-size:
                10px;
            }

            .home-input-area {

              padding:
                20px 7px 8px;
            }

            .home-disclaimer {

              font-size:
                8px;

              margin-top:
                4px;
            }

          }


          /* ==================================================
             HP SANGAT KECIL
          ================================================== */

          @media (max-width: 360px) {

            .home-title {

              font-size:
                22px;
            }

            .home-subtitle {

              font-size:
                12px;
            }

            .home-description {

              font-size:
                10px;
            }

            .home-suggestion-button {

              padding:
                6px 8px;

              font-size:
                9px;
            }

            .home-input-area {

              padding:
                18px 5px 6px;
            }

          }


          /* ==================================================
             LAYAR PENDEK
          ================================================== */

          @media (max-height: 700px) {

            .home-welcome {

              padding-top:
                8px;

              padding-bottom:
                20px;
            }

            .home-logo-wrapper {

              transform:
                scale(.85);

              margin-bottom:
                2px;
            }

            .home-suggestions {

              margin-top:
                12px;
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

          {/* ==================================================
              HEADER
          ================================================== */}

          <div className="home-header">

            <div className="home-header-container">

              <Header />

            </div>

          </div>


          {/* ==================================================
              CHAT AREA
          ================================================== */}

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

                    {messages.length === 0 ? (

                      <div className="home-welcome">

                        <div className="home-welcome-content">

                          <div className="home-logo-wrapper">

                            <div className="home-logo-box">

                              <svg
                                viewBox="0 0 108 108"
                                xmlns="http://www.w3.org/2000/svg"
                              >

                                <rect
                                  width="108"
                                  height="108"
                                  rx="27"
                                  fill="#0D2638"
                                />

                                <circle
                                  cx="54"
                                  cy="54"
                                  r="30"
                                  fill="#00C2FF"
                                  opacity=".12"
                                />

                                <text
                                  x="54"
                                  y="66"
                                  textAnchor="middle"
                                  fontSize="38"
                                  fontWeight="800"
                                  fill="#18D8FF"
                                  fontFamily="Arial, sans-serif"
                                >
                                  AI
                                </text>

                              </svg>

                            </div>

                          </div>


                          <h1 className="home-title">
                            AI.Ind
                          </h1>


                          <p className="home-subtitle">
                            Asisten AI untuk membantu kamu
                          </p>


                          <p className="home-description">
                            Tanyakan apa saja, minta bantuan
                            mengerjakan tugas, berdiskusi,
                            atau kirim gambar untuk dianalisis.
                          </p>


                          <div className="home-suggestions">

                            <button
                              type="button"
                              className="home-suggestion-button"
                              onClick={() =>
                                setMessage(
                                  "Bantu aku mengerjakan tugas sekolah"
                                )
                              }
                            >
                              Bantu tugas
                            </button>

                            <button
                              type="button"
                              className="home-suggestion-button"
                              onClick={() =>
                                setMessage(
                                  "Jelaskan materi ini dengan mudah"
                                )
                              }
                            >
                              Jelaskan materi
                            </button>

                            <button
                              type="button"
                              className="home-suggestion-button"
                              onClick={() =>
                                setMessage(
                                  "Berikan ide yang menarik"
                                )
                              }
                            >
                              Cari ide
                            </button>

                          </div>

                        </div>

                      </div>

                    ) : (

                      <>

                        {messages.map(
                          (item, index) => (

                            <ChatBox
                              key={
                                item.id ||
                                index
                              }
                              message={
                                item
                              }
                            />

                          )
                        )}

                        {loading && (
                          <Typing />
                        )}

                        <div
                          ref={chatEndRef}
                        />

                      </>

                    )}

                  </div>


                  {/* ==================================================
                      INPUT
                  ================================================== */}

                  <div className="home-input-area">

                    <div className="home-input-container">

                      {imagePreview && (

                        <div
                          style={{
                            position:
                              "relative",
                            width:
                              "fit-content",
                            maxWidth:
                              "100%",
                            margin:
                              "0 auto 10px",
                          }}
                        >

                          <img
                            src={
                              imagePreview
                            }
                            alt="Preview"
                            style={{
                              display:
                                "block",
                              maxWidth:
                                "180px",
                              maxHeight:
                                "120px",
                              width:
                                "auto",
                              height:
                                "auto",
                              objectFit:
                                "cover",
                              borderRadius:
                                "12px",
                              border:
                                "1px solid rgba(0,194,255,.25)",
                            }}
                          />

                          <button
                            type="button"
                            onClick={
                              hapusGambar
                            }
                            style={{
                              position:
                                "absolute",
                              top:
                                "-8px",
                              right:
                                "-8px",
                              width:
                                "28px",
                              height:
                                "28px",
                              borderRadius:
                                "50%",
                              border:
                                "1px solid rgba(255,255,255,.2)",
                              background:
                                "#102638",
                              color:
                                "#fff",
                              display:
                                "flex",
                              alignItems:
                                "center",
                              justifyContent:
                                "center",
                              cursor:
                                "pointer",
                            }}
                          >
                            <FiX size={15} />
                          </button>

                        </div>

                      )}


                      <input
                        ref={
                          fileInputRef
                        }
                        type="file"
                        accept="image/*"
                        onChange={
                          pilihGambar
                        }
                        style={{
                          display:
                            "none",
                        }}
                      />


                      <ChatInput
                        message={
                          message
                        }
                        setMessage={
                          setMessage
                        }
                        kirimPesan={
                          kirimPesan
                        }
                        loading={
                          loading
                        }
                        pilihGambar={() =>
                          fileInputRef.current?.click()
                        }
                      />


                      <div className="home-disclaimer">

                        AI.Ind dapat membuat
                        kesalahan. Periksa kembali
                        informasi penting.

                      </div>

                    </div>

                  </div>

                </Col>

              </Row>

            </div>

          </div>

        </div>

      </div>
    </>
  );
}

export default Home;