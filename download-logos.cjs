const fs = require('fs');
const https = require('https');
const path = require('path');

const logosDir = path.join(__dirname, 'public', 'logos');
if (!fs.existsSync(logosDir)) {
  fs.mkdirSync(logosDir, { recursive: true });
}

const stores = {
  Mercadona: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6c/Mercadona_logo.svg/512px-Mercadona_logo.svg.png',
  Lidl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Lidl-Logo.svg/512px-Lidl-Logo.svg.png',
  Carrefour: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5b/Carrefour_logo.svg/512px-Carrefour_logo.svg.png',
  Consum: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Logo_Consum.svg/512px-Logo_Consum.svg.png',
  Eroski: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/Eroski_logo.svg/512px-Eroski_logo.svg.png',
  'Family Cash': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Supermarket_icon.svg/512px-Supermarket_icon.svg.png' // Fallback
};

const fallbackIcon = 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/Supermarket_icon.svg/512px-Supermarket_icon.svg.png';

async function download(url, filename, isFallback = false) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    };
    
    https.get(url, options, (res) => {
      if (res.statusCode === 200) {
        res.pipe(fs.createWriteStream(filename))
           .on('error', reject)
           .once('close', () => resolve(filename));
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location, filename, isFallback).then(resolve).catch(reject);
      } else {
        if (isFallback) {
          reject(new Error(`Fallback failed with status ${res.statusCode}`));
          return;
        }
        console.warn(`Failed to download ${url} with status ${res.statusCode}, using fallback.`);
        download(fallbackIcon, filename, true).then(resolve).catch(reject);
      }
    }).on('error', reject);
  });
}

async function run() {
  for (const [name, url] of Object.entries(stores)) {
    const safeName = name.toLowerCase().replace(' ', '-');
    const filename = path.join(logosDir, `${safeName}.png`);
    try {
      await download(url, filename);
      console.log(`Downloaded ${name} logo`);
    } catch (e) {
      console.error(`Failed to download ${name}:`, e.message);
    }
  }
}

run();
