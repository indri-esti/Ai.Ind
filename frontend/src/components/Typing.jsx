import { Spinner } from "react-bootstrap";
import { FaRobot } from "react-icons/fa";

function Typing() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "8px",
        marginTop: "6px",
        marginBottom: "4px",
        paddingLeft: "2px",
      }}
    >
      <FaRobot
        color="#00C2FF"
        size={18}
        style={{
          flexShrink: 0,
          marginBottom: "6px",
        }}
      />

      <div
        style={{
          background: "#13283F",
          color: "#AFC3D6",
          padding: "10px 16px",
          borderRadius: "18px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          width: "fit-content",
          maxWidth: "220px",
          minHeight: "42px",
          boxShadow: "0 2px 8px rgba(0,0,0,.18)",
        }}
      >
        <Spinner
          animation="border"
          size="sm"
          variant="info"
        />

        <span
          style={{
            fontSize: "14px",
            lineHeight: "20px",
            whiteSpace: "nowrap",
          }}
        >
          AI.Ind sedang mengetik...
        </span>
      </div>
    </div>
  );
}

export default Typing;