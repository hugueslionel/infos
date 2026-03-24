
exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO  = process.env.GITHUB_REPO;   // ex: "monuser/mon-repo"
  const FILE_PATH    = "notes.json";
  const BRANCH       = "main";

  try {
    const body = JSON.parse(event.body);
    const content = Buffer.from(JSON.stringify(body.cards, null, 2)).toString("base64");

    // 1. Récupérer le SHA actuel du fichier (nécessaire pour le mettre à jour)
    const getRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}?ref=${BRANCH}`,
      {
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "User-Agent": "netlify-function",
        },
      }
    );

    let sha = undefined;
    if (getRes.ok) {
      const fileData = await getRes.json();
      sha = fileData.sha;
    }

    // 2. Mettre à jour (ou créer) le fichier
    const putRes = await fetch(
      `https://api.github.com/repos/${GITHUB_REPO}/contents/${FILE_PATH}`,
      {
        method: "PUT",
        headers: {
          Authorization: `token ${GITHUB_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "netlify-function",
        },
        body: JSON.stringify({
          message: "update notes.json",
          content,
          branch: BRANCH,
          ...(sha ? { sha } : {}),
        }),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      return { statusCode: 500, body: `GitHub error: ${err}` };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true }),
    };
  } catch (e) {
    return { statusCode: 500, body: `Server error: ${e.message}` };
  }
};
