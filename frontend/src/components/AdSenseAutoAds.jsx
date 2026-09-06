import { useEffect } from "react";

const ADSENSE_CLIENT_ID = process.env.REACT_APP_ADSENSE_CLIENT_ID;
const ADSENSE_SRC = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";

// Opts into Google AdSense Auto ads — Google's own system then decides what
// ad formats to show, where on the page, and how often (this is also what
// serves full-screen "vignette" interstitials between page views on mobile),
// with no placement/frequency logic of ours involved. No-ops entirely until
// a real AdSense publisher ID is set in REACT_APP_ADSENSE_CLIENT_ID.
export default function AdSenseAutoAds() {
  useEffect(() => {
    if (!ADSENSE_CLIENT_ID) return;
    if (document.querySelector(`script[src^="${ADSENSE_SRC}"]`)) return;

    const script = document.createElement("script");
    script.async = true;
    script.src = `${ADSENSE_SRC}?client=${ADSENSE_CLIENT_ID}`;
    script.crossOrigin = "anonymous";
    document.head.appendChild(script);

    window.adsbygoogle = window.adsbygoogle || [];
    window.adsbygoogle.push({
      google_ad_client: ADSENSE_CLIENT_ID,
      enable_page_level_ads: true,
    });
  }, []);

  return null;
}
