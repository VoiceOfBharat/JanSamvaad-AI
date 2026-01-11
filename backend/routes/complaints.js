const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Complaint = require('../models/Complaint');
const { protect, authorize } = require('../middleware/auth');
const { translateToEnglish } = require('../services/translationService');
const { transcribeAudio } = require('../services/speechService');
const { categorizeComplaint } = require('../services/categorizationService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/';
    // Create uploads folder if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedImageTypes = /jpeg|jpg|png|gif|webp/;
  const allowedAudioTypes = /mp3|wav|m4a|ogg/;
  
  const extname = path.extname(file.originalname).toLowerCase();
  const isImage = allowedImageTypes.test(extname);
  const isAudio = allowedAudioTypes.test(extname);

  if (isImage || isAudio) {
    cb(null, true);
  } else {
    cb(new Error('Only images (jpg, png, gif, webp) and audio files (mp3, wav, m4a) are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter
});

// Error handling middleware for multer
const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB.'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error'
    });
  }
  next();
};

// @route   POST /api/complaints
// @desc    Submit new complaint
// @access  Private (Citizen only)
router.post('/', protect, authorize('citizen'), upload.single('photo'), handleMulterError, async (req, res) => {
  try {
    const { fullName, mobile, pincode, complaintText, language, isVoice } = req.body;

    console.log('📝 New complaint submission received');
    console.log('User:', req.user ? req.user.email : 'No user');
    console.log('Data:', { fullName, mobile, pincode, language, isVoice, complaintText: complaintText ? complaintText.substring(0, 50) + '...' : 'empty' });

    // Validation
    if (!fullName || !mobile || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide full name, mobile number, and pincode'
      });
    }

    // Check if complaint text is provided (handle empty strings)
    const hasComplaintText = complaintText && complaintText.trim().length > 0;
    
    if (!hasComplaintText && isVoice !== 'true') {
      return res.status(400).json({
        success: false,
        message: 'Please provide complaint text or voice input'
      });
    }

    let originalText = hasComplaintText ? complaintText.trim() : '';
    let detectedLanguage = language || 'en';

    // Handle voice input (if audio file is uploaded)
    if (isVoice === 'true' && req.file && req.file.mimetype.startsWith('audio')) {
      console.log('🎤 Processing voice input...');
      const audioBuffer = fs.readFileSync(req.file.path);
      const languageCode = language === 'hi' ? 'hi-IN' : language === 'mr' ? 'mr-IN' : 'en-IN';
      originalText = await transcribeAudio(audioBuffer, languageCode);
      console.log('Transcribed text:', originalText);
    }

    // Translate to English
    console.log('🌐 Translating complaint...');
    let translatedText;
    try {
      translatedText = await translateToEnglish(originalText, detectedLanguage);
      console.log('Translated text:', translatedText);
      
      // Ensure we have text to categorize
      if (!translatedText || translatedText.trim().length === 0) {
        translatedText = originalText || 'No complaint text provided';
      }
    } catch (translationError) {
      console.error('Translation error:', translationError);
      translatedText = originalText || 'No complaint text provided';
    }

    // Categorize complaint using AI
    console.log('🤖 Categorizing complaint...');
    let category, department;
    try {
      const categorization = await categorizeComplaint(translatedText);
      category = categorization.category || 'Other';
      department = categorization.department || 'General Administration';
      console.log(`Category: ${category}, Department: ${department}`);
    } catch (categorizationError) {
      console.error('Categorization error:', categorizationError);
      // Fallback to default category
      category = 'Other';
      department = 'General Administration';
      console.log('Using fallback category: Other');
    }

    // Save photo URL if uploaded
    let photoUrl = null;
    if (req.file && req.file.mimetype.startsWith('image')) {
      photoUrl = `/uploads/${req.file.filename}`;
      console.log('📷 Photo uploaded:', photoUrl);
    }

    // Validate category matches enum
    const validCategories = [
      'Water Supply', 'Roads and Infrastructure', 'Electricity', 
      'Health Services', 'Sanitation', 'Education', 
      'Public Transport', 'Law and Order', 'Housing', 'Other'
    ];
    
    if (!validCategories.includes(category)) {
      console.warn(`Invalid category "${category}", using "Other"`);
      category = 'Other';
    }

    // Validate pincode format
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Pincode must be a 6-digit number'
      });
    }

    // Validate mobile format
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return res.status(400).json({
        success: false,
        message: 'Mobile number must be a valid 10-digit Indian number starting with 6-9'
      });
    }

    // Create complaint
    console.log('Creating complaint with data:', {
      citizenId: req.user._id,
      category,
      department,
      originalLanguage: detectedLanguage
    });

    const complaint = await Complaint.create({
      citizenId: req.user._id,
      fullName,
      mobile,
      pincode,
      originalLanguage: detectedLanguage,
      originalText: originalText || 'No text provided',
      translatedText: translatedText || originalText || 'No text provided',
      category,
      department,
      photoUrl,
      status: 'Submitted'
    });

    console.log('✅ Complaint created successfully:', complaint._id);

    res.status(201).json({
      success: true,
      message: 'Complaint submitted successfully',
      complaint
    });
  } catch (error) {
    console.error('❌ Complaint submission error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    // Handle MongoDB connection errors
    if (error.name === 'MongoServerError' || error.message?.includes('connection')) {
      return res.status(503).json({
        success: false,
        message: 'Database connection error. Please try again in a moment.',
        error: 'MongoDB connection issue'
      });
    }

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors || {}).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.length > 0 ? messages.join(', ') : 'Validation error',
        error: 'Validation error'
      });
    }

    // Handle CastError (invalid ObjectId, etc.)
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format',
        error: error.message
      });
    }

    // Generic error
    res.status(500).json({
      success: false,
      message: 'Error submitting complaint',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
});

// @route   GET /api/complaints/my-complaints
// @desc    Get all complaints by logged-in citizen
// @access  Private (Citizen only)
router.get('/my-complaints', protect, authorize('citizen'), async (req, res) => {
  try {
    const complaints = await Complaint.find({ citizenId: req.user._id })
      .sort({ createdAt: -1 });

    console.log(`📋 Fetched ${complaints.length} complaints for user: ${req.user.email}`);

    res.json({
      success: true,
      count: complaints.length,
      complaints
    });
  } catch (error) {
    console.error('Error fetching complaints:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching complaints',
      error: error.message
    });
  }
});

// @route   GET /api/complaints/:id
// @desc    Get single complaint by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('citizenId', 'name email mobile');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check authorization (citizen can only view their own complaints)
    if (req.user.role === 'citizen' && complaint.citizenId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this complaint'
      });
    }

    res.json({
      success: true,
      complaint
    });
  } catch (error) {
    console.error('Error fetching complaint:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching complaint',
      error: error.message
    });
  }
});

module.exports = router;