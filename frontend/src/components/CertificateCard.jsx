import React, { forwardRef } from "react";

function formatDate(d) {
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

// Offscreen-rendered landscape certificate, resume/portfolio-appropriate.
const CertificateCard = forwardRef(function CertificateCard({ result, recipientName, certId }, ref) {
  return (
    <div
      ref={ref}
      style={{
        width: 1000,
        height: 700,
        position: "relative",
        backgroundColor: "#0B0F2A",
        fontFamily: "'Chakra Petch', sans-serif",
        color: "#F5EFE5",
        boxSizing: "border-box",
        padding: 28,
      }}
    >
      {/* outer frame */}
      <div style={{ position: "absolute", inset: 28, border: "2px solid #C88900" }} />
      <div style={{ position: "absolute", inset: 36, border: "1px solid #875327" }} />

      {/* corner marks */}
      {[
        { top: 20, left: 20 },
        { top: 20, right: 20 },
        { bottom: 20, left: 20 },
        { bottom: 20, right: 20 },
      ].map((pos, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 14,
            height: 14,
            border: "2px solid #F5C542",
            borderRight: pos.left !== undefined ? "none" : "2px solid #F5C542",
            borderBottom: pos.top !== undefined ? "none" : "2px solid #F5C542",
            borderLeft: pos.right !== undefined ? "none" : "2px solid #F5C542",
            borderTop: pos.bottom !== undefined ? "none" : "2px solid #F5C542",
            ...pos,
          }}
        />
      ))}

      <div style={{ position: "relative", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "56px 90px 40px" }}>
        <div style={{ fontSize: 13, letterSpacing: 5, color: "#8AA073" }}>ASCENDANCY PERFORMANCE NETWORK</div>
        <div style={{ fontSize: 34, fontWeight: 700, letterSpacing: 3, marginTop: 14, color: "#F5EFE5" }}>
          CERTIFICATE OF TYPING PROFICIENCY
        </div>
        <div style={{ width: 120, height: 2, background: "#C88900", marginTop: 18 }} />

        <div style={{ fontSize: 13, letterSpacing: 2, color: "#F5EFE5AA", marginTop: 30 }}>THIS CERTIFIES THAT</div>
        <div style={{ fontSize: 40, fontWeight: 700, letterSpacing: 1, marginTop: 8, color: "#F5C542" }}>
          {recipientName}
        </div>
        <div style={{ fontSize: 13, letterSpacing: 2, color: "#F5EFE5AA", marginTop: 14, maxWidth: 560, textAlign: "center", lineHeight: 1.6 }}>
          HAS DEMONSTRATED A VERIFIED TYPING PERFORMANCE OF
        </div>

        <div style={{ fontSize: 84, fontWeight: 700, lineHeight: 1, marginTop: 10, color: "#F5EFE5" }}>
          {Math.round(result.wpm)} <span style={{ fontSize: 28, color: "#F5C542", letterSpacing: 2 }}>WPM</span>
        </div>

        <div style={{ display: "flex", gap: 60, marginTop: 30 }}>
          {[
            ["ACCURACY", `${result.accuracy.toFixed(0)}%`],
            ["CONSISTENCY", `${Math.round(result.consistency)}%`],
          ].map(([k, v]) => (
            <div key={k} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "#8AA073" }}>{k}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 4, color: "#F5EFE5" }}>{v}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #875327", paddingTop: 16 }}>
          <div style={{ textAlign: "left" }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#8AA073" }}>DATE ISSUED</div>
            <div style={{ fontSize: 13, marginTop: 3 }}>{formatDate(new Date())}</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                border: "2px solid #F5C542",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 10,
                letterSpacing: 1,
                color: "#F5C542",
                textAlign: "center",
              }}
            >
              VERIFIED
            </div>
            <div style={{ fontSize: 9, letterSpacing: 1, color: "#8AA073", marginTop: 6 }}>ASCENDANCY NETWORK</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: "#8AA073" }}>CERTIFICATE ID</div>
            <div style={{ fontSize: 13, marginTop: 3, fontFamily: "'JetBrains Mono', monospace" }}>{certId}</div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CertificateCard;
