import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { Calendar, MapPin, Tag, FileText } from 'lucide-react';

const ComplaintCard = ({ complaint, onClick }) => {
  const { t } = useLanguage();

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Get status class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Submitted':
        return 'status-badge status-submitted';
      case 'Under Review':
        return 'status-badge status-under-review';
      case 'In Progress':
        return 'status-badge status-in-progress';
      case 'Resolved':
        return 'status-badge status-resolved';
      default:
        return 'status-badge';
    }
  };

  return (
    <div
      onClick={onClick}
      className="card cursor-pointer hover:scale-[1.02] transition-all"
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-800">
            {complaint.fullName}
          </h3>
          <p className="text-sm text-gray-500">
            ID: {complaint._id.slice(-8).toUpperCase()}
          </p>
        </div>
        <span className={getStatusClass(complaint.status)}>
          {complaint.status}
        </span>
      </div>

      {/* Complaint Text */}
      <div className="mb-4">
        <div className="flex items-start space-x-2">
          <FileText size={18} className="text-gray-400 mt-1 flex-shrink-0" />
          <p className="text-gray-700 line-clamp-3">
            {complaint.translatedText || complaint.originalText}
          </p>
        </div>
      </div>

      {/* Category */}
      <div className="flex items-center space-x-2 mb-3">
        <Tag size={16} className="text-blue-500" />
        <span className="text-sm font-semibold text-blue-600">
          {complaint.category}
        </span>
      </div>

      {/* Footer Info */}
      <div className="flex items-center justify-between text-sm text-gray-500 pt-3 border-t border-gray-200">
        <div className="flex items-center space-x-2">
          <MapPin size={16} />
          <span>{complaint.pincode}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar size={16} />
          <span>{formatDate(complaint.createdAt)}</span>
        </div>
      </div>

      {/* Photo indicator */}
      {complaint.photoUrl && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <span className="text-xs text-gray-500">📷 Photo attached</span>
        </div>
      )}
    </div>
  );
};

export default ComplaintCard;