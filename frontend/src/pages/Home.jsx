import { Container, Row, Col, Card, Button, Form } from "react-bootstrap";
import { FaCode, FaComments, FaFileAlt, FaPaperPlane } from "react-icons/fa";

function Home() {
  return (
    <div
      style={{
        background: "#081420",
        minHeight: "100vh",
        color: "#fff",
        padding: "20px",
      }}
    >
      <Container fluid>

        {/* Header */}
        <Row className="mb-5">
          <Col className="text-center">
            <h1
              style={{
                fontWeight: "700",
                color: "#00C2FF",
              }}
            >
              AI.Ind
            </h1>

            <p
              style={{
                color: "#9CA3AF",
                fontSize: "17px",
              }}
            >
              Artificial Intelligence Indonesia
            </p>
          </Col>
        </Row>

        {/* Logo */}
        <Row className="justify-content-center mb-4">
          <Col xs={12} className="text-center">
            <div
              style={{
                width: 120,
                height: 120,
                margin: "auto",
                borderRadius: "50%",
                background: "#0F2235",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "55px",
              }}
            >
                🤖
            </div>

            <h3 className="mt-4">
              Halo 👋
            </h3>

            <p style={{ color: "#9CA3AF" }}>
              Ada yang bisa saya bantu hari ini?
            </p>
          </Col>
        </Row>

        {/* Menu */}
        <Row className="g-3 mb-5">

          <Col xs={12} md={4}>
            <Card
              bg="dark"
              text="light"
              style={{
                borderRadius: 18,
                cursor: "pointer",
                border: "1px solid #1F3B56",
              }}
            >
              <Card.Body className="text-center">
                <FaCode size={32} color="#00C2FF" />
                <h5 className="mt-3">Coding</h5>
                <small>Membuat dan memperbaiki kode.</small>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} md={4}>
            <Card
              bg="dark"
              text="light"
              style={{
                borderRadius: 18,
                cursor: "pointer",
                border: "1px solid #1F3B56",
              }}
            >
              <Card.Body className="text-center">
                <FaComments size={32} color="#00C2FF" />
                <h5 className="mt-3">Ngobrol</h5>
                <small>Cerita dan tanya apa saja.</small>
              </Card.Body>
            </Card>
          </Col>

          <Col xs={12} md={4}>
            <Card
              bg="dark"
              text="light"
              style={{
                borderRadius: 18,
                cursor: "pointer",
                border: "1px solid #1F3B56",
              }}
            >
              <Card.Body className="text-center">
                <FaFileAlt size={32} color="#00C2FF" />
                <h5 className="mt-3">Analisis</h5>
                <small>Analisis file dan dokumen.</small>
              </Card.Body>
            </Card>
          </Col>

        </Row>

        {/* Input */}
        <Row className="justify-content-center">
          <Col lg={8} md={10} xs={12}>

            <Form>

              <div
                style={{
                  display: "flex",
                  gap: "10px",
                }}
              >

                <Form.Control
                  placeholder="Tulis pertanyaan..."
                  style={{
                    height: "55px",
                    borderRadius: "15px",
                    background: "#13283F",
                    color: "#fff",
                    border: "none",
                  }}
                />

                <Button
                  style={{
                    width: "60px",
                    borderRadius: "15px",
                    background: "#00C2FF",
                    border: "none",
                  }}
                >
                  <FaPaperPlane />
                </Button>

              </div>

            </Form>

          </Col>
        </Row>

      </Container>
    </div>
  );
}

export default Home;
