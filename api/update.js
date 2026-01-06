export default async function handler(req, res) {
  try {
    if (req.method !== "PATCH") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    if (!NOTION_TOKEN) return res.status(500).json({ error: "Missing env: NOTION_TOKEN" });

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const id = String(body?.id || "").trim();
    const name = String(body?.name ?? "").trim();
    const menu = String(body?.menu ?? "").trim();
    const address = String(body?.address ?? "").trim();
    const category = String(body?.category ?? "").trim();
    const lat = Number(body?.lat);
    const lon = Number(body?.lon);

    if (!id) return res.status(400).json({ error: "id is required" });
    if (!name) return res.status(400).json({ error: "name is required" });
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
      return res.status(400).json({ error: "lat/lon must be numbers" });
    }

    const notionRes = await fetch(`https://api.notion.com/v1/pages/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: {
          Name: { title: [{ text: { content: name } }] },
          menu: { rich_text: menu ? [{ text: { content: menu } }] : [] },
          address: { rich_text: address ? [{ text: { content: address } }] : [] },
          lat: { number: lat },
          lon: { number: lon },
          ...(category ? { category: { select: { name: category } } } : {}),
        },
      }),
    });

    if (!notionRes.ok) {
      const text = await notionRes.text();
      return res.status(500).send(text);
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
