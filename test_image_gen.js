const apiKey = "AIzaSyBKoqCF-Ja6wmBdfRBBYlippvK_eJYvCjA";

async function testImageGen() {
  const modelName = "gemini-2.5-flash-image";
  console.log(`Testing image generation with model: ${modelName}`);
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: "Draw a futuristic chair" }] }],
        generationConfig: {
          responseModalities: ["IMAGE"],
          temperature: 0.0
        }
      })
    });

    const data = await response.json();
    if (data.error) {
      console.error("API Error:", JSON.stringify(data.error, null, 2));
    } else {
      console.log("Success! Response keys:", Object.keys(data));
      if (data.candidates && data.candidates[0].content) {
        console.log("Candidate content parts:", data.candidates[0].content.parts.length);
        console.log("First part type:", Object.keys(data.candidates[0].content.parts[0]));
      }
    }
  } catch (error) {
    console.error("Network Error:", error);
  }
}

testImageGen();
