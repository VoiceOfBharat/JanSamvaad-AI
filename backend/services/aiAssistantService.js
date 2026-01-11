/**
 * AI Assistant Service for Complaints
 * Helps users with complaint submission, guidance, and questions
 */

/**
 * Get AI assistance for complaint-related queries
 * @param {string} query - User's question or request
 * @param {string} context - Additional context (complaint text, status, etc.)
 * @returns {Promise<string>} - AI assistant response
 */
exports.getAssistance = async (query, context = {}) => {
  try {
    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'your-deepseek-key-here') {
      return getFallbackResponse(query, context);
    }

    return await getDeepSeekAssistance(query, context);
  } catch (error) {
    console.error('AI Assistant error:', error);
    return getFallbackResponse(query, context);
  }
};

/**
 * Get AI assistance using DeepSeek API
 */
async function getDeepSeekAssistance(query, context) {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    });

    const systemPrompt = `You are a helpful AI assistant for the JanSamvaad AI citizen grievance redressal platform. 
Your role is to help citizens with complaints.

CRITICAL RULES:
- If the user has already written a complaint, analyze it and provide specific guidance based on what they wrote
- NEVER ask for details that are already in their complaint text
- Extract information from their complaint (location, issue, impact, category) and use it in your response
- If they ask about category or you're analyzing their complaint, automatically suggest the most appropriate category based on their complaint text
- Keep responses SHORT (2-3 sentences OR 3-4 bullet points maximum)
- Be friendly, conversational, and direct
- Use simple bullet points (•) for lists, max 3-4 items
- NO long paragraphs, NO templates, NO generic questions
- Answer based on their actual complaint content
- Use the user's preferred language (Hindi, Marathi, or English)

Think: Analyze their complaint, provide specific help based on what they wrote, including automatic category suggestions.`;

    let userPrompt = query;

    // Add context if available - prioritize complaint text analysis
    if (context.complaintText && context.complaintText.trim().length > 0) {
      userPrompt = `User's complaint: "${context.complaintText}"\n\nUser's question: ${query}\n\nAnalyze the complaint text above and:
1. Answer the user's question based on what they've already written
2. If they ask about category or you're providing general help, automatically suggest the most appropriate category from: Water Supply, Roads and Infrastructure, Electricity, Health Services, Sanitation, Education, Public Transport, Law and Order, Housing, Other
3. Don't ask them to provide details they've already given
4. Provide specific, actionable guidance based on their complaint`;
    }
    
    if (context.language) {
      userPrompt += `\n\nUser's preferred language: ${context.language}`;
    }
    if (context.status) {
      userPrompt += `\n\nCurrent complaint status: ${context.status}`;
    }
    if (context.category) {
      userPrompt += `\n\nComplaint category: ${context.category}`;
    }

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 150  // Further reduced for very concise responses
    });

    const assistantResponse = response.choices[0].message.content.trim();
    console.log(`✅ AI Assistant response generated`);
    
    return assistantResponse;
  } catch (error) {
    console.error('DeepSeek AI Assistant failed:', error.message);
    return getFallbackResponse(query, context);
  }
}

/**
 * Fallback responses when AI is not available
 */
function getFallbackResponse(query, context) {
  const lowerQuery = query.toLowerCase();

  // Complaint writing help
  if (lowerQuery.includes('write') || lowerQuery.includes('how to') || lowerQuery.includes('effective')) {
    // If complaint text exists, analyze it
    if (context.complaintText && context.complaintText.trim().length > 0) {
      const text = context.complaintText;
      let feedback = `Based on your complaint, here's how to improve it:\n\n`;
      
      // Check for key elements
      if (!text.match(/\d{6}/)) {
        feedback += `• Add your 6-digit pincode\n`;
      }
      if (text.length < 20) {
        feedback += `• Add more details about the problem\n`;
      }
      if (!text.match(/\d+/)) {
        feedback += `• Mention when the issue started (dates/duration)\n`;
      }
      
      feedback += `• Be specific about location and impact\n`;
      return feedback;
    }
    
    return `To write an effective complaint, be clear and specific:
• Describe the problem clearly (what, where, when)
• Include location (pincode, area name)
• Mention how it affects you
• Attach photos if available`;
  }

  // Status tracking
  if (lowerQuery.includes('status') || lowerQuery.includes('track')) {
    return `Track your complaint in the dashboard. Statuses:
• Submitted - Complaint received
• Under Review - Being reviewed
• In Progress - Action taken
• Resolved - Issue fixed`;
  }

  // Categories
  if (lowerQuery.includes('category') || lowerQuery.includes('type')) {
    return `Categories: Water Supply, Roads, Electricity, Health, Sanitation, Education, Transport, Law & Order, Housing, Other.

Our AI automatically categorizes your complaint when you submit it.`;
  }

  // General help
  return `I can help with:
• Writing better complaints
• Understanding the process
• Tracking status
• Category suggestions

What would you like to know?`;
}

/**
 * Improve complaint text using AI
 * @param {string} complaintText - Original complaint text
 * @param {string} language - Language of the complaint
 * @returns {Promise<string>} - Improved complaint text
 */
exports.improveComplaint = async (complaintText, language = 'en') => {
  try {
    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'your-deepseek-key-here') {
      return complaintText; // Return original if no API key
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    });

    const languageNames = {
      'hi': 'Hindi',
      'mr': 'Marathi',
      'en': 'English'
    };

    const langName = languageNames[language] || 'English';

    const prompt = `You are helping a citizen improve their complaint for a government grievance system.
The complaint is in ${langName}.

Original complaint: "${complaintText}"

Improve this complaint to be:
1. Clear and specific
2. Include relevant details
3. Professional but accessible
4. Actionable for authorities

Provide the improved version in ${langName}. Keep it concise and focused.`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500
    });

    const improvedText = response.choices[0].message.content.trim();
    console.log(`✅ Complaint improvement generated`);
    
    return improvedText || complaintText;
  } catch (error) {
    console.error('Complaint improvement failed:', error.message);
    return complaintText; // Return original on error
  }
};

/**
 * Suggest category and department for a complaint
 * @param {string} complaintText - Complaint text
 * @returns {Promise<{category: string, department: string, explanation: string}>}
 */
exports.suggestCategory = async (complaintText) => {
  try {
    if (!process.env.DEEPSEEK_API_KEY || process.env.DEEPSEEK_API_KEY === 'your-deepseek-key-here') {
      return {
        category: 'Other',
        department: 'General Administration',
        explanation: 'AI suggestions not available. Your complaint will be automatically categorized upon submission.'
      };
    }

    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    });

    const prompt = `Analyze this complaint and suggest the most appropriate category and department.

Complaint: "${complaintText}"

Respond in JSON format:
{
  "category": "<one of: Water Supply, Roads and Infrastructure, Electricity, Health Services, Sanitation, Education, Public Transport, Law and Order, Housing, Other>",
  "department": "<specific government department name>",
  "explanation": "<brief explanation of why this category fits>"
}`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200
    });

    const result = response.choices[0].message.content.trim();
    const cleanResult = result.replace(/```json|```/g, '').trim();
    
    try {
      const suggestion = JSON.parse(cleanResult);
      console.log(`✅ Category suggestion generated: ${suggestion.category}`);
      return suggestion;
    } catch (parseError) {
      console.error('Failed to parse suggestion:', parseError);
      return {
        category: 'Other',
        department: 'General Administration',
        explanation: 'Could not analyze complaint. It will be categorized automatically upon submission.'
      };
    }
  } catch (error) {
    console.error('Category suggestion failed:', error.message);
    return {
      category: 'Other',
      department: 'General Administration',
      explanation: 'AI suggestion unavailable. Your complaint will be automatically categorized.'
    };
  }
};


