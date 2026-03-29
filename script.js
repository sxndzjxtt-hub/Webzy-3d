async function generate() {

  let prompt = document.getElementById("prompt").value;

  try {
    let res = await fetch("https://webzy-3d-backend-production.up.railway.app/generate", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({prompt})
    });

    let html = await res.text();

    document.getElementById("output").srcdoc = html;

  } catch {
    document.getElementById("output").srcdoc = "<h2 style='color:white'>Error 😢</h2>";
  }
}
