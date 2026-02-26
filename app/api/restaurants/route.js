function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function buildAddress(tags) {
  const street = [tags["addr:housenumber"], tags["addr:street"]]
    .filter(Boolean)
    .join(" ");
  return [street, tags["addr:city"]].filter(Boolean).join(", ") || null;
}

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const ll = searchParams.get("ll") || "";
  const [latitude, longitude] = ll.split(",").map(Number);
  const categoriesParam = searchParams.get("categories") || "";
  const radius = Math.min(parseInt(searchParams.get("radius") || "50000", 10), 50000);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 20);

  // Build cuisine filter — skip if the param is empty or the generic "restaurant" default
  const cuisines = categoriesParam.split(",").filter((c) => c && c !== "restaurant");
  const cuisineFilter =
    cuisines.length > 0 ? `["cuisine"~"${cuisines.join("|")}",i]` : "";

  const query = `
[out:json][timeout:10];
(
  node["amenity"="restaurant"]${cuisineFilter}(around:${radius},${latitude},${longitude});
  way["amenity"="restaurant"]${cuisineFilter}(around:${radius},${latitude},${longitude});
);
out body center;
`.trim();

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Overpass error: ${res.status}` }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const results = (data.elements || [])
      .map((el) => {
        const lat = el.type === "way" ? el.center?.lat : el.lat;
        const lon = el.type === "way" ? el.center?.lon : el.lon;
        const tags = el.tags || {};
        return {
          fsq_id: String(el.id),
          name: tags.name || "Unnamed restaurant",
          categories: [{ name: tags.cuisine?.split(";")[0] || "Restaurant" }],
          distance: lat != null ? haversineDistance(latitude, longitude, lat, lon) : null,
          location: { address: buildAddress(tags) },
          rating: null,
          price: null,
          hours: undefined,
        };
      })
      .filter((r) => r.name !== "Unnamed restaurant" || r.distance != null)
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      .slice(0, limit);

    return new Response(JSON.stringify({ results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
