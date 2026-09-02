import React, { lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SoundProvider } from "@/context/SoundContext";
import Layout from "@/components/Layout";

// Every page is its own chunk — none of them (nor the heavy libs a couple
// of them pull in, e.g. three/@react-three/fiber on Home, framer-motion on
// Simulator) ship in the shared/main bundle. Layout itself stays a static
// import since it's the persistent chrome (nav/footer/background) present
// on every route. See Layout.jsx for the Suspense boundary around <Outlet/>.
const Home = lazy(() => import("@/pages/Home"));
const Simulator = lazy(() => import("@/pages/Simulator"));
const Ascendancy = lazy(() => import("@/pages/Ascendancy"));
const Leaderboard = lazy(() => import("@/pages/Leaderboard"));
const Profile = lazy(() => import("@/pages/Profile"));
const Achievements = lazy(() => import("@/pages/Achievements"));
const Auth = lazy(() => import("@/pages/Auth"));
const ProductInfo = lazy(() => import("@/pages/ProductInfo"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const Guides = lazy(() => import("@/pages/Guides"));
const GuideArticle = lazy(() => import("@/pages/GuideArticle"));

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
              <Route path="/product/:slug" element={<ProductInfo />} />
              <Route path="/account/:slug" element={<ProductInfo />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms-of-service" element={<TermsOfService />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/guides/:slug" element={<GuideArticle />} />
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
