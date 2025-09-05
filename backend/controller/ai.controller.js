import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getResult = async (req, res) => {
  try {
    const prompt = req.body.prompt || req.query.prompt;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(200).json({
        result: `This is a demo response for: "${prompt}". To get real AI responses, please set your GEMINI_API_KEY in the environment variables.`,
        isDemo: true
      });
    }
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.status(200).json({
      result: text,
      isDemo: false
    });

  } catch (error) {
    console.error('AI Controller Error:', error);
    res.status(500).json({ 
      error: 'Failed to generate AI response',
      details: error.message 
    });
  }
};