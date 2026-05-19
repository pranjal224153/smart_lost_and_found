const axios = require('axios');

const rawMlUrl = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const ML_SERVICE_URL = rawMlUrl.endsWith('/') ? rawMlUrl.slice(0, -1) : rawMlUrl;

// Local similarity helpers
const STOPWORDS = new Set([
  'a', 'an', 'the', 'my', 'i', 'it', 'its', 'is', 'was', 'are', 'were',
  'lost', 'found', 'item', 'please', 'help', 'need', 'looking', 'for',
  'have', 'had', 'has', 'this', 'that', 'with', 'at', 'in', 'on', 'of',
  'and', 'or', 'but', 'so', 'if', 'to', 'from', 'by', 'be', 'do',
  'color', 'colour', 'black', 'white', 'red', 'blue', 'green', 'grey', 'gray'
]);

const PRODUCT_TYPES = {
  phone: [
    'phone', 'smartphone', 'iphone', 'android', 'mobile', 'motorola', 'moto',
    'samsung', 'oneplus', 'pixel', 'realme', 'redmi', 'poco', 'vivo', 'oppo',
    'nokia', 'xiaomi', 'mi ', 'iqoo', 'nothing phone', 'infinix', 'tecno',
    'cellphone', 'cell phone', 'handset'
  ],
  audio: [
    'earbud', 'earbuds', 'headphone', 'headphones', 'earphone', 'earphones',
    'buds', 'airpods', 'tws', 'neckband', 'headset', 'in-ear', 'over-ear',
    'boat', 'jbl', 'sennheiser', 'bose', 'sony headphones', 'marshall',
    'skullcandy', 'jabra', 'anker soundcore', 'speaker', 'bluetooth speaker',
    'pods', 'buds+', 'galaxy buds', 'freebuds', 'pixel buds'
  ],
  watch: [
    'watch', 'smartwatch', 'smart watch', 'fitbit', 'garmin', 'mi band',
    'amazfit', 'fossil watch', 'band', 'wearable', 'timepiece', 'wristwatch',
    'apple watch', 'galaxy watch', 'fastrack', 'noise watch', 'boat watch'
  ],
  laptop: [
    'laptop', 'macbook', 'notebook', 'chromebook', 'ultrabook',
    'thinkpad', 'hp laptop', 'dell laptop', 'lenovo laptop', 'asus laptop'
  ],
  tablet: [
    'tablet', 'ipad', 'tab', 'kindle', 'e-reader', 'ereader',
    'samsung tab', 'galaxy tab', 'surface pro'
  ],
  camera: [
    'camera', 'dslr', 'mirrorless', 'gopro', 'action camera',
    'instax', 'polaroid', 'camcorder'
  ],
  wallet: [
    'wallet', 'purse', 'billfold', 'coin purse'
  ],
  bag: [
    'bag', 'backpack', 'rucksack', 'luggage', 'suitcase',
    'handbag', 'tote', 'sling bag', 'messenger bag', 'duffel'
  ],
  keys: [
    'key', 'keys', 'keychain', 'key ring', 'car key', 'house key'
  ],
  glasses: [
    'glasses', 'sunglasses', 'spectacles', 'eyewear', 'goggles', 'reading glasses'
  ],
  id_docs: [
    'passport', 'license', 'aadhar', 'aadhaar', 'pan card', 'driving license',
    'id card', 'voter id', 'student id'
  ],
  charger: [
    'charger', 'power adapter', 'powerbank', 'power bank', 'charging cable',
    'usb cable', 'type-c cable'
  ]
};

function tokenize(text) {
  if (!text) return new Set();
  const words = text.toLowerCase().match(/\b[a-zA-Z0-9]{3,}\b/g) || [];
  return new Set(words.filter(w => !STOPWORDS.has(w)));
}

function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 || setB.size === 0) return 0;
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

function detectProductType(title, description) {
  const combined = `${title || ''} ${description || ''}`.toLowerCase();
  let bestMatch = null;
  let bestCount = 0;

  for (const [ptype, keywords] of Object.entries(PRODUCT_TYPES)) {
    let count = 0;
    for (const kw of keywords) {
      if (combined.includes(kw)) {
        count++;
      }
    }
    if (count > bestCount) {
      bestCount = count;
      bestMatch = ptype;
    }
  }

  return bestCount > 0 ? bestMatch : null;
}

function runLocalMatcher(item, candidates) {
  console.log('Running fallback local matching logic...');
  const itemType = detectProductType(item.title, item.description);
  
  return candidates.map(c => {
    const candType = detectProductType(c.title, c.description);
    
    // Hard block
    if (itemType && candType && itemType !== candType) {
      return {
        candidate_id: c._id ? c._id.toString() : c.id,
        text_score: 0.0,
        image_score: 0.0,
        combined_score: 0.0,
        analysis: `Categorical mismatch: ${itemType} vs ${candType} (Local Matcher Blocked)`
      };
    }

    const titleTokens1 = tokenize(item.title);
    const titleTokens2 = tokenize(c.title);
    const descTokens1 = tokenize(item.description);
    const descTokens2 = tokenize(c.description);

    const titleSim = jaccardSimilarity(titleTokens1, titleTokens2);
    const descSim = jaccardSimilarity(descTokens1, descTokens2);

    let textScore = titleSim * 0.6 + descSim * 0.4;
    if (!item.description || !c.description) {
      textScore = titleSim;
    }

    let combined = textScore;
    if (item.category && item.category === c.category) {
      combined = Math.min(1.0, combined + 0.15); // Category match bonus
    }

    return {
      candidate_id: c._id ? c._id.toString() : c.id,
      text_score: parseFloat(textScore.toFixed(4)),
      image_score: 0.0,
      combined_score: parseFloat(combined.toFixed(4)),
      analysis: 'Jaccard keyword matcher fallback. Local calculation based on shared titles/descriptions.'
    };
  });
}

const mlClient = {
  /**
   * Get text embedding from ML service
   */
  async getTextEmbedding(text) {
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/embed/text`, { text }, { timeout: 30000 });
      return response.data.embedding;
    } catch (error) {
      console.error('ML text embedding error:', error.message);
      return null;
    }
  },

  /**
   * Get image embedding from ML service
   */
  async getImageEmbedding(imageUrl) {
    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
    const fullUrl = imageUrl && !imageUrl.startsWith('http') ? `${SERVER_URL}${imageUrl}` : imageUrl;
    
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/embed/image`, { image_url: fullUrl || '' }, { timeout: 30000 });
      return response.data.embedding;
    } catch (error) {
      console.error('ML image embedding error:', error.message);
      return null;
    }
  },

  /**
   * Find matches for a given item
   */
  async findMatches(item, candidates) {
    if (!candidates || candidates.length === 0) return [];

    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
    
    const getFullUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `${SERVER_URL}${url}`;
    };

    const apiKey = process.env.OPENROUTER_API_KEY;
    const modelName = process.env.OPENROUTER_MODEL || 'google/gemma-4-26b-a4b-it:free';

    if (apiKey) {
      console.log(`Using OpenRouter matching engine with model: ${modelName}`);
      try {
        const systemPrompt = `You are the matching engine for a Smart Lost and Found system. Your job is to compare a reported item with a list of candidate items of the opposite type (lost vs found) and determine if there is a match.

For each candidate, calculate:
1. text_score (0.0 to 1.0): Based on the semantic similarity of the title, description, category, and other text fields.
2. image_score (0.0 to 1.0): If image URLs are provided, estimate visual similarity based on details, brands, colors, etc. If no images, return 0.0.
3. combined_score (0.0 to 1.0): An overall match probability. Give heavy weight to text similarity and boost if color, brand, details, and categories match.
4. analysis (string): A short, clear, 1-2 sentence explanation of why they match or why they don't, highlighting shared descriptors (e.g. brand, color, specific wear/tear, serial number) or differences.

Block matches (score 0.0) if:
- They are clearly different categories of items (e.g. keys vs phone, watch vs laptop).
- The attributes are mutually exclusive (e.g. "red iphone" vs "black samsung").

Return ONLY a JSON object matching this structure:
{
  "matches": [
    {
      "candidate_id": "candidate_id_here",
      "text_score": 0.85,
      "image_score": 0.0,
      "combined_score": 0.85,
      "analysis": "Both items are blue Nike backpacks. The locations are also close, though the dates are 2 days apart."
    }
  ]
}
Do not write anything else. Do not wrap in markdown code blocks. Output raw JSON.`;

        const userPrompt = `Compare this item:
Item Title: ${item.title}
Item Description: ${item.description}
Item Category: ${item.category}
Item Image: ${getFullUrl(item.imageUrl)}

With these candidate items:
${candidates.map((c, idx) => `
Candidate #${idx + 1}:
ID: ${c._id ? c._id.toString() : c.id}
Title: ${c.title}
Description: ${c.description}
Category: ${c.category}
Image: ${getFullUrl(c.imageUrl)}
---`).join('\n')}

Analyze all candidates and return the JSON matches array.`;

        const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
          model: modelName,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: 'json_object' }
        }, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 45000
        });

        let responseText = response.data.choices[0].message.content;
        if (responseText.includes('```')) {
          responseText = responseText.replace(/```json|```/g, '').trim();
        }
        const result = JSON.parse(responseText);
        if (result.matches && Array.isArray(result.matches)) {
          console.log(`Successfully received ${result.matches.length} matches from OpenRouter.`);
          return result.matches;
        }
      } catch (error) {
        console.error('OpenRouter match error, falling back:', error.message);
      }
    }

    // Fallback 1: FastAPI ML service
    console.log('Attempting FastAPI ML Service matching...');
    try {
      const response = await axios.post(`${ML_SERVICE_URL}/match`, {
        item: {
          id: item._id.toString(),
          title: item.title,
          description: item.description,
          category: item.category,
          image_url: getFullUrl(item.imageUrl),
        },
        candidates: candidates.map(c => ({
          id: c._id.toString(),
          title: c.title,
          description: c.description,
          category: c.category,
          image_url: getFullUrl(c.imageUrl),
        })),
      }, { timeout: 15000 });
      
      const matches = response.data.matches;
      if (matches && Array.isArray(matches)) {
        return matches.map(m => ({
          ...m,
          analysis: `FastAPI semantic match (Combined score: ${Math.round(m.combined_score * 100)}%)`
        }));
      }
    } catch (error) {
      console.error('FastAPI ML service match error, falling back:', error.message);
    }

    // Fallback 2: Local keyword/Jaccard matcher
    return runLocalMatcher(item, candidates);
  },

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
      return response.data;
    } catch (error) {
      return { status: 'unavailable', error: error.message };
    }
  },
};

module.exports = mlClient;
