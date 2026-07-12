// api/upload.js
//
// Plain Vercel Serverless Function (no framework required — works with a
// static HTML site). Vercel auto-detects any file in /api as a function
// using the (req, res) signature below.
//
// Flow: browser sends the raw file as the POST body -> this function
// streams it straight to Vercel Blob using the BLOB_READ_WRITE_TOKEN that
// Vercel injects automatically once a Blob store is connected to the
// project (Dashboard -> Storage -> your Blob store -> Connect Project).
// The token never touches the frontend.

const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  // CORS / preflight support (harmless to keep even if you only ever call
  // this from your own domain)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed. Use POST.' });
    return;
  }

  const filename = req.query.filename;
  if (!filename || typeof filename !== 'string') {
    res.status(400).json({ error: 'Missing "filename" query parameter.' });
    return;
  }

  try {
    // req is a Node.js readable stream — @vercel/blob can take it directly,
    // so the file is streamed through rather than buffered in memory.
    const blob = await put(filename, req, {
      access: 'public',        // use 'private' if you don't want public URLs
      addRandomSuffix: true,   // avoids overwriting files with the same name
    });

    res.status(200).json(blob); // { url, downloadUrl, pathname, contentType, ... }
  } catch (error) {
    console.error('Blob upload error:', error);
    res.status(500).json({ error: error.message || 'Upload failed.' });
  }
};

// Note: server uploads through a Serverless Function are capped at 4.5MB
// per request (a Vercel platform limit). That's plenty for product photos,
// but if you ever need bigger files, Vercel Blob also supports direct
// browser-to-blob "client uploads" (up to 5TB) — a different pattern than
// this one. Ask if you want that version instead.
