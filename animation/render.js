// Usage:
//   node render.js preview <w> <h> <out.png> t1 t2 t3 ...   -> contact sheet of given times
//   node render.js movie <w> <h> <fps> <out.mp4> [start] [end]
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');

const mode = process.argv[2];
const W = +process.argv[3], H = +process.argv[4];

async function launch() {
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--disable-gpu-vsync'] });
  const p = await b.newPage({ viewport: { width: W, height: H } });
  p.on('pageerror', e => console.log('PAGEERROR:', e.message));
  p.on('console', m => { if (m.type() === 'error') console.log('console:', m.text()); });
  await p.goto(`http://127.0.0.1:8765/scene.html?w=${W}&h=${H}`);
  await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
  return [b, p];
}

(async () => {
  const [b, p] = await launch();
  if (mode === 'preview') {
    const out = process.argv[5]; const times = process.argv.slice(6).map(Number);
    const cols = Math.ceil(Math.sqrt(times.length)); const rows = Math.ceil(times.length / cols);
    const files = [];
    for (let i = 0; i < times.length; i++) {
      await p.evaluate(t => window.renderFrame(t), times[i]);
      await p.evaluate(t => window.renderFrame(t), times[i]); // twice: shadow maps / lazy uploads settle
      const f = `pv_${i}.png`;
      await p.screenshot({ path: f }); files.push(f);
    }
    fs.writeFileSync(out + '.json', JSON.stringify({ files, times, cols }));
    console.log('wrote', out);
  } else {
    const fps = +process.argv[5], out = process.argv[6];
    const start = process.argv[7] != null ? +process.argv[7] : 0;
    const total = await p.evaluate(() => window.TOTAL);
    const end = process.argv[8] != null ? +process.argv[8] : total;
    const n = Math.round((end - start) * fps);
    const ff = spawn('ffmpeg', ['-y', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'png', '-i', '-', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'ignore', 'pipe'] });
    let ffErr = ''; ff.stderr.on('data', d => { ffErr += d; if (ffErr.length > 4000) ffErr = ffErr.slice(-4000); });
    const t0 = Date.now();
    await p.evaluate(t => window.renderFrame(t), start);
    for (let i = 0; i < n; i++) {
      const t = start + i / fps;
      await p.evaluate(t => window.renderFrame(t), t);
      const buf = await p.screenshot({ type: 'png' });
      if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
      if (i % 120 === 0) console.log(`frame ${i}/${n} t=${t.toFixed(2)} elapsed=${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
    ff.stdin.end();
    await new Promise(r => ff.on('close', code => { console.log('ffmpeg exit', code); if (code) console.log(ffErr); r(); }));
    console.log('done', out, ((Date.now() - t0) / 1000).toFixed(0) + 's');
  }
  await b.close();
})().catch(e => { console.error(e); process.exit(1); });
