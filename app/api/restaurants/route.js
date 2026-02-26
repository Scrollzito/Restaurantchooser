export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const ll = searchParams.get("ll") || "";
  const [latitude, longitude] = ll.split(",");
  const categories = searchParams.get("categories") || "restaurants";
  const radius = Math.min(parseInt(searchParams.get("radius") || "50000", 10), 40000);
  const limit = searchParams.get("limit") || "20";
  const minPrice = searchParams.get("min_price");

  const params = new URLSearchParams({
    latitude,
    longitude,
    categories,
    radius: String(radius),
    limit,
    sort_by: "rating",
  });

  if (minPrice) params.append("price", minPrice);

  const yelpUrl = `https://api.yelp.com/v3/businesses/search?${params.toString()}`;

  try {
    const res = await fetch(yelpUrl, {
      headers: {
        Authorization: `Bearer ${process.env.YELP_API_KEY}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Yelp error: ${res.status}` }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const results = (data.businesses || []).map(b => ({
      fsq_id: b.id,
      name: b.name,
      categories: (b.categories || []).map(c => ({ name: c.title })),
      distance: Math.round(b.distance),
      location: { address: b.location?.address1 },
      rating: b.rating != null ? b.rating * 2 : null,
      price: b.price ? b.price.length : null,
    }));

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
