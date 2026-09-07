import React, { lazy } from "react";
import { BrowserRouter, useRoutes } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { SoundProvider } from "@/context/SoundContext";
import Layout from "@/components/Layout";
import { DefaultLocaleGate, LocaleGate, RootLocaleRedirect } from "@/i18n/RouteGuards";

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
const ResetPassword = lazy(() => import("@/pages/ResetPassword"));
const ProductInfo = lazy(() => import("@/pages/ProductInfo"));
const About = lazy(() => import("@/pages/About"));
const PrivacyPolicy = lazy(() => import("@/pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("@/pages/TermsOfService"));
const Guides = lazy(() => import("@/pages/Guides"));
const GuideArticle = lazy(() => import("@/pages/GuideArticle"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Single source of truth for the page tree, shared by the unprefixed
// (English) route tree and every /:lang-prefixed one — so adding a page
// means adding one entry here, not one entry per locale. Path segments are
// relative (no leading "/") since both parents mount this under themselves.
const pageRoutes = [
  { index: true, element: <Home /> },
  { path: "simulator", element: <Simulator /> },
  { path: "ascendancy", element: <Ascendancy /> },
  { path: "leaderboard", element: <Leaderboard /> },
  { path: "profile", element: <Profile /> },
  { path: "achievements", element: <Achievements /> },
  { path: "auth", element: <Auth /> },
  { path: "reset-password", element: <ResetPassword /> },
  { path: "product/:slug", element: <ProductInfo /> },
  { path: "account/:slug", element: <ProductInfo /> },
  { path: "about", element: <About /> },
  { path: "privacy-policy", element: <PrivacyPolicy /> },
  { path: "terms-of-service", element: <TermsOfService /> },
  { path: "guides", element: <Guides /> },
  { path: "guides/:slug", element: <GuideArticle /> },
  { path: "*", element: <NotFound /> },
];

// Every route below except the homepage is a straight reuse of pageRoutes
// for the unprefixed English tree. The homepage alone gets the storage-
// preference redirect, and only there — every other unprefixed URL is an
// existing indexed link and must never redirect (see RouteGuards.jsx).
const routes = [
  {
    element: (
      <DefaultLocaleGate>
        <Layout />
      </DefaultLocaleGate>
    ),
    children: [
      { index: true, element: <RootLocaleRedirect><Home /></RootLocaleRedirect> },
      ...pageRoutes.slice(1),
    ],
  },
  {
    path: ":lang",
    element: <LocaleGate />,
    children: [{ element: <Layout />, children: pageRoutes }],
  },
];

function AppRoutes() {
  return useRoutes(routes);
}

export default function App() {
  return (
    <AuthProvider>
      <SoundProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SoundProvider>
    </AuthProvider>
  );
}
