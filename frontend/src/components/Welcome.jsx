import { FaRobot } from "react-icons/fa";

function Welcome({ messages = [] }) {
  if (messages.length > 0) {
    return null;
  }

  return (
    <div className="aiind-welcome">
      <div className="aiind-welcome-logo">
        <FaRobot size={52} color="#00C2FF" />
      </div>

      <h2>
        Selamat Datang di{" "}
        <span>AI.Ind</span>
      </h2>

      <p>
        Saya dapat membantu membuat website, memperbaiki
        kode, menjelaskan materi, menganalisis file,
        menjawab pertanyaan, membantu belajar, serta
        berbagai kebutuhan pemrograman dan teknologi
        lainnya.
      </p>
    </div>
  );
}

export default Welcome;