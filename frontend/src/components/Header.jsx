import { FaUserCircle } from "react-icons/fa";

function Header() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: window.innerWidth < 768
  ? "18px 18px 18px 78px"
  : "18px 10px",
        borderBottom: "1px solid rgba(255,255,255,.08)",
      }}
    >
      <div>
        <h2
          style={{
            margin: 0,
            color: "#00C2FF",
          }}
        >
          AI.Ind
        </h2>

        <div
          style={{
            color: "#8A9BB5",
            marginTop: 8,
          }}
        >
          Buatan Indonesia
        </div>
      </div>

      <FaUserCircle
        size={54}
        color="#00C2FF"
      />
    </div>
  );
}

export default Header;