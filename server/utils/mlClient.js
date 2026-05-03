const axios = require('axios');

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

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
    const SERVER_URL = process.env.SERVER_URL || 'http://localhost:5000';
    
    const getFullUrl = (url) => {
      if (!url) return '';
      if (url.startsWith('http')) return url;
      return `${SERVER_URL}${url}`;
    };

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
      }, { timeout: 120000 });
      return response.data.matches;
    } catch (error) {
      console.error('ML match error:', error.message);
      return [];
    }
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
