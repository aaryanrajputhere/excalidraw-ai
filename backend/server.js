const express = require("express");
const axios = require("axios");
const cors = require("cors");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const GEMINI_API_KEY =
  process.env.GEMINI_API_KEY || "";
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

app.post("/convert-to-mermaid", async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Missing "text" in request body.' });
  }

  const prompt = `
Create Mermaid Syntax for Excalidraw of the following text:
Input: A simple login process for a website.

Output:

graph TD
    A[Start] --> B{Enter Credentials?};
    B -- Yes --> C[Verify Credentials];
    B -- No --> D[Register New Account];
    C -- Valid --> E[Access Dashboard];
    C -- Invalid --> B;
    D --> E;

Input: ${text}

Output:
`;

  // Log prompt only
  console.log("======== PROMPT: convert-to-mermaid ========");
  console.log(prompt.trim());
  console.log("============================================");

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    const result = response.data;
    const rawOutput =
      result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const mermaidMatch = rawOutput?.match(/```mermaid\s*([\s\S]*?)```/i);
    const mermaidSyntax = mermaidMatch ? mermaidMatch[1].trim() : rawOutput;

    if (mermaidSyntax) {
      res.json({ mermaidSyntax });
    } else {
      res.status(500).json({
        error: "Gemini response didn't contain valid Mermaid syntax.",
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to convert text to Mermaid syntax.",
      details: error.response ? error.response.data : error.message,
    });
  }
});

app.post("/fix-mermaid", async (req, res) => {
  const { mermaidSyntax, errorMessage } = req.body;

  if (!mermaidSyntax || !errorMessage) {
    return res.status(400).json({
      error: 'Missing "mermaidSyntax" or "errorMessage" in request body.',
    });
  }

  const prompt = `
Based on the error repair the mermaidSyntax.
Broken Mermaid Code:
${mermaidSyntax}

Error Message:
${errorMessage}

Fixed Mermaid Code:
`;

  // Log prompt only
  console.log("======== PROMPT: fix-mermaid ========");
  console.log(prompt.trim());
  console.log("=====================================");

  const payload = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };

  try {
    const response = await axios.post(
      `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
      payload,
      { headers: { "Content-Type": "application/json" } }
    );

    const result = response.data;
    const rawOutput =
      result?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    const mermaidMatch = rawOutput?.match(/```mermaid\s*([\s\S]*?)```/i);
    const fixedMermaidSyntax = mermaidMatch
      ? mermaidMatch[1].trim()
      : rawOutput;

    if (fixedMermaidSyntax) {
      res.json({ fixedMermaidSyntax });
    } else {
      res.status(500).json({
        error: "Gemini response didn't contain valid fixed Mermaid syntax.",
      });
    }
  } catch (error) {
    res.status(500).json({
      error: "Failed to fix Mermaid syntax.",
      details: error.response ? error.response.data : error.message,
    });
  }
});

app.listen(port, () => {
  console.log(
    `Mermaid Converter Backend listening at http://localhost:${port}`
  );
});
