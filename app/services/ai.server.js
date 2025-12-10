import crypto from "crypto";

// Apni API Key yahan dalo
const ZHIPU_API_KEY = "4779755b08864c34afcf7a26a5c50521.NoEwls1GA3uzsLCk";

// 1. JWT Token Generator (Zhipu ke liye Zaroori hai)
function generateToken(apiKey, expireMillis = 3600000) {
    const parts = apiKey.split(".");
    if (parts.length !== 2) {
        throw new Error("Invalid API Key format. It should be 'id.secret'");
    }

    const [id, secret] = parts;
    const now = Date.now();

    const header = {
        alg: "HS256",
        sign_type: "SIGN",
    };

    const payload = {
        api_key: id,
        exp: now + expireMillis,
        timestamp: now,
    };

    const base64UrlEncode = (obj) =>
        Buffer.from(JSON.stringify(obj)).toString("base64url");

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);

    const signature = crypto
        .createHmac("sha256", Buffer.from(secret, "utf8"))
        .update(`${encodedHeader}.${encodedPayload}`)
        .digest("base64url");

    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// 2. Product Data Generator
export async function generateProductData(productTitle) {
    console.log("🚀 Starting AI Generation for:", productTitle);

    try {
        const token = generateToken(ZHIPU_API_KEY);
        const url = "https://open.bigmodel.cn/api/paas/v4/chat/completions";

        const prompt = `
      You are a Shopify Product Expert.
      Create a product based on this title: "${productTitle}".
      
      Return ONLY a raw JSON object. Do not include markdown formatting like \`\`\`json.
      Structure:
      {
        "title": "Optimized SEO Title",
        "descriptionHtml": "<h3>Features</h3><ul><li>Feature 1</li></ul><p>Description...</p>",
        "tags": ["tag1", "tag2"],
        "price": "19.99",
        "variants": [
          {"name": "Option 1", "price": "19.99"},
          {"name": "Option 2", "price": "22.99"}
        ],
        "imagePrompt": "Detailed image description for ${productTitle}"
      }
    `;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`, // Token bhejna zaroori hai
            },
            body: JSON.stringify({
                model: "glm-4-flash",
                messages: [
                    { role: "user", content: prompt }
                ],
                temperature: 0.7,
                stream: false
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Zhipu AI API Error:", errorText); // Terminal me error dekho
            throw new Error(`AI API Error: ${response.status} ${errorText}`);
        }

        const data = await response.json();
        console.log("✅ AI Data Received");

        let content = data.choices[0].message.content;

        // Cleanup JSON string
        content = content.replace(/```json/g, "").replace(/```/g, "").trim();

        return JSON.parse(content);

    } catch (error) {
        console.error("❌ generateProductData Logic Error:", error);
        throw error;
    }
}

// 3. Image Generator
export async function generateProductImage(imagePrompt) {
    console.log("🎨 Generating Image for prompt:", imagePrompt.substring(0, 50) + "...");

    try {
        const token = generateToken(ZHIPU_API_KEY);
        const url = "https://open.bigmodel.cn/api/paas/v4/images/generations";

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({
                model: "cogView-4-250304",
                prompt: imagePrompt,
                size: "1024x1024"
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Image API Error:", errorText);
            throw new Error("Image generation failed");
        }

        const data = await response.json();
        return data.data[0].url;

    } catch (error) {
        console.error("❌ Image Gen Failed:", error);
        return "https://placehold.co/1024x1024?text=Image+Generation+Failed";
    }
}