async function run() {
  try {
    const res = await fetch('https://servidor.leanglobal.cl/lg-gsp-dev/index.html');
    const text = await res.text();
    console.log("=== index.html content ===");
    console.log(text);
    
    // Extract CSS link
    const match = text.match(/href="([^"]+\.css)"/);
    if (match) {
      const cssUrl = 'https://servidor.leanglobal.cl' + match[1];
      console.log("\n=== CSS URL ===", cssUrl);
      const resCss = await fetch(cssUrl);
      console.log("CSS status:", resCss.status);
      const cssText = await resCss.text();
      console.log("CSS size:", cssText.length);
      console.log("CSS snippet:", cssText.substring(0, 300));
    } else {
      console.log("No CSS found in index.html");
    }
  } catch (e) {
    console.error("Error:", e.message);
  }
}

run();
