const { Document } = require('../models');
const { Op } = require('sequelize');

// GET /api/search - Full text search
const search = async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ 
        error: 'Missing search query',
        message: 'Search query parameter "q" is required'
      });
    }

    // Basic text search using Sequelize
    const documents = await Document.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${q}%` } },
          { content: { [Op.iLike]: `%${q}%` } },
          { category: { [Op.iLike]: `%${q}%` } }
        ]
      },
      attributes: ['id', 'title', 'content', 'updatedAt'],
      order: [['updatedAt', 'DESC']],
      limit: 20
    });

    // Create snippets for search results
    const searchResults = documents.map(doc => {
      const content = doc.content || '';
      const snippet = content.length > 200 
        ? content.substring(0, 200) + '...'
        : content;

      return {
        id: doc.id,
        title: doc.title,
        snippet: snippet,
        updatedAt: doc.updatedAt
      };
    });

    res.json(searchResults);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      error: 'Search failed',
      message: 'An error occurred during search'
    });
  }
};

module.exports = {
  search
};
