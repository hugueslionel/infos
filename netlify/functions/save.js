exports.handler = async function(event, context) {
  const fetch = require("node-fetch");

  const { cards } = JSON.parse(event.body);

  const token = process.env.GITHUB_TOKEN;
  const user = process.env.GITHUB_USER;
  const repo = process.env.GITHUB_REPO;

  const path = "notes.json";

  // récupérer le fichier actuel
  const getFile = await fetch(`https://api.github.com/repos/${user}/${repo}/contents/${path}`, {
    headers: { Authorization: `token ${token}` }
  });

  const fileData = await getFile.json();

  const updatedContent = Buffer.from(JSON.stringify(cards, null, 2)).toString("base64");

  // mise à jour
  await fetch(`https://api.github.com/repos/${user}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "update notes",
      content: updatedContent,
      sha: fileData.sha
    })
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ ok: true })
  };
};
