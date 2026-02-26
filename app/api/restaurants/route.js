export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const params = new URLSearchParams();
  for (const [key, value] of searchParams.entries()) {
    params.append(key, value);
  }

  const fsqUrl = `https://api.foursquare.com/v3/places/search?${params.toString()}`;

  try {
    const res = await fetch(fsqUrl, {
      headers: {
        Authorization: process.env.FSQ_API_KEY,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      return new Response(JSON.stringify({ error: `Foursquare error: ${res.status}` }), {
        status: res.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    return new Response(JSON.stringify(data), {
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
