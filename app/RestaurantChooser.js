"use client";
import { useState, useCallback } from "react";

const CUISINES = [
  { label: "🍕 Italian", google: "italian_restaurant" },
  { label: "🍣 Japanese", google: "japanese_restaurant" },
  { label: "🌮 Mexican", google: "mexican_restaurant" },
  { label: "🍜 Chinese", google: "chinese_restaurant" },
  { label: "🥗 American", google: "american_restaurant" },
  { label: "🧆 Mediterranean", google: "mediterranean_restaurant" },
  { label: "🍛 Indian", google: "indian_restaurant" },
  { label: "🥐 French", google: "french_restaurant" },
  { label: "🍔 Burgers", google: "hamburger_restaurant" },
  { label: "🌶️ Thai", google: "thai_restaurant" },
  { label: "🥩 Steakhouse", google: "steak_house" },
  { label: "🐟 Seafood", google: "seafood_restaurant" },
  { label: "🍷 Portuguese", google: "spanish_restaurant" },
];

const VIBES = [
  "💼 Business Lunch", "💑 Date Night", "🎉 Celebration",
  "👨‍👩‍👧 Family Friendly", "🍻 Casual Hangout", "🌿 Healthy & Light",
  "🎂 Special Occasion", "⚡ Quick Bite",
];

const BUDGETS = [
  { label: "€ Under €15", google: 1 },
  { label: "€€ €15–€35", google: 2 },
  { label: "€€€ €35–€60", google: 3 },
  { label: "€€€€ €60+", google: 4 },
];

const DISTANCES = [
  { label: "🚶 Walking (< 0.5 km)", meters: 500 },
  { label: "🚗 Nearby (< 2 km)", meters: 2000 },
  { label: "🛣️ Worth the trip (< 10 km)", meters: 10000 },
  { label: "✈️ Anywhere", meters: 50000 },
];

const PRICE_SYMBOLS = ["", "€", "€€", "€€€", "€€€€"];

function Chip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "0.5rem 1rem",
        borderRadius: "2rem",
        border: selected ? "1.5px solid #c9a84c" : "1.5px solid #333",
        background: selected ? "rgba(201,168,76,0.15)" : "transparent",
        color: selected ? "#c9a84c" : "#aaa",
        cursor: "pointer",
        fontSize: "0.85rem",
        fontFamily: "'DM Sans', sans-serif",
        transition: "all 0.18s ease",
        margin: "0.25rem",
      }}
    >
      {label}
    </button>
  );
}

function Step({ label, children }) {
  return (
    <div style={{ marginBottom: "2rem" }}>
      <div style={{
        fontFamily: "'Playfair Display', serif",
        fontSize: "0.7rem",
        letterSpacing: "0.2em",
        textTransform: "uppercase",
        color: "#c9a84c",
        marginBottom: "0.75rem",
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}

function StarBar({ rating }) {
  const pct = (rating / 10) * 100;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
      <div style={{ width: "60px", height: "4px", background: "#222", borderRadius: "2px", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: "#c9a84c", borderRadius: "2px" }} />
      </div>
      <span style={{ fontSize: "0.75rem", color: "#c9a84c" }}>{(rating / 2).toFixed(1)}</span>
    </div>
  );
}

function RestaurantCard({ r, onSelect, highlighted }) {
  const [hovered, setHovered] = useState(false);
  const distLabel = r.distance < 1000 ? `${r.distance}m` : `${(r.distance / 1000).toFixed(1)} km`;
  return (
    <div
      onClick={() => onSelect(r)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: highlighted ? "linear-gradient(135deg, #1a1506 0%, #111 100%)" : "#111",
        border: `1.5px solid ${highlighted ? "#c9a84c" : hovered ? "#444" : "#1e1e1e"}`,
        borderRadius: "1rem",
        padding: "1.25rem 1.5rem",
        marginBottom: "0.75rem",
        cursor: "pointer",
        transition: "all 0.18s ease",
        transform: hovered ? "translateX(4px)" : "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {highlighted && (
            <div style={{ color: "#c9a84c", fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.3rem" }}>
              Tonight's pick ✦
            </div>
          )}
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: "1.05rem", marginBottom: "0.3rem" }}>
            {r.name}
          </div>
          <div style={{ fontSize: "0.78rem", color: "#666" }}>
            {r.categories?.[0]?.name}
            {r.distance != null && <span> · {distLabel}</span>}
            {r.location?.address && <span> · {r.location.address}</span>}
          </div>
          {r.rating && <div style={{ marginTop: "0.4rem" }}><StarBar rating={r.rating} /></div>}
        </div>
        <div style={{ textAlign: "right", flexShrink: 0 }}>
          {r.price && (
            <div style={{ color: "#c9a84c", fontSize: "0.9rem", fontWeight: 500 }}>
              {PRICE_SYMBOLS[r.price]}
            </div>
          )}
          {r.hours?.open_now !== undefined && (
            <div style={{ fontSize: "0.72rem", marginTop: "0.25rem", color: r.hours.open_now ? "#5a9" : "#944" }}>
              {r.hours.open_now ? "Open now" : "Closed"}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RestaurantChooser() {
  const [cuisine, setCuisine] = useState([]);
  const [vibe, setVibe] = useState([]);
  const [budget, setBudget] = useState([]);
  const [distance, setDistance] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [picked, setPicked] = useState(null);
  const [locationLabel, setLocationLabel] = useState(null);

  const toggle = (arr, setArr, val) => {
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]);
    setResults(null);
    setPicked(null);
  };

  const getLocation = () =>
    new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation not supported"));
      navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 });
    });

  const fetchRestaurants = useCallback(async (surpriseMode = false) => {
    setLoading(true);
    setError(null);
    setResults(null);
    setPicked(null);

    try {
      const pos = await getLocation();
      const { latitude, longitude } = pos.coords;
      setLocationLabel(`📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);

      const selectedDist = distance.length
        ? DISTANCES.find(d => d.label === distance[distance.length - 1])?.meters
        : 2000;

      const selectedCuisines =
        surpriseMode && cuisine.length === 0
          ? [CUISINES[Math.floor(Math.random() * CUISINES.length)]]
          : cuisine.length > 0
          ? CUISINES.filter(c => cuisine.includes(c.label))
          : [];

      const categoryIds = selectedCuisines.map(c => c.google).join(",") || "restaurant";

      const params = new URLSearchParams({
        ll: `${latitude},${longitude}`,
        categories: categoryIds,
        radius: String(selectedDist || 50000),
        limit: "20",
        sort: "RATING",
        fields: "name,categories,distance,location,rating,price,hours,fsq_id",
      });

      if (budget.length === 1) {
        const b = BUDGETS.find(b => b.label === budget[0]);
        if (b) {
          params.append("min_price", String(b.google));
          params.append("max_price", String(b.google));
        }
      }

      const res = await fetch(`/api/restaurants?${params.toString()}`);
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      const places = data.results || [];

      if (places.length === 0) {
        setError("No restaurants found nearby. Try adjusting your filters.");
        setLoading(false);
        return;
      }

      setResults(places);
      if (surpriseMode) setPicked(places[Math.floor(Math.random() * Math.min(places.length, 10))]);
    } catch (e) {
      if (e.code === 1) setError("Location access denied. Please allow location and try again.");
      else setError(e.message || "Something went wrong.");
    }

    setLoading(false);
  }, [cuisine, budget, distance]);

  return (
    <div style={{ minHeight: "100vh", background: "#0d0d0d", color: "#f0ece0", fontFamily: "'DM Sans', sans-serif", padding: "2rem" }}>
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={{ fontSize: "0.7rem", letterSpacing: "0.3em", color: "#c9a84c", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Tonight's Question
          </div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(2rem, 5vw, 3.5rem)", fontWeight: 400, margin: 0, lineHeight: 1.1 }}>
            Where should<br /><em>we eat?</em>
          </h1>
          <div style={{ width: "3rem", height: "1px", background: "#c9a84c", margin: "1.5rem auto 0.5rem" }} />
          <div style={{ fontSize: "0.8rem", color: "#555" }}>
            {locationLabel || "Real restaurants near your location"}
          </div>
        </div>

        {/* Filters */}
        <Step label="Cuisine">
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {CUISINES.map(c => (
              <Chip key={c.label} label={c.label} selected={cuisine.includes(c.label)} onClick={() => toggle(cuisine, setCuisine, c.label)} />
            ))}
          </div>
        </Step>

        <Step label="Vibe">
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {VIBES.map(v => (
              <Chip key={v} label={v} selected={vibe.includes(v)} onClick={() => toggle(vibe, setVibe, v)} />
            ))}
          </div>
        </Step>

        <Step label="Budget">
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {BUDGETS.map(b => (
              <Chip key={b.label} label={b.label} selected={budget.includes(b.label)} onClick={() => toggle(budget, setBudget, b.label)} />
            ))}
          </div>
        </Step>

        <Step label="Distance">
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {DISTANCES.map(d => (
              <Chip key={d.label} label={d.label} selected={distance.includes(d.label)} onClick={() => toggle(distance, setDistance, d.label)} />
            ))}
          </div>
        </Step>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem" }}>
          <button
            onClick={() => fetchRestaurants(false)}
            disabled={loading}
            style={{
              flex: 1, minWidth: "160px", padding: "0.9rem 2rem",
              background: loading ? "#7a6530" : "#c9a84c", color: "#0d0d0d",
              border: "none", borderRadius: "2rem",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 600,
              fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
            }}
          >
            {loading ? (
              <>
                <span style={{ display: "inline-block", width: 14, height: 14, border: "2px solid #0d0d0d", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                Finding…
              </>
            ) : (
              <>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" /><circle cx="12" cy="10" r="3" />
                </svg>
                Find Restaurants
              </>
            )}
          </button>
          <button
            onClick={() => fetchRestaurants(true)}
            disabled={loading}
            style={{
              flex: 1, minWidth: "160px", padding: "0.9rem 2rem",
              background: "transparent", color: "#c9a84c",
              border: "1.5px solid #c9a84c", borderRadius: "2rem",
              fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
              fontSize: "0.95rem", cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            🎲 Surprise Me
          </button>
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "#1a0a0a", border: "1px solid #5a2020", borderRadius: "0.75rem", padding: "1rem 1.5rem", marginBottom: "1.5rem", color: "#c47", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        {/* Picked */}
        {picked && (
          <div style={{ marginBottom: "1rem" }}>
            <RestaurantCard r={picked} onSelect={() => {}} highlighted={true} />
          </div>
        )}

        {/* Results list */}
        {results && results.length > 0 && !picked && (
          <div>
            <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: "#444", textTransform: "uppercase", marginBottom: "1rem" }}>
              {results.length} restaurants found — tap to pick one
            </div>
            {results.map(r => (
              <RestaurantCard key={r.fsq_id} r={r} onSelect={setPicked} highlighted={false} />
            ))}
          </div>
        )}

        {results && picked && (
          <div style={{ marginTop: "0.5rem" }}>
            <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", color: "#333", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              Other options
            </div>
            {results.filter(r => r.fsq_id !== picked.fsq_id).map(r => (
              <RestaurantCard key={r.fsq_id} r={r} onSelect={setPicked} highlighted={false} />
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
