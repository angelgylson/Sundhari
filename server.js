import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { encoding_for_model } from '@dqbd/tiktoken';

const app = express();
app.use(cors());
app.use(express.json());


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'public')));

// Prepare encoder
const encoder = encoding_for_model('gpt2');

// Target position (normalized between eyebrows)
const TARGET_NORM = { 
  x: 258 / 512, // ≈ 0.5039
  y: 298 / 512  // ≈ 0.5820
};


app.post('/compute_score', (req, res) => {
  try {
    const { placements = [], imageWidth, imageHeight } = req.body;
    if (!imageWidth || !imageHeight) return res.status(400).json({ error: 'imageWidth/imageHeight required' });

    const target = { x: TARGET_NORM.x * imageWidth, y: TARGET_NORM.y * imageHeight };

    const results = placements.map(p => {
      const dx = p.x - target.x;
      const dy = p.y - target.y;
      const distance = Math.hypot(dx, dy);
      const tokenCount = encoder.encode(p.emoji || '').length || 0;
      return { player: p.player, emoji: p.emoji, x: p.x, y: p.y, distance, tokenCount };
    });

    const ranked = [...results].sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return a.tokenCount - b.tokenCount;
    });

    res.json({ target, results, ranked });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
