import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SoundProvider } from "@/context/SoundContext";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import Simulator from "@/pages/Simulator";
import Ascendancy from "@/pages/Ascendancy";
import Leaderboard from "@/pages/Leaderboard";
import Profile from "@/pages/Profile";
import Achievements from "@/pages/Achievements";
import Auth from "@/pages/Auth";

const SEO_LANDING = {
  "/typing-speed-test": { title: "Typing Speed Test | Ascendancy", description: "Take a free typing speed test. Measure your WPM, accuracy and consistency, then unlock hero classifications on Ascendancy." },
  "/wpm-test": { title: "WPM Test | Ascendancy", description: "Test your WPM instantly. Run typing simulations, track your best words per minute and ascend the Ascendancy rankings." },
  "/typing-test": { title: "Typing Test | Ascendancy", description: "A futuristic typing test that measures speed, accuracy and consistency and classifies your performance." },
  "/typing-practice": { title: "Typing Practice | Ascendancy", description: "Practice typing with focused simulations. Improve WPM and accuracy while progressing through hero classifications." },
};

export default function App() {
  return (
    <AuthProvider>
      <SoundProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/simulator" element={<Simulator />} />
              <Route path="/ascendancy" element={<Ascendancy />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/achievements" element={<Achievements />} />
              <Route path="/auth" element={<Auth />} />
              {Object.entries(SEO_LANDING).map(([path, seo]) => (
                <Route key={path} path={path} element={<Home seo={seo} />} />
              ))}
              <Route path="*" element={<Home />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </SoundProvider>
    </AuthProvider>
  );
}
