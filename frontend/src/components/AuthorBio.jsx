import React from "react";
import { LocalizedLink } from "@/i18n/links";

const LINK_CLASS = "text-gold-bright underline decoration-bronze/50 underline-offset-2 hover:text-gold";

// Shared across every guide article via the {{AUTHOR_BIO}} marker (same
// mechanism as the embedded charts) — renders identically everywhere on
// purpose, so attribution stays consistent instead of drifting across 10
// hand-written variants.
export default function AuthorBio() {
  return (
    <div className="guide-embed" data-testid="author-bio">
      <span className="tech-label text-gold-bright">About the author</span>
      <p className="mt-2 font-body text-sm leading-relaxed text-cream/75">
        This guide was written by The Ascendancy Team, the people who build and maintain Ascendancy's simulator,
        hero classification system and every article in this archive. Because we build the mechanics ourselves,
        this content reflects how the system actually works, not just how it's documented to work.{" "}
        <LocalizedLink to="/about" className={LINK_CLASS}>
          Learn more about Ascendancy
        </LocalizedLink>
        .
      </p>
    </div>
  );
}
