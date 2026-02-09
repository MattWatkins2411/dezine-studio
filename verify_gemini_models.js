
const apiKey = "AIzaSyBKoqCF-Ja6wmBdfRBBYlippvK_eJYvCjA";

async function listModels() {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    
    if (data.error) {
      console.error("Error listing models:", data.error);
    } else {
      console.log("Available Models:");
      data.models.forEach(model => {
        console.log(`- ${model.name}`);
        console.log(`  Supported methods: ${model.supportedGenerationMethods.join(', ')}`);
      });
    }
  } catch (error) {
    console.error("Network error:", error);
  }
}

listModels();
