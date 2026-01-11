const express = require('express');
const { protect } = require('../middleware/auth');
const { getAssistance, improveComplaint, suggestCategory } = require('../services/aiAssistantService');

const router = express.Router();

// @route   POST /api/ai-assistant/chat
// @desc    Get AI assistance for complaint-related queries
// @access  Private
router.post('/chat', protect, async (req, res) => {
  try {
    const { query, context } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a query'
      });
    }

    const response = await getAssistance(query, context || {});

    res.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('AI Assistant error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting AI assistance',
      error: error.message
    });
  }
});

// @route   POST /api/ai-assistant/improve
// @desc    Improve complaint text using AI
// @access  Private
router.post('/improve', protect, async (req, res) => {
  try {
    const { complaintText, language } = req.body;

    if (!complaintText || complaintText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide complaint text'
      });
    }

    const improvedText = await improveComplaint(complaintText, language || 'en');

    res.json({
      success: true,
      improvedText
    });
  } catch (error) {
    console.error('Complaint improvement error:', error);
    res.status(500).json({
      success: false,
      message: 'Error improving complaint',
      error: error.message
    });
  }
});

// @route   POST /api/ai-assistant/suggest-category
// @desc    Get AI suggestion for complaint category
// @access  Private
router.post('/suggest-category', protect, async (req, res) => {
  try {
    const { complaintText } = req.body;

    if (!complaintText || complaintText.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide complaint text'
      });
    }

    const suggestion = await suggestCategory(complaintText);

    res.json({
      success: true,
      suggestion
    });
  } catch (error) {
    console.error('Category suggestion error:', error);
    res.status(500).json({
      success: false,
      message: 'Error getting category suggestion',
      error: error.message
    });
  }
});

module.exports = router;




