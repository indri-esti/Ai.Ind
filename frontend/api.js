import axios from "axios";

const api = axios.create({
  baseURL: "http://10.116.214.149:5000",
});

export default api;
