export default async function handler(req, res) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    const NOTION_DB_ID = process.env.NOTION_DB_ID;

    if (!NOTION_TOKEN || !NOTION_DB_ID) {
      return res.status(500).json({ error: "Missing env: NOTION_TOKEN / NOTION_DB_ID" });
    }

    const notionRes = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB_ID}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_size: 200,
        sorts: [{ timestamp: "created_time", direction: "descending" }],
      }),
    });

    if (!notionRes.ok) {
      const text = await notionRes.text();
      return res.status(500).send(text);
    }

    const data = await notionRes.json();

    const items = data.results.map((page) => {
      const p = page.properties;

      const name = p?.Name?.title?.[0]?.plain_text ?? "";
      const menu = p?.menu?.rich_text?.[0]?.plain_text ?? "";
      const address = p?.address?.rich_text?.[0]?.plain_text ?? "";
      const lat = p?.lat?.number ?? null;
      const lon = p?.lon?.number ?? null;
      const category = p?.category?.select?.name ?? "";

      return {
        id: page.id,
        name,
        menu,
        address,
        lat,
        lon,
        category,
      };
    })
    // 좌표 없는 행은 제외
    .filter((r) => Number.isFinite(r.lat) && Number.isFinite(r.lon) && r.name);

    return res.status(200).json({ items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Server error" });
  }
}
