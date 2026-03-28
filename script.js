async function generate() {

  let prompt = document.getElementById("prompt").value;

  let res = await fetch("https://webzy-3d-backend-production.up.railway.app/generate", {
    method: "POST",
    mode: "cors",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ prompt: prompt })
  });

  let html = await res.text();

  document.getElementById("output").srcdoc = html;
}
