import {
  Container,
  Row,
  Col,
  Button,
  Form,
} from "react-bootstrap";

import {
  FaPaperPlane,
  FaRobot,
  FaUserCircle,
} from "react-icons/fa";

import { useState } from "react";
import axios from "../api";

function Home() {

  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Halo 👋 Saya AI.Ind."
    }
  ]);

  const [loading, setLoading] = useState(false);

  // Kirim pesan
 const kirimPesan = async () => {
  if (!message.trim()) return;

  const text = message;

  // Kosongkan input
  setMessage("");

  // Tampilkan pesan user
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
    });

    setMessages((prev) => [
      ...prev,
      {
        role: "assistant",
        content: res.data.reply,
      },
    ]);
  } catch (err) {
    console.error(err);

    let errorMessage = "Server tidak dapat dihubungi.";

    if (err.response) {
      errorMessage = `Error ${err.response.status}`;
    } else if (err.request) {
      errorMessage = "Backend belum berjalan.";
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

  return (
    <div
  style={{
    background: "#081420",
    height: "100vh",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  }}
>
<Container
  style={{
    maxWidth: "980px",
    margin: "0 auto",
    paddingLeft: "20px",
    paddingRight: "20px",
  }}
>

        {/* Header */}
        <Container
  style={{
    maxWidth: "980px",
    margin: "0 auto",
  }}
>
      <Row className="align-items-center justify-content-between">
<Col xs={12} className="d-flex flex-column">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <h3
                  style={{
                    color: "#00C2FF",
                    marginBottom: 0,
                    fontWeight: "700",
                  }}
                >
                  AI.Ind
                </h3>

                <small style={{ color: "#8A9BB5" }}>
                  Buatan Indonesia
                </small>
              </div>

               <FaUserCircle size={38} color="#00C2FF" />
            </div>
          </Col>
        </Row>
        </Container>

       {/* Welcome */}
{messages.length === 1 && (
  <Row
    className="justify-content-center"
    style={{
      flex: 1,
      alignItems: "center",
      minHeight: "65vh",
    }}
  >
    <Col xs={12} md={10} lg={9} xl={8}>

      <div
        className="text-center"
        style={{
          animation: "fadeIn .4s ease",
        }}
      >
        <div
          style={{
            width: 90,
            height: 90,
            margin: "0 auto 25px",
            borderRadius: "50%",
            background: "#13283F",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            boxShadow: "0 0 40px rgba(0,194,255,.15)",
          }}
        >
          <FaRobot
            size={42}
            color="#00C2FF"
          />
        </div>

        <p
          style={{
            color: "#8A9BB5",
            fontSize: 18,
            maxWidth: 650,
            margin: "auto",
            lineHeight: 1.8,
          }}
        >
          Saya dapat membantu membuat website,
          memperbaiki kode, menjelaskan materi,
          menganalisis file, serta menjawab berbagai
          pertanyaan.
        </p>

      </div>

    </Col>
  </Row>
)}

       {/* Chat */}
<Row
className="justify-content-center"
style={{
    flex:1,
}}
>
  <Col xs={12}>

  <div
style={{
    display:"flex",
    flexDirection:"column",
    gap:18,
    overflowY:"auto",
    padding:"0 6px 140px",
}}
>

      {messages.map((msg, index) => (
  <div
    key={index}
    style={{
      display: "flex",
      justifyContent:
        msg.role === "user"
          ? "flex-end"
          : "flex-start",
      width: "100%",
    }}
  >
    <div
      style={{
        background:
          msg.role === "user"
            ? "#00C2FF"
            : "#13283F",

        color:
          msg.role === "user"
            ? "#081420"
            : "#FFFFFF",

        padding: "14px 18px",

        borderRadius:
          msg.role === "user"
            ? "22px 22px 6px 22px"
            : "22px 22px 22px 6px",

        lineHeight: 1.7,
        fontSize: 16,

       maxWidth:"78%",
minWidth:90,
border:"1px solid rgba(255,255,255,.05)",

        wordBreak: "break-word",
        whiteSpace: "pre-wrap",

        boxShadow:
          "0 8px 20px rgba(0,0,0,.18)",
      }}
    >
      {msg.content}
    </div>
  </div>
))}

     

      {loading && (

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >

          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              background: "#13283F",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <FaRobot
              color="#00C2FF"
            />
          </div>

          <div
            style={{
              background: "#13283F",
              padding: "14px 18px",
              borderRadius: "20px 20px 20px 4px",
              color: "#8A9BB5",
              fontStyle: "italic",
            }}
          >
            AI.Ind sedang mengetik...
          </div>

        </div>

      )}

    </div>

  </Col>
</Row>

      </Container>

     {/* Input */}
<div
  style={{
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    background: "#081420",
    padding: "18px 24px 24px",
    borderTop: "1px solid rgba(255,255,255,.08)",
    backdropFilter: "blur(12px)",
    zIndex: 999,
  }}
>
  <Container
  fluid
  className="h-100 px-0"
>
  <Row className="justify-content-center h-100 m-0">

    <Col
      xs={12}
      md={11}
      lg={9}
      xl={8}
      xxl={7}
      className="d-flex flex-column px-3"
    >
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            kirimPesan();
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 12,
              width: "100%",
              background: "#13283F",
              border: "1px solid #1F3850",
              borderRadius: 26,
              padding:"12px 6px",
              boxShadow: "0 10px 30px rgba(0,0,0,.25)",
            }}
          >


            <Form.Control className="border-0 shadow-none"
              as="textarea"
              rows={1}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  kirimPesan();
                }
              }}
              placeholder="Ketik pertanyaan untuk AI.Ind..."
              style={{
                flex: 1,
                width: "100%",
                minWidth: 0,
                resize: "none",
                overflowY: "auto",
                background: "transparent",
                border: "none",
                color: "#fff",
                boxShadow: "none",
                fontSize: 16,
                lineHeight: "26px",
                padding: "10px 4px",
                minHeight: 48,
                maxHeight: 180,
              }}
            />

            <Button
              type="submit"
              disabled={loading}
              style={{
                width:50,
height:50,
                borderRadius: "50%",
                border: "none",
                background: loading ? "#4B647A" : "#00C2FF",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              {loading ? (
                <span
                  style={{
                    color: "#081420",
                    fontWeight: "bold",
                    fontSize: 18,
                  }}
                >
                  ...
                </span>
              ) : (
                <FaPaperPlane color="#081420" size={16} />
              )}
            </Button>

          </div>

        </Form>

        <div
          style={{
            marginTop: 12,
            textAlign: "center",
            color: "#6F849A",
            fontSize: 12,
          }}
        >
          AI.Ind dapat membuat kesalahan. Selalu periksa kembali jawaban penting.
        </div>

      </Col>
    </Row>

  </Container>
</div>
</div>
  );
}

export default Home;