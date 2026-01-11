import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { complaintAPI, aiAssistantAPI } from '../services/api';
import { Upload, Mic, MicOff, Send } from 'lucide-react';
import AIAssistant from './AIAssistant';

const ComplaintForm = ({ onSuccess }) => {
  const { t, language } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    pincode: '',
    complaintText: '',
    language: language,
  });
  
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [suggestedCategory, setSuggestedCategory] = useState(null);
  const [categoryLoading, setCategoryLoading] = useState(false);
  const categoryTimeoutRef = useRef(null);

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = false;
      recognitionInstance.lang = formData.language === 'hi' ? 'hi-IN' : formData.language === 'mr' ? 'mr-IN' : 'en-IN';

      recognitionInstance.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setFormData(prev => ({
          ...prev,
          complaintText: prev.complaintText + (prev.complaintText ? ' ' : '') + transcript
        }));
        setIsRecording(false);
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsRecording(false);
        setError('Speech recognition failed. Please try typing instead.');
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
      };

      setRecognition(recognitionInstance);
    }
  }, [formData.language]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');

    // Auto-suggest category when complaint text is typed (debounced)
    if (e.target.name === 'complaintText') {
      // Clear previous timeout
      if (categoryTimeoutRef.current) {
        clearTimeout(categoryTimeoutRef.current);
      }

      // Set new timeout for auto-suggestion
      if (e.target.value.trim().length > 20) {
        categoryTimeoutRef.current = setTimeout(() => {
          autoSuggestCategory(e.target.value);
        }, 2000); // Wait 2 seconds after user stops typing
      } else {
        // Clear suggestion if text is too short
        setSuggestedCategory(null);
      }
    }
  };

  // Auto-suggest category based on complaint text
  const autoSuggestCategory = async (text) => {
    if (categoryLoading || !text || text.trim().length < 20) return;

    setCategoryLoading(true);
    try {
      const response = await aiAssistantAPI.suggestCategory(text);
      if (response.data.success) {
        setSuggestedCategory(response.data.suggestion);
      }
    } catch (error) {
      console.error('Auto category suggestion failed:', error);
      // Don't show error to user, just fail silently
    } finally {
      setCategoryLoading(false);
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (categoryTimeoutRef.current) {
        clearTimeout(categoryTimeoutRef.current);
      }
    };
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Photo size should be less than 5MB');
        return;
      }
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleVoiceInput = () => {
    if (!recognition) {
      setError('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      try {
        recognition.start();
        setIsRecording(true);
        setError('');
      } catch (err) {
        console.error('Error starting recognition:', err);
        setError('Could not start voice recording. Please try again.');
        setIsRecording(false);
      }
    }
  };

  const handleImproveText = (improvedText) => {
    setFormData(prev => ({
      ...prev,
      complaintText: improvedText
    }));
  };

  const handleSuggestCategory = (suggestion) => {
    // Update suggested category when AI Assistant suggests
    setSuggestedCategory(suggestion);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validation
      if (!formData.fullName || !formData.mobile || !formData.pincode || !formData.complaintText) {
        setError('Please fill all required fields');
        setLoading(false);
        return;
      }

      // Create FormData for file upload
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName);
      submitData.append('mobile', formData.mobile);
      submitData.append('pincode', formData.pincode);
      submitData.append('complaintText', formData.complaintText);
      submitData.append('language', formData.language);
      submitData.append('isVoice', 'false');
      
      if (photoFile) {
        submitData.append('photo', photoFile);
      }

      const response = await complaintAPI.submit(submitData);

      if (response.data.success) {
        // Reset form
        setFormData({
          fullName: '',
          mobile: '',
          pincode: '',
          complaintText: '',
          language: language,
        });
        setPhotoFile(null);
        setPhotoPreview('');
        
        // Call success callback
        if (onSuccess) {
          onSuccess(response.data.complaint);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Full Name */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('yourName')} *
        </label>
        <input
          type="text"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          className="input-field"
          placeholder="Enter your full name"
          required
        />
      </div>

      {/* Mobile Number */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('yourMobile')} *
        </label>
        <input
          type="tel"
          name="mobile"
          value={formData.mobile}
          onChange={handleChange}
          className="input-field"
          placeholder="98XXXXXXXX"
          pattern="[6-9][0-9]{9}"
          maxLength="10"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Enter 10-digit Indian mobile number</p>
      </div>

      {/* Pincode */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('pincode')} *
        </label>
        <input
          type="text"
          name="pincode"
          value={formData.pincode}
          onChange={handleChange}
          className="input-field"
          placeholder="423601"
          pattern="[0-9]{6}"
          maxLength="6"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Enter 6-digit pincode</p>
      </div>

      {/* Language Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('selectLanguage')} *
        </label>
        <select
          name="language"
          value={formData.language}
          onChange={handleChange}
          className="input-field"
          required
        >
          <option value="en">English</option>
          <option value="hi">हिंदी (Hindi)</option>
          <option value="mr">मराठी (Marathi)</option>
        </select>
      </div>

      {/* Complaint Text */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('complaintText')} *
        </label>
        <div className="relative">
        <textarea
          name="complaintText"
          value={formData.complaintText}
          onChange={handleChange}
            className="input-field min-h-[150px] pr-12"
          placeholder={t('complaintTextPlaceholder')}
          required
        />
          <button
            type="button"
            onClick={handleVoiceInput}
            className={`absolute right-3 top-3 p-2 rounded-full transition ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={isRecording ? 'Stop Recording' : 'Start Voice Input'}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        </div>
        {isRecording && (
          <p className="text-sm text-red-600 mt-2 flex items-center space-x-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span>Recording... Speak now</span>
          </p>
        )}
        <p className="text-xs text-gray-500 mt-1">
          Click the microphone icon to use voice input
        </p>
        
        {/* Auto-suggested Category */}
        {suggestedCategory && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-semibold text-blue-900 mb-1">
                  🤖 AI Suggested Category
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Category:</strong> {suggestedCategory.category}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Department:</strong> {suggestedCategory.department}
                </p>
                {suggestedCategory.explanation && (
                  <p className="text-xs text-blue-700 mt-1">
                    {suggestedCategory.explanation}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSuggestedCategory(null)}
                className="text-blue-600 hover:text-blue-800"
                title="Dismiss"
              >
                ×
              </button>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Note: Your complaint will be automatically categorized when you submit it.
            </p>
          </div>
        )}
        
        {categoryLoading && (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-600">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span>AI is analyzing your complaint...</span>
          </div>
        )}
      </div>

      {/* Photo Upload */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {t('uploadPhoto')}
        </label>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg cursor-pointer transition">
            <Upload size={20} className="text-gray-600" />
            <span className="text-sm text-gray-700">Choose Photo</span>
            <input
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </label>
          {photoPreview && (
            <img
              src={photoPreview}
              alt="Preview"
              className="h-16 w-16 object-cover rounded-lg border-2 border-gray-300"
            />
          )}
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="btn-primary w-full flex items-center justify-center space-x-2"
      >
        {loading ? (
          <>
            <div className="spinner border-white border-t-transparent w-5 h-5"></div>
            <span>{t('submitting')}</span>
          </>
        ) : (
          <>
            <Send size={20} />
            <span>{t('submit')}</span>
          </>
        )}
      </button>
    </form>

    {/* AI Assistant */}
    <AIAssistant
      complaintText={formData.complaintText}
      language={formData.language}
      onImproveText={handleImproveText}
      onSuggestCategory={handleSuggestCategory}
    />
  </div>
  );
};

export default ComplaintForm;