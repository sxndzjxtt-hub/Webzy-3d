async function generate() {

  let prompt = document.getElementById("prompt").value;

  let res = await fetch("webzy-3d-backend-production.up.railway.app/generate", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({prompt})
  });

  let html = await res.text();
  document.getElementById("output").srcdoc = html;
}
