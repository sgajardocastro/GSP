async function check() {
  const r = await fetch('https://servidor.leanglobal.cl/lg-gsp-dev/');
  const html = await r.text();
  console.log('Index.html snippet:\n', html.slice(html.indexOf('<script type="module"'), html.indexOf('</body>')));

  const m = html.match(/src="(\/lg-gsp-dev\/assets\/index-[^"]+\.js)"/);
  if (!m) {
    console.error('Bundle script tag NOT found!');
    process.exit(1);
  }

  const bundleUrl = 'https://servidor.leanglobal.cl' + m[1];
  console.log('Fetching live bundle:', bundleUrl);
  const rBundle = await fetch(bundleUrl);
  const code = await rBundle.text();

  console.log('Bundle fetched! Byte size:', code.length);
  console.log('✅ Contains 1.0.50:', code.includes('1.0.50'));
  console.log('❌ Contains 1.0.48:', code.includes('1.0.48'));

  process.exit(0);
}

check().catch(err => {
  console.error(err);
  process.exit(1);
});
