export default async function handler(req, res) {
  try {
    if (req.method !== "DELETE") {
      return res.status(405).json({ error: "Method Not Allowed" });
    }

    const NOTION_TOKEN = process.env.NOTION_TOKEN;
    if (!NOTION_TOKEN) return res.status(500).json({ error: "Missing env: NOTION_TOKEN" });

    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
    const pageId = String(body?.id || "").trim();
    if (!pageId) return res.status(400).json({ error: "id is required" });

    // Notion은 DB row를 실제 삭제 대신 "archived: true"로 처리
    const notionRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${NOTION_TOKEN}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ archived: true }),
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
