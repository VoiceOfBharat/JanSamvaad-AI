/**
 * Categorization Service with Fallback
 * Works with or without DeepSeek API
 */

/**
 * Categorize complaint using AI or fallback to keywords
 * @param {string} complaintText - Complaint text in English
 * @returns {Promise<{category: string, department: string}>}
 */
exports.categorizeComplaint = async (complaintText) => {
  try {
    // Validate input
    if (!complaintText || typeof complaintText !== 'string' || complaintText.trim().length === 0) {
      console.log('Empty or invalid complaint text, using fallback');
      return fallbackCategorization('Other complaint');
    }

    // Try DeepSeek if API key is available
    if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your-deepseek-key-here') {
      return await categorizeWithDeepSeek(complaintText);
    } else {
      console.log('DeepSeek API key not configured, using fallback categorization');
      return fallbackCategorization(complaintText);
    }
  } catch (error) {
    console.error('Categorization error:', error);
    return fallbackCategorization(complaintText || 'Other complaint');
  }
};

/**
 * Categorize using DeepSeek API (if API key available)
 */
async function categorizeWithDeepSeek(complaintText) {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    });

    const prompt = `You are an AI assistant for an Indian government grievance system. 
Analyze the following citizen complaint and categorize it.

Complaint: "${complaintText}"

Respond ONLY with a JSON object in this exact format (no markdown, no backticks):
{
  "category": "<one of: Water Supply, Roads and Infrastructure, Electricity, Health Services, Sanitation, Education, Public Transport, Law and Order, Housing, Other>",
  "department": "<specific government department name>"
}`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 150
    });

    const result = response.choices[0].message.content.trim();
    const cleanResult = result.replace(/```json|```/g, '').trim();
    
    let categorization;
    try {
      categorization = JSON.parse(cleanResult);
    } catch (parseError) {
      console.error('Failed to parse DeepSeek response:', parseError);
      return fallbackCategorization(complaintText);
    }

    // Validate category matches enum values
    const validCategories = [
      'Water Supply', 'Roads and Infrastructure', 'Electricity', 
      'Health Services', 'Sanitation', 'Education', 
      'Public Transport', 'Law and Order', 'Housing', 'Other'
    ];
    
    const category = validCategories.includes(categorization.category) 
      ? categorization.category 
      : 'Other';
    
    const department = categorization.department || 'General Administration';

    return {
      category,
      department
    };
  } catch (error) {
    console.error('DeepSeek categorization failed:', error.message);
    return fallbackCategorization(complaintText);
  }
}

/**
 * Fallback categorization using keyword matching
 * This works without any API keys
 */
function fallbackCategorization(text) {
  const lowerText = text.toLowerCase();
  
  const categories = {
    'Water Supply': {
      keywords: ['water', 'pipeline', 'tap', 'supply', 'leak', 'पानी', 'नल', 'पाणी'],
      department: 'Water Supply Department'
    },
    'Roads and Infrastructure': {
      keywords: ['road', 'pothole', 'bridge', 'footpath', 'infrastructure', 'रोड', 'सड़क', 'रस्ता'],
      department: 'Public Works Department'
    },
    'Electricity': {
      keywords: ['electricity', 'power', 'light', 'transformer', 'billing', 'बिजली', 'विद्युत'],
      department: 'Electricity Board'
    },
    'Health Services': {
      keywords: ['hospital', 'doctor', 'medical', 'health', 'ambulance', 'अस्पताल', 'डॉक्टर', 'रुग्णालय'],
      department: 'Health Department'
    },
    'Sanitation': {
      keywords: ['garbage', 'waste', 'drain', 'sanitation', 'cleanliness', 'कचरा', 'गंदगी', 'स्वच्छता'],
      department: 'Sanitation Department'
    },
    'Education': {
      keywords: ['school', 'teacher', 'education', 'classroom', 'स्कूल', 'शिक्षक', 'शाळा'],
      department: 'Education Department'
    },
    'Public Transport': {
      keywords: ['bus', 'train', 'transport', 'auto', 'बस', 'ट्रेन', 'वाहतूक'],
      department: 'Transport Department'
    },
    'Law and Order': {
      keywords: ['police', 'crime', 'theft', 'safety', 'पुलिस', 'चोरी'],
      department: 'Police Department'
    },
    'Housing': {
      keywords: ['house', 'housing', 'construction', 'building', 'घर', 'मकान'],
      department: 'Housing Department'
    }
  };

  // Check each category
  for (const [category, data] of Object.entries(categories)) {
    const matchCount = data.keywords.filter(keyword => 
      lowerText.includes(keyword)
    ).length;
    
    if (matchCount > 0) {
      console.log(`✅ Categorized as: ${category} (matched ${matchCount} keywords)`);
      return {
        category,
        department: data.department
      };
    }
  }

  // Default category if no match found
  console.log('⚠️ No category match found, using "Other"');
  return {
    category: 'Other',
    department: 'General Administration'
  };
}