
const apiKey = "AIzaSyBKoqCF-Ja6wmBdfRBBYlippvK_eJYvCjA";

async function findWorkingImageModel() {
  console.log("Fetching list of models...");
  try {
    const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const listData = await listResp.json();
    
    if (!listData.models) {
      console.error("Could not list models:", listData);
      return;
    }

    console.log(`Found ${listData.models.length} models. Testing for image generation...`);

    for (const model of listData.models) {
      const name = model.name.replace('models/', '');
      process.stdout.write(`Testing ${name}... `);

      try {
        // Try generateContent with IMAGE modality
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent?key=${apiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Draw a simple circle" }] }],
            generationConfig: {
              responseModalities: ["IMAGE"],
              temperature: 0.0
            }
          })
        });

        const data = await response.json();
        
        if (data.error) {
           // Shorten error message for clean log
           const msg = data.error.message.split('.')[0];
           console.log(`FAIL: ${msg}`);
           if (data.error.code === 429) console.log("   (Rate limited - might be the right model but valid quota needed)");
        } else if (data.candidates && data.candidates[0].content) {
           console.log("SUCCESS! >>> FOUND WORKING MODEL <<<");
           console.log(JSON.stringify(data.candidates[0].content.parts[0]).substring(0, 100));
        } else {
           console.log("FAIL: No candidates returned");
        }

      } catch (err) {
        console.log(`Error: ${err.message}`);
      }
    }

  } catch (error) {
    console.error("Fatal Error:", error);
  }
}

findWorkingImageModel();
