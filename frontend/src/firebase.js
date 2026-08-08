import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCkXHc3nSR7--y-93bxAB8Lr-Meme1bN80",
  authDomain: "ai-ind-c3f64.firebaseapp.com",
  projectId: "ai-ind-c3f64",
  storageBucket: "ai-ind-c3f64.firebasestorage.app",
  messagingSenderId: "531938783552",
  appId: "1:531938783552:web:e797cae4a7542e6addcaa5",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();