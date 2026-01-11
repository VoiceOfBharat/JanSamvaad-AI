import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { complaintAPI } from '../services/api';
import ComplaintForm from '../components/ComplaintForm';
import ComplaintCard from '../components/ComplaintCard';
import AIAssistant from '../components/AIAssistant';
import { Plus, FileText, AlertCircle, RefreshCw, Bell } from 'lucide-react';

const CitizenDashboard = () => {
  const { t } = useLanguage();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);

  // Fetch complaints on mount and set up auto-refresh
  useEffect(() => {
    fetchComplaints();
    
    // Auto-refresh complaints every 30 seconds for real-time updates
    const interval = setInterval(() => {
      fetchComplaints();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchComplaints = async (showNotification = false) => {
    try {
      if (!showNotification) {
      setLoading(true);
      }
      const response = await complaintAPI.getMyComplaints();
      const newComplaints = response.data.complaints;
      
      // Check for status changes and show notifications
      if (showNotification && complaints.length > 0) {
        newComplaints.forEach(newComplaint => {
          const oldComplaint = complaints.find(c => c._id === newComplaint._id);
          if (oldComplaint && oldComplaint.status !== newComplaint.status) {
            showStatusNotification(newComplaint);
          }
        });
      }
      
      setComplaints(newComplaints);
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const showStatusNotification = (complaint) => {
    const statusMessages = {
      'Under Review': 'Your complaint is now under review',
      'In Progress': 'Work has started on your complaint',
      'Resolved': 'Your complaint has been resolved!'
    };

    const message = statusMessages[complaint.status] || `Your complaint status changed to ${complaint.status}`;
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Complaint Status Update', {
        body: message,
        icon: '/logo192.png'
      });
    }

    // Also show in-page notification
    alert(`📢 ${message}\n\nComplaint ID: ${complaint._id.substring(0, 8)}...`);
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const handleComplaintSubmit = (newComplaint) => {
    setComplaints([newComplaint, ...complaints]);
    setShowForm(false);
    // Show success message
    alert('Complaint submitted successfully!');
  };

  const handleComplaintClick = (complaint) => {
    setSelectedComplaint(complaint);
  };

  const closeModal = () => {
    setSelectedComplaint(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('myComplaints')}
          </h1>
          <p className="text-gray-600">Track and manage your grievances</p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => setShowForm(!showForm)}
            className="btn-primary flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>{t('submitComplaint')}</span>
        </button>
          <button
            onClick={() => fetchComplaints(false)}
            disabled={loading}
            className="btn-secondary flex items-center space-x-2"
            title="Refresh complaints"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
          {('Notification' in window && Notification.permission === 'granted') && (
            <div className="flex items-center space-x-2 text-sm text-green-600">
              <Bell size={16} />
              <span>Notifications enabled</span>
            </div>
          )}
        </div>

        {/* Complaint Form */}
        {showForm && (
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              {t('complaintDetails')}
            </h2>
            <ComplaintForm onSuccess={handleComplaintSubmit} />
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="spinner"></div>
          </div>
        )}

        {/* Complaints List */}
        {!loading && complaints.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {complaints.map((complaint) => (
              <ComplaintCard
                key={complaint._id}
                complaint={complaint}
                onClick={() => handleComplaintClick(complaint)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && complaints.length === 0 && (
          <div className="text-center py-20">
            <FileText className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {t('noComplaints')}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('submitFirstComplaint')}
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="btn-primary inline-flex items-center space-x-2"
            >
              <Plus size={20} />
              <span>{t('submitComplaint')}</span>
            </button>
          </div>
        )}
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                Complaint Details
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-600">Status</label>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold mt-1 ${
                  selectedComplaint.status === 'Submitted' ? 'bg-yellow-100 text-yellow-800' :
                  selectedComplaint.status === 'Under Review' ? 'bg-blue-100 text-blue-800' :
                  selectedComplaint.status === 'In Progress' ? 'bg-purple-100 text-purple-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {selectedComplaint.status}
                </div>
              </div>

              {/* Status History */}
              {selectedComplaint.statusHistory && selectedComplaint.statusHistory.length > 0 && (
                <div>
                  <label className="text-sm font-semibold text-gray-600 mb-2 block">Status History</label>
                  <div className="space-y-2">
                    {selectedComplaint.statusHistory
                      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
                      .map((history, index) => (
                        <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                          <div className={`w-3 h-3 rounded-full mt-1 ${
                            history.status === 'Submitted' ? 'bg-yellow-500' :
                            history.status === 'Under Review' ? 'bg-blue-500' :
                            history.status === 'In Progress' ? 'bg-purple-500' :
                            'bg-green-500'
                          }`}></div>
                          <div className="flex-1">
                            <div className="font-semibold text-gray-900">{history.status}</div>
                            <div className="text-xs text-gray-500">
                              {new Date(history.updatedAt).toLocaleString('en-IN')}
                            </div>
                            {history.remarks && (
                              <div className="text-sm text-gray-600 mt-1">{history.remarks}</div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-600">Complaint ID</label>
                <p className="text-gray-900">{selectedComplaint._id}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Name</label>
                <p className="text-gray-900">{selectedComplaint.fullName}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Mobile</label>
                <p className="text-gray-900">{selectedComplaint.mobile}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Pincode</label>
                <p className="text-gray-900">{selectedComplaint.pincode}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Category</label>
                <p className="text-gray-900">{selectedComplaint.category}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Department</label>
                <p className="text-gray-900">{selectedComplaint.department}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-600">Complaint</label>
                <p className="text-gray-900 whitespace-pre-wrap">
                  {selectedComplaint.translatedText || selectedComplaint.originalText}
                </p>
              </div>

              {selectedComplaint.photoUrl && (
                <div>
                  <label className="text-sm font-semibold text-gray-600">Photo</label>
                  <img
                    src={`http://localhost:5000${selectedComplaint.photoUrl}`}
                    alt="Complaint"
                    className="mt-2 rounded-lg max-w-full h-auto"
                  />
                </div>
              )}

              <div>
                <label className="text-sm font-semibold text-gray-600">Submitted On</label>
                <p className="text-gray-900">
                  {new Date(selectedComplaint.createdAt).toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant (available on dashboard too) */}
      <AIAssistant />
    </div>
  );
};

export default CitizenDashboard;