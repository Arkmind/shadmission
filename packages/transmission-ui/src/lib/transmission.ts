import { Transmission } from "@ctrl/transmission";

export const client = new Transmission({
  baseUrl: import.meta.env.VITE_TRANSMISSION_URL || "http://localhost:9091",
  username: import.meta.env.VITE_TRANSMISSION_USER || "arky",
  password: import.meta.env.VITE_TRANSMISSION_PASS || "arky",
});
