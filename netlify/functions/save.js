exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const GITHUB_REPO  = process.env.GITHUB_REPO;   
  const FILE_PATH    = "notes.json";
  const BRANCH       = "main";

  try {
    const body = JSON.parse(event.body);
    // On encode les données en Base64 pour l'API GitHub
// Après : On sauvegarde l'intégralité de l'objet envoyé (cartes + catégories)
    const content = Buffer.from(JSON.stringify(body, null, 2)).toString("base64");
    // 1. Récupérer le SHA actuel du fichier (indispensable pour modifier un fichier existant)
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

    // 2. Mettre à jour le fichier avec le tag [skip ci]
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
          // AJOUT DU [skip ci] ICI :
          message: "Sauvegarde auto des notes [skip ci]", 
          content,
          branch: BRANCH,
          ...(sha ? { sha } : {}),
        }),
      }
    );

    if (!putRes.ok) {
      const err = await putRes.text();
      return { statusCode: 500, body: "Erreur GitHub: " + err };
    }

    return { 
      statusCode: 200, 
      body: JSON.stringify({ message: "Synchronisation réussie !" }) 
    };

  } catch (error) {
    return { statusCode: 500, body: error.toString() };
  }
};
