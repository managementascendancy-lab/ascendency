import React, { useEffect } from "react";

const SITE_URL = "https://ascendancytyping.com";
const JSONLD_ID = "seo-jsonld";

function setMetaByName(name, content) {
  if (content == null) return;
  let tag = document.querySelector(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setMetaByProperty(property, content) {
  if (content == null) return;
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setLinkRel(rel, href) {
  if (href == null) return;
  let tag = document.querySelector(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }
  tag.setAttribute("href", href);
}

// Sets/updates document title, description, canonical, Open Graph, Twitter
// card and JSON-LD tags. Always updates an existing tag in place rather than
// appending a new one, so repeated navigation (client-side routing) never
// accumulates duplicate <meta>/<link> tags in <head>.
export default function SEO({ title, description, canonical, image, type = "website", publishedTime, jsonLd }) {
  useEffect(() => {
    if (title) document.title = title;

    setMetaByName("description", description);
    setMetaByProperty("og:title", title);
    setMetaByProperty("og:description", description);
    setMetaByProperty("og:type", type);

    const url = canonical || `${SITE_URL}${window.location.pathname}`;
    setMetaByProperty("og:url", url);
    setLinkRel("canonical", url);

    if (image) setMetaByProperty("og:image", image);
    setMetaByName("twitter:card", image ? "summary_large_image" : "summary");
    setMetaByName("twitter:title", title);
    setMetaByName("twitter:description", description);
    if (image) setMetaByName("twitter:image", image);
    if (publishedTime) setMetaByProperty("article:published_time", publishedTime);

    let ldScript = document.getElementById(JSONLD_ID);
    if (jsonLd) {
      if (!ldScript) {
        ldScript = document.createElement("script");
        ldScript.type = "application/ld+json";
        ldScript.id = JSONLD_ID;
        document.head.appendChild(ldScript);
      }
      ldScript.textContent = JSON.stringify(jsonLd);
    } else if (ldScript) {
      ldScript.remove();
    }
  }, [title, description, canonical, image, type, publishedTime, jsonLd]);

  return null;
}
