import { GoogleGenAI } from "@google/genai";

// Initialize Gemini API
// Using raw fetch might be safer if @google/genai version is unknown, but we'll try fetch first
export async function scanDocumentWithGemini(file: File) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing. Check your .env file.");
  }

  // Convert File to base64
  const base64Data = await fileToBase64(file);
  const mimeType = file.type;

  const prompt = `
    Extract the following details from the uploaded image and return them strictly as a JSON object:
    - full_name (string)
    - age (number, calculate from DOB if necessary, or null)
    - gender (string, 'Male', 'Female', or null)
    - address (string, or null)
    - city (string, or null)
    - state (string, or null)
    - dob (string, YYYY-MM-DD format, or null)
    - email (string, or null)
    - phone (string, or null)
    - religion (string, or null)
    - caste (string, or null)
    - education (string, or null)
    - profession (string, or null)
    - occupation (string, or null)
    - height (string, or null)
    - marital_status (string, or null)
    - annual_income (string, or null)
    - mother_tongue (string, or null)
    
    CRITICAL INSTRUCTION: You must strictly map ONLY the data explicitly found in the image. Do NOT invent, guess, or use default values for missing details. If a specific detail (like 'Height' or 'Annual Income') is not visible in the text, you MUST set its value to null.
    Do not wrap the JSON in markdown code blocks. Just return the raw JSON object.
  `;

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            {
              inline_data: {
                mime_type: mimeType,
                data: base64Data.split(',')[1] // remove data:image/png;base64,
              }
            }
          ]
        }]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API Error (Status ${response.status}): ${errorText}`);
    }

    const data = await response.json();
    const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Clean up potential markdown formatting from Gemini
    const cleanedText = textOutput.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
      return JSON.parse(cleanedText);
    } catch (parseError) {
      // Fallback: search for JSON block
      const jsonMatch = textOutput.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (innerParseError) {
          // ignore and fall through
        }
      }
      throw new Error(`Failed to parse response as JSON. Output was: ${textOutput.substring(0, 100)}...`);
    }

  } catch (error: any) {
    console.error("OCR Error:", error);
    throw new Error(error.message || "Failed to parse document. Please check the image and try again.");
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}
