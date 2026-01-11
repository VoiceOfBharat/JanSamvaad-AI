const express = require('express');
const Complaint = require('../models/Complaint');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/authority/complaints
// @desc    Get all complaints with filters (for authorities)
// @access  Private (Authority only)
router.get('/complaints', protect, authorize('authority'), async (req, res) => {
  try {
    const { status, category, pincode, department } = req.query;

    // Build filter query
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (pincode) filter.pincode = pincode;
    if (department) filter.department = department;

    const complaints = await Complaint.find(filter)
      .populate('citizenId', 'name email mobile')
      .sort({ createdAt: -1 });

    console.log(`📊 Authority fetched ${complaints.length} complaints with filters:`, filter);

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

// @route   PUT /api/authority/complaints/:id/status
// @desc    Update complaint status (for authorities)
// @access  Private (Authority only)
router.put('/complaints/:id/status', protect, authorize('authority'), async (req, res) => {
  try {
    const { status, remarks } = req.body;

    // Validation
    const validStatuses = ['Submitted', 'Under Review', 'In Progress', 'Resolved'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value. Must be one of: Submitted, Under Review, In Progress, Resolved'
      });
    }

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Update status
    complaint.status = status;
    complaint.statusHistory.push({
      status,
      updatedAt: new Date(),
      updatedBy: req.user._id,
      remarks: remarks || ''
    });

    await complaint.save();

    console.log(`✅ Complaint ${complaint._id} status updated to: ${status} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Complaint status updated successfully',
      complaint
    });
  } catch (error) {
    console.error('Error updating complaint status:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating complaint status',
      error: error.message
    });
  }
});

// @route   GET /api/authority/stats
// @desc    Get complaint statistics
// @access  Private (Authority only)
router.get('/stats', protect, authorize('authority'), async (req, res) => {
  try {
    // Count by status
    const totalComplaints = await Complaint.countDocuments();
    const submitted = await Complaint.countDocuments({ status: 'Submitted' });
    const underReview = await Complaint.countDocuments({ status: 'Under Review' });
    const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
    const resolved = await Complaint.countDocuments({ status: 'Resolved' });

    // Category-wise breakdown
    const categoryStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Department-wise breakdown
    const departmentStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // Pincode-wise breakdown (top 10)
    const pincodeStats = await Complaint.aggregate([
      {
        $group: {
          _id: '$pincode',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 10
      }
    ]);

    console.log('📊 Statistics fetched successfully');

    res.json({
      success: true,
      stats: {
        total: totalComplaints,
        byStatus: {
          submitted,
          underReview,
          inProgress,
          resolved
        },
        byCategory: categoryStats,
        byDepartment: departmentStats,
        byPincode: pincodeStats
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching statistics',
      error: error.message
    });
  }
});

module.exports = router;