import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { AdMob } from "@capgo/capacitor-admob";
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

// Test Banner Ad Unit ID Google
// Gunakan ini dulu untuk memastikan AdMob berjalan.
const BANNER_AD_UNIT_ID = "ca-app-pub-3940256099942544/6300978111";

function App() {
  useEffect(() => {
    const showBanner = async () => {
      // Jangan jalankan AdMob ketika dibuka melalui browser/Vite
      if (!Capacitor.isNativePlatform()) {
        console.log("AdMob: bukan aplikasi Android/iOS");
        return;
      }

      try {
        console.log("AdMob: memulai...");

        // Memulai AdMob SDK
        await AdMob.start();

        console.log("AdMob: SDK berhasil dimulai");

        // Membuat instance banner
        await AdMob.adCreate({
          adUnitId: BANNER_AD_UNIT_ID,
        });

        console.log("AdMob: banner berhasil dibuat");

        // Memuat iklan
        await AdMob.adLoad({
          id: 1,
        });

        console.log("AdMob: banner berhasil dimuat");

        // Menampilkan iklan
        await AdMob.adShow({
          id: 1,
        });

        console.log("AdMob: banner berhasil ditampilkan");
      } catch (error) {
        console.error("AdMob Error:", error);
      }
    };

    showBanner();
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Home />} />

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />
    </Routes>
  );
}

export default App;