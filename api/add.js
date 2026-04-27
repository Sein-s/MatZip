export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const NOTION_DB_ID = process.env.NOTION_DB_ID;

    if (!NOTION_TOKEN || !NOTION_DB_ID) {
      return res.status(500).json({ error: "Missing env: NOTION_TOKEN / NOTION_DB_ID" });
    }

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const name = String(body?.name ?? "").trim();
    const menu = String(body?.menu ?? "").trim();
    const address = String(body?.address ?? "").trim();
    const category = String(body?.category ?? "").trim();

    const lat = Number(body?.lat);
    const lon = Number(body?.lon);
    const hasValidCoords =
      Number.isFinite(lat) &&
      Number.isFinite(lon) &&
      Math.abs(lat) <= 90 &&
      Math.abs(lon) <= 180;

    if (!name) return res.status(400).json({ error: "name is required" });
    if (!hasValidCoords) {
      return res.status(400).json({ error: "lat/lon must be valid WGS84 coordinates" });
    }

    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: NOTION_DB_ID },
        properties: {
          Name: { title: [{ text: { content: name } }] },
          menu: { rich_text: menu ? [{ text: { content: menu } }] : [] },
          address: { rich_text: address ? [{ text: { content: address } }] : [] },
          lat: { number: lat },
          lon: { number: lon },
          ...(category
            ? { category: { select: { name: category } } }
            : {}),
        },
      }),
    });

    if (!notionRes.ok) {
      const text = await notionRes.text();
      return res.status(500).send(text);
    }

    const created = await notionRes.json();
    return res.status(200).json({ ok: true, id: created.id });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
