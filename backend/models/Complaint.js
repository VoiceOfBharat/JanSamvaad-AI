const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  citizenId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fullName: {
    type: String,
    required: true,
    trim: true
  },
  mobile: {
    type: String,
    required: true,
    match: [/^[6-9]\d{9}$/, 'Please add a valid Indian mobile number']
  },
  pincode: {
    type: String,
    required: true,
    match: [/^\d{6}$/, 'Please add a valid 6-digit pincode']
  },
  originalLanguage: {
    type: String,
    enum: ['en', 'hi', 'mr'],
    required: true
  },
  originalText: {
    type: String,
    required: true
  },
  translatedText: {
    type: String,
    required: true
  },
  category: {
    type: String,
    enum: [
      'Water Supply',
      'Roads and Infrastructure',
      'Electricity',
      'Health Services',
      'Sanitation',
      'Education',
      'Public Transport',
      'Law and Order',
      'Housing',
      'Other'
    ],
    required: true
  },
  department: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved'],
    default: 'Submitted'
  },
  photoUrl: {
    type: String,
    default: null
  },
  statusHistory: [{
    status: String,
    updatedAt: {
      type: Date,
      default: Date.now
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    remarks: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Add initial status to history when complaint is created
complaintSchema.pre('save', function(next) {
  try {
    if (this.isNew) {
      // Initialize statusHistory if it doesn't exist
      if (!this.statusHistory) {
        this.statusHistory = [];
      }
      
      // Only add if statusHistory is empty
      if (this.statusHistory.length === 0) {
        this.statusHistory.push({
          status: this.status || 'Submitted',
          updatedAt: new Date()
        });
      }
    }
    
    // Call next if it's a function (callback style)
    if (typeof next === 'function') {
      next();
    }
  } catch (error) {
    // If next is a function, pass error to it
    if (typeof next === 'function') {
      next(error);
    } else {
      // Otherwise, throw the error (async style)
      throw error;
    }
  }
});

module.exports = mongoose.model('Complaint', complaintSchema);