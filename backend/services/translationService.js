/**
 * AI Translation Service using DeepSeek API
 * Automatically translates Hindi/Marathi to English
 */

/**
 * Translate text to English using DeepSeek API
 * @param {string} text - Text to translate
 * @param {string} sourceLanguage - Source language code (hi, mr, en)
 * @returns {Promise<string>} - Translated text
 */
exports.translateToEnglish = async (text, sourceLanguage) => {
  try {
    // If already in English or empty, return as is
    if (sourceLanguage === 'en' || !text || text.trim().length === 0) {
      return text;
    }

    console.log(`🌐 AI Translation: ${sourceLanguage} -> en`);
    console.log(`Original text: ${text.substring(0, 100)}${text.length > 100 ? '...' : ''}`);
    
    // Use DeepSeek API for translation if available
    if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your-deepseek-key-here') {
      return await translateWithDeepSeek(text, sourceLanguage, 'en');
    } else {
      console.log('⚠️ DeepSeek API key not configured, returning original text');
      return text;
    }
  } catch (error) {
    console.error('Translation error:', error);
    return text; // Return original text if translation fails
  }
};

/**
 * Translate text from English to target language using DeepSeek API
 * @param {string} text - Text to translate
 * @param {string} targetLanguage - Target language code
 * @returns {Promise<string>} - Translated text
 */
exports.translateFromEnglish = async (text, targetLanguage) => {
  try {
    if (targetLanguage === 'en' || !text || text.trim().length === 0) {
      return text;
    }

    console.log(`🌐 AI Translation: en -> ${targetLanguage}`);

    // Use DeepSeek API for translation if available
    if (process.env.DEEPSEEK_API_KEY && process.env.DEEPSEEK_API_KEY !== 'your-deepseek-key-here') {
      return await translateWithDeepSeek(text, 'en', targetLanguage);
    } else {
      console.log('⚠️ DeepSeek API key not configured, returning original text');
    return text;
    }
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
};

/**
 * Translate using DeepSeek API
 * @param {string} text - Text to translate
 * @param {string} sourceLanguage - Source language code
 * @param {string} targetLanguage - Target language code (default: 'en')
 * @returns {Promise<string>} - Translated text
 */
async function translateWithDeepSeek(text, sourceLanguage, targetLanguage = 'en') {
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    });

    // Map language codes to full names
    const languageNames = {
      'hi': 'Hindi',
      'mr': 'Marathi',
      'en': 'English'
    };

    const sourceLangName = languageNames[sourceLanguage] || sourceLanguage;
    const targetLangName = languageNames[targetLanguage] || targetLanguage;

    const prompt = `You are a professional translator. Translate the following text from ${sourceLangName} to ${targetLangName}. 
Provide only the translated text, no explanations, no additional text, no quotes.

Text to translate: "${text}"

Translated text:`;

    const response = await openai.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 500
    });

    const translatedText = response.choices[0].message.content.trim();
    
    // Clean up the response (remove quotes, markdown, etc.)
    let cleanTranslation = translatedText
      .replace(/^["']|["']$/g, '') // Remove surrounding quotes
      .replace(/^```[\w]*\n?|```$/g, '') // Remove code blocks
      .trim();
    
    console.log(`✅ Translation completed: ${cleanTranslation.substring(0, 100)}${cleanTranslation.length > 100 ? '...' : ''}`);
    
    return cleanTranslation || text; // Fallback to original if translation is empty
  } catch (error) {
    console.error('DeepSeek translation failed:', error.message);
    return text; // Return original text if translation fails
  }
}
