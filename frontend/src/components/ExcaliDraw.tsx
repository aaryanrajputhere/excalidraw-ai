import { useState } from "react";
import {
  Excalidraw,
  convertToExcalidrawElements,
  type ExcalidrawAPI,
} from "@excalidraw/excalidraw";
import { parseMermaidToExcalidraw } from "@excalidraw/mermaid-to-excalidraw";
import "@excalidraw/excalidraw/index.css";

export default function ExcaliDraw() {
  const [excalidrawAPI, setExcalidrawAPI] = useState<ExcalidrawAPI | null>(null);
  const [mermaidInput, setMermaidInput] = useState("");
  const [textInput, setTextInput] = useState("");

  const renderMermaid = async () => {
    if (!excalidrawAPI) return;

    try {
      const { elements, files } = await parseMermaidToExcalidraw(mermaidInput, {
        fontSize: 16,
      });

      excalidrawAPI.updateScene({
        elements: convertToExcalidrawElements(elements),
        files,
        appState: { viewBackgroundColor: "#ffffff" },
      });
    } catch (e) {
      console.error("Failed to parse Mermaid syntax:", mermaidInput);
      console.error("Parse error details:", e);

      excalidrawAPI?.setToast?.({
        message: "Failed to render Mermaid diagram. Attempting auto-fix...",
        closable: true,
        duration: 4000,
      });

      try {
        const res = await fetch("http://localhost:3000/fix-mermaid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mermaidSyntax: mermaidInput,
            errorMessage: (() => {
              if (e instanceof Error) {
                return JSON.stringify({
                  name: e.name,
                  message: e.message,
                  stack: e.stack,
                }, null, 2);
              } else {
                return JSON.stringify(e, null, 2);
              }
            })(),
          }),
        });

        const data = await res.json();
        if (data.fixedMermaidSyntax) {
          setMermaidInput(data.fixedMermaidSyntax);
          console.log("Updated Mermaid syntax from fix-mermaid:", data.fixedMermaidSyntax);
        } else {
          console.warn("No fixedMermaidSyntax returned from /fix-mermaid.");
        }
      } catch (sendErr) {
        console.error("Failed to send error report to /fix-mermaid:", sendErr);
      }
    }
  };

  const generateMermaidFromText = async () => {
    try {
      const res = await fetch("http://localhost:3000/convert-to-mermaid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textInput }),
      });

      const data = await res.json();
      if (data.mermaidSyntax) {
        setMermaidInput(data.mermaidSyntax);
      } else {
        throw new Error("No mermaid returned");
      }
    } catch (e) {
      console.error(e);
      excalidrawAPI?.setToast?.({
        message: "Error generating Mermaid syntax from text input.",
        closable: true,
        duration: 4000,
      });
    }
  };

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "row" }}>
      <div style={{ flex: 1 }}>
        <Excalidraw excalidrawAPI={setExcalidrawAPI} />
      </div>
      <div
        style={{
          width: "300px",
          padding: "16px",
          borderLeft: "1px solid #ccc",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          backgroundColor: "#f9f9f9",
        }}
      >
        <textarea
          placeholder="Enter natural language description..."
          rows={4}
          style={{ fontSize: "14px", padding: "8px" }}
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
        />
        <button onClick={generateMermaidFromText}>Generate Mermaid</button>

        <textarea
          placeholder="Generated Mermaid code will appear here..."
          rows={6}
          style={{ fontSize: "14px", padding: "8px" }}
          value={mermaidInput}
          onChange={(e) => setMermaidInput(e.target.value)}
        />
        <button onClick={renderMermaid}>Render Mermaid</button>
      </div>
    </div>
  );
}
