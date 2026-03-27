async function generate() {

  let prompt = document.getElementById("prompt").value;

  let res = await fetch("YOUR_BACKEND_URL/generate", {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body: JSON.stringify({prompt})
  });

  let html = await res.text();
  document.getElementById("output").srcdoc = html;
}
