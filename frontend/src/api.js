import axios from "axios";

const api = axios.create({
  baseURL: "https://aiind-bc6e94a5.fastapicloud.dev",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;