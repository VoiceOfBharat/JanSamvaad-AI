import React, { useState, useEffect } from 'react';
import { authorityAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Filter, TrendingUp, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const AuthorityDashboard = () => {
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    pincode: '',
  });

  useEffect(() => {
    fetchData();
  }, [filters]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [complaintsRes, statsRes] = await Promise.all([
        authorityAPI.getAllComplaints(filters),
        authorityAPI.getStats(),
      ]);
      setComplaints(complaintsRes.data.complaints);
      setStats(statsRes.data.stats);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (complaintId, newStatus) => {
    try {
      await authorityAPI.updateStatus(complaintId, { status: newStatus });
      alert('Status updated successfully!');
      fetchData();
      setSelectedComplaint(null);
    } catch (error) {
      alert('Failed to update status');
    }
  };

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Authority Dashboard
          </h1>
          <p className="text-gray-600">Manage and track citizen grievances</p>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm mb-1">Total Complaints</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <TrendingUp size={40} className="text-blue-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm mb-1">Submitted</p>
                  <p className="text-3xl font-bold">{stats.byStatus.submitted}</p>
                </div>
                <AlertCircle size={40} className="text-yellow-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm mb-1">In Progress</p>
                  <p className="text-3xl font-bold">{stats.byStatus.inProgress + stats.byStatus.underReview}</p>
                </div>
                <Clock size={40} className="text-purple-200" />
              </div>
            </div>

            <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm mb-1">Resolved</p>
                  <p className="text-3xl font-bold">{stats.byStatus.resolved}</p>
                </div>
                <CheckCircle size={40} className="text-green-200" />
              </div>
            </div>
          </div>
        )}

        {/* Charts */}
        {stats && stats.byCategory && (
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Complaints by Category</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={stats.byCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="_id" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filters */}
        <div className="card mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter size={20} className="text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Filters</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All Status</option>
              <option value="Submitted">Submitted</option>
              <option value="Under Review">Under Review</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>

            <select
              name="category"
              value={filters.category}
              onChange={handleFilterChange}
              className="input-field"
            >
              <option value="">All Categories</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Roads and Infrastructure">Roads and Infrastructure</option>
              <option value="Electricity">Electricity</option>
              <option value="Health Services">Health Services</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Education">Education</option>
              <option value="Public Transport">Public Transport</option>
              <option value="Law and Order">Law and Order</option>
              <option value="Housing">Housing</option>
              <option value="Other">Other</option>
            </select>

            <input
              type="text"
              name="pincode"
              value={filters.pincode}
              onChange={handleFilterChange}
              placeholder="Filter by Pincode"
              className="input-field"
            />
          </div>
        </div>

        {/* Complaints Table */}
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">All Complaints</h2>
          
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="spinner"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">ID</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Pincode</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {complaints.map((complaint) => (
                    <tr key={complaint._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{complaint._id.slice(-8)}</td>
                      <td className="px-4 py-3 text-sm">{complaint.fullName}</td>
                      <td className="px-4 py-3 text-sm">{complaint.category}</td>
                      <td className="px-4 py-3 text-sm">{complaint.pincode}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${
                          complaint.status === 'Submitted' ? 'status-submitted' :
                          complaint.status === 'Under Review' ? 'status-under-review' :
                          complaint.status === 'In Progress' ? 'status-in-progress' :
                          'status-resolved'
                        }`}>
                          {complaint.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedComplaint(complaint)}
                          className="text-blue-600 hover:text-blue-800 font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Complaint Detail Modal */}
      {selectedComplaint && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Complaint Details</h2>
              <button
                onClick={() => setSelectedComplaint(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div><strong>ID:</strong> {selectedComplaint._id}</div>
              <div><strong>Name:</strong> {selectedComplaint.fullName}</div>
              <div><strong>Mobile:</strong> {selectedComplaint.mobile}</div>
              <div><strong>Pincode:</strong> {selectedComplaint.pincode}</div>
              <div><strong>Category:</strong> {selectedComplaint.category}</div>
              <div><strong>Department:</strong> {selectedComplaint.department}</div>
              <div><strong>Complaint:</strong> {selectedComplaint.translatedText}</div>
              {selectedComplaint.photoUrl && (
                <div>
                  <strong>Photo:</strong>
                  <img src={`http://localhost:5000${selectedComplaint.photoUrl}`} alt="Complaint" className="mt-2 rounded-lg max-w-full" />
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <label className="block text-sm font-semibold mb-2">Update Status</label>
              <div className="flex gap-2">
                {['Submitted', 'Under Review', 'In Progress', 'Resolved'].map((status) => (
                  <button
                    key={status}
                    onClick={() => handleStatusUpdate(selectedComplaint._id, status)}
                    className={`px-4 py-2 rounded-lg font-semibold ${
                      selectedComplaint.status === status
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 hover:bg-gray-300'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthorityDashboard;