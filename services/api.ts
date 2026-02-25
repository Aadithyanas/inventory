import axios from "axios";

const API = axios.create({
  baseURL: "https://inventory-jtvu.onrender.com/api",
});

export default API;
