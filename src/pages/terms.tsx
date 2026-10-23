import React, { useEffect, useState } from "react";

const BASE_URL =
  "https://shriecom.in/appapis/shreefood/public/api/legal/terms/delivery_rider?role=delivery_rider";

interface ClauseItem {
  title: string;
  content: string;
}

interface TermsPageProps {
  onBack: () => void;
}

const TermsPage: React.FC<TermsPageProps> = ({ onBack }) => {
  const [sections, setSections] = useState<ClauseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTerms = async () => {
      try {
        setLoading(true);
        const response = await fetch(BASE_URL);
        const result = await response.json();
        if (result.success) {
          setSections(result.clauses || []);
        } else {
          setError(result.message || "Failed to load terms.");
        }
      } catch (err) {
        setError("Network error while loading terms.");
      } finally {
        setLoading(false);
      }
    };
    fetchTerms();
  }, []);

  return (
    <div style={{ background: "#FFFBEB", minHeight: "100vh", paddingBottom: 40, fontFamily: "sans-serif" }}>
      
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "#FFFBEB", borderBottom: "1px solid #F0E8C0",
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12
      }}>
        <div
          onClick={onBack}
          style={{
            width: 38, height: 38, borderRadius: 12,
            background: "white", border: "1.5px solid #E8DFC0",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", flexShrink: 0
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1A1714" strokeWidth="2">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </div>
        <h2 style={{ fontSize: 17, fontWeight: 900, color: "#1A1714", margin: 0 }}>Terms of Service</h2>
      </div>

      {/* Hero */}
      <div style={{
        background: "linear-gradient(135deg,#1A1714,#2D2520)",
        padding: "28px 20px", textAlign: "center"
      }}>
        <h1 style={{ fontSize: 22, fontWeight: 900, color: "white", margin: 0 }}>📋 Terms of Service</h1>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 6, fontWeight: 600 }}>
          Please read these terms carefully before using our services
        </p>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 16px" }}>

        {loading && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 20px" }}>
            <div style={{
              width: 32, height: 32, border: "3px solid #E07B00",
              borderTop: "3px solid transparent", borderRadius: "50%",
              animation: "spin 0.8s linear infinite"
            }} />
            <p style={{ marginTop: 10, color: "#1A1714", fontWeight: 600, fontSize: 13 }}>
              Loading terms...
            </p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {!loading && error && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ color: "#dc2626", fontWeight: 700, fontSize: 14 }}>⚠️ {error}</p>
          </div>
        )}

        {!loading && !error && sections.map((s, i) => (
          <div key={i} style={{
            marginBottom: 16, background: "white",
            borderRadius: 16, padding: 16,
            border: "1px solid #EAE5DF"
          }}>
            <div style={{ fontSize: 14, fontWeight: 900, color: "#1A1714", marginBottom: 8 }}>
              {s.title}
            </div>
            <div style={{
              fontSize: 13, color: "#5C4A2A",
              lineHeight: 1.75, fontWeight: 600, whiteSpace: "pre-line"
            }}>
              {s.content}
            </div>
          </div>
        ))}

        {!loading && !error && sections.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <p style={{ color: "#9B8E84", fontSize: 13 }}>No terms available.</p>
          </div>
        )}

        {/* Contact */}
        <div style={{
          background: "rgba(224,123,0,0.07)",
          border: "1px solid rgba(224,123,0,0.2)",
          borderRadius: 16, padding: 16,
          textAlign: "center", marginTop: 20
        }}>
          <p style={{ fontSize: 13, color: "#1A1714", fontWeight: 700, lineHeight: 1.6, margin: 0 }}>
            Questions? Contact us at{" "}
            <a href="mailto:shrient.99@gmail.com" style={{ color: "#E07B00", fontWeight: 800, textDecoration: "none" }}>
              shrient.99@gmail.com
            </a>
            {" "}or write to Shri Enterprises, Lucknow, UP - 226004.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;