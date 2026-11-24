import 'dotenv/config';
import express from 'express';
import { createServer as createHttpServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer as createViteServer } from 'vite';

const app = express();
const httpServer = createHttpServer(app);
const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const isProduction =
  process.env.NODE_ENV === 'production' ||
  process.argv.includes('--production');
const port = Number(process.env.PORT ?? 5173);

app.use(express.json({ limit: '1mb' }));

app.post('/api/flitto/translate', async (req, res) => {
  const apiKey =
    process.env.FLITTO_API_KEY || process.env.VITE_FLITTO_API_KEY;
  const apiUrl =
    process.env.FLITTO_API_URL || process.env.VITE_FLITTO_API_URL;
  const { texts, targetLang } = req.body ?? {};

  if (!apiKey || !apiUrl) {
    return res.status(503).json({ error: 'Translation service is not configured.' });
  }

  if (
    !Array.isArray(texts) ||
    texts.some((text) => typeof text !== 'string') ||
    !['en', 'zh-CN', 'ja'].includes(targetLang)
  ) {
    return res.status(400).json({ error: 'Invalid translation request.' });
  }

  try {
    const upstream = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        src_lang_code: 'ko',
        dst_lang_code: targetLang,
        contents: texts,
        is_polite: 'Y',
      }),
    });

    if (!upstream.ok) {
      console.error(`Flitto API returned HTTP ${upstream.status}.`);
      return res.status(502).json({ error: 'Translation service request failed.' });
    }

    return res.status(200).json(await upstream.json());
  } catch (error) {
    console.error(
      'Flitto API request failed.',
      error instanceof Error ? error.name : 'Unknown error',
    );
    return res.status(502).json({ error: 'Translation service is unavailable.' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API route not found.' });
});

if (isProduction) {
  const distPath = path.join(projectRoot, 'dist');
  app.use(express.static(distPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  const vite = await createViteServer({
    configFile: path.join(projectRoot, 'vite.config.js'),
    server: {
      middlewareMode: true,
      hmr: { server: httpServer },
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
}

httpServer.listen(port, () => {
  console.log(
    `Local-map app listening at http://localhost:${port} (${isProduction ? 'production' : 'development'}).`,
  );
});
