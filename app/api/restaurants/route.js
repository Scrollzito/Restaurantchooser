const PRICE_LEVEL_MAP = {
  PRICE_LEVEL_FREE: 0,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};

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

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const ll = searchParams.get("ll") || "";
  const [latitude, longitude] = ll.split(",").map(Number);
  const categoriesParam = searchParams.get("categories") || "restaurant";
  const radius = Math.min(parseInt(searchParams.get("radius") || "50000", 10), 50000);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20", 10), 20);
  const minPrice = searchParams.get("min_price")
    ? parseInt(searchParams.get("min_price"), 10)
    : null;

  const includedTypes = categoriesParam.split(",").filter(Boolean);

  const body = {
    includedTypes,
    maxResultCount: limit,
    locationRestriction: {
      circle: {
        center: { latitude, longitude },
        radius,
      },
    },
    rankPreference: "POPULARITY",
  };

  const fieldMask = [
    "places.id",
    "places.displayName",
    "places.primaryTypeDisplayName",
    "places.rating",
    "places.priceLevel",
    "places.regularOpeningHours",
    "places.location",
    "places.shortFormattedAddress",
  ].join(",");

  try {
    const res = await fetch("https://places.googleapis.com/v1/places:searchNearby", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": process.env.GOOGLE_PLACES_API_KEY,
        "X-Goog-FieldMask": fieldMask,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Google Places error: ${res.status}` }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    let results = (data.places || []).map((p) => ({
      fsq_id: p.id,
      name: p.displayName?.text,
      categories: p.primaryTypeDisplayName ? [{ name: p.primaryTypeDisplayName.text }] : [],
      distance:
        p.location
          ? haversineDistance(latitude, longitude, p.location.latitude, p.location.longitude)
          : null,
      location: { address: p.shortFormattedAddress || null },
      rating: p.rating != null ? p.rating * 2 : null,
      price: p.priceLevel ? (PRICE_LEVEL_MAP[p.priceLevel] ?? null) : null,
      hours: p.regularOpeningHours ? { open_now: p.regularOpeningHours.openNow } : undefined,
    }));

    if (minPrice != null) {
      results = results.filter((r) => r.price === minPrice);
    }

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
