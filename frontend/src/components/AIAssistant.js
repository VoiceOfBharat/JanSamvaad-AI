import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, Sparkles, X, Lightbulb, HelpCircle } from 'lucide-react';
import { aiAssistantAPI } from '../services/api';

const AIAssistant = ({ complaintText = '', language = 'en', onImproveText, onSuggestCategory }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you:\n• Write better complaints\n• Understand the complaint process\n• Get category suggestions\n• Answer your questions\n\nHow can I help you today?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await aiAssistantAPI.chat(userMessage, {
        complaintText,
        language
      });

      if (response.data.success) {
        const aiResponse = response.data.response;
        setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        
        // Auto-suggest category if complaint text exists and user asks about category
        if (complaintText && complaintText.trim().length > 10 && 
            (userMessage.toLowerCase().includes('category') || userMessage.toLowerCase().includes('categor'))) {
          // Automatically trigger category suggestion
          setTimeout(() => {
            handleQuickAction('suggest');
          }, 500);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again or contact support.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = async (action) => {
    if (loading) return;

    let query = '';
    switch (action) {
      case 'improve':
        if (!complaintText.trim()) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Please write your complaint first, then I can help improve it!'
          }]);
          return;
        }
        setLoading(true);
        try {
          const improveResponse = await aiAssistantAPI.improve(complaintText, language);
          if (improveResponse.data.success && onImproveText) {
            onImproveText(improveResponse.data.improvedText);
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: 'I\'ve improved your complaint! Check the text field above.'
            }]);
          }
        } catch (error) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Sorry, I couldn\'t improve your complaint. Please try again.'
          }]);
        } finally {
          setLoading(false);
        }
        return;

      case 'suggest':
        if (!complaintText.trim()) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Please write your complaint first, then I can suggest a category!'
          }]);
          return;
        }
        setLoading(true);
        try {
          const suggestResponse = await aiAssistantAPI.suggestCategory(complaintText);
          if (suggestResponse.data.success) {
            const { category, department, explanation } = suggestResponse.data.suggestion;
            setMessages(prev => [...prev, {
              role: 'assistant',
              content: `Based on your complaint, I suggest:\n\n**Category:** ${category}\n**Department:** ${department}\n\n${explanation}`
            }]);
            if (onSuggestCategory) {
              onSuggestCategory({ category, department });
            }
          }
        } catch (error) {
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: 'Sorry, I couldn\'t suggest a category. Your complaint will be automatically categorized upon submission.'
          }]);
        } finally {
          setLoading(false);
        }
        return;

      case 'help':
        query = 'How do I write an effective complaint?';
        break;
      case 'status':
        query = 'How can I track my complaint status?';
        break;
      default:
        return;
    }

    if (query) {
      setInput(query);
      setTimeout(() => handleSend(), 100);
    }
  };

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg hover:shadow-xl transition-all z-50 flex items-center space-x-2"
          title="AI Assistant"
        >
          <Sparkles size={24} />
          <span className="hidden md:inline">AI Assistant</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-2xl shadow-2xl flex flex-col z-50 border border-gray-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Sparkles size={20} />
              <h3 className="font-bold">AI Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 rounded-full p-1 transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Quick Actions */}
          {complaintText && (
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex space-x-2">
              <button
                onClick={() => handleQuickAction('improve')}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-medium transition disabled:opacity-50"
                title="Improve complaint text"
              >
                <Lightbulb size={14} />
                <span>Improve</span>
              </button>
              <button
                onClick={() => handleQuickAction('suggest')}
                disabled={loading}
                className="flex-1 flex items-center justify-center space-x-1 px-3 py-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 text-sm font-medium transition disabled:opacity-50"
                title="Suggest category"
              >
                <HelpCircle size={14} />
                <span>Category</span>
              </button>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Help Buttons */}
          <div className="p-3 bg-gray-50 border-t border-gray-200 flex space-x-2">
            <button
              onClick={() => handleQuickAction('help')}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition disabled:opacity-50"
            >
              Help
            </button>
            <button
              onClick={() => handleQuickAction('status')}
              disabled={loading}
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm text-gray-700 transition disabled:opacity-50"
            >
              Track Status
            </button>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={loading}
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4 py-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AIAssistant;

