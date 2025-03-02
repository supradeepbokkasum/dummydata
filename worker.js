export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (url.pathname === "/generate") {
      return await handleDataGeneration(request);
    }

    return new Response(renderHTML(), {
      headers: { "Content-Type": "text/html" }
    });
  }
};

// Handle dummy data generation
async function handleDataGeneration(request) {
  const formData = await request.formData();
  const format = formData.get("format");
  const fields = formData.get("fields") || 5;
  const subModules = formData.get("subModules") || 0;
  const arraySize = formData.get("arraySize") || 1;
  const fieldType = formData.get("fieldType") || "string";

  let data = generateDummyData(fields, subModules, arraySize, fieldType);

  if (format === "xml") {
    data = jsonToXml(data);
  } else {
    data = JSON.stringify(data, null, 2);
  }

  return new Response(data, {
    headers: { "Content-Type": format === "xml" ? "application/xml" : "application/json" }
  });
}

// Generate dummy JSON
function generateDummyData(fields, subModules, arraySize, fieldType) {
  const randomString = () => Math.random().toString(36).substring(7);
  const randomNumber = () => Math.floor(Math.random() * 1000);
  const randomBoolean = () => Math.random() > 0.5;
  const randomUUID = () => crypto.randomUUID();
  const randomEmail = () => `user${randomNumber()}@example.com`;

  const generateFieldValue = (type) => {
    switch (type) {
      case "number": return randomNumber();
      case "boolean": return randomBoolean();
      case "uuid": return randomUUID();
      case "email": return randomEmail();
      default: return randomString();
    }
  };

  const data = {};
  for (let i = 0; i < fields; i++) {
    data[`field${i + 1}`] = generateFieldValue(fieldType);
  }

  if (subModules > 0) {
    data.subModules = [];
    for (let i = 0; i < subModules; i++) {
      data.subModules.push(generateDummyData(fields, subModules - 1, arraySize, fieldType));
    }
  }

  if (arraySize > 1) {
    return Array.from({ length: arraySize }, () => data);
  }

  return data;
}

// Convert JSON to XML
function jsonToXml(jsonObj, root = "data") {
  let xml = `<${root}>`;
  for (const key in jsonObj) {
    if (Array.isArray(jsonObj[key])) {
      jsonObj[key].forEach(item => {
        xml += jsonToXml(item, key);
      });
    } else if (typeof jsonObj[key] === "object") {
      xml += jsonToXml(jsonObj[key], key);
    } else {
      xml += `<${key}>${jsonObj[key]}</${key}>`;
    }
  }
  xml += `</${root}>`;
  return xml;
}

// Render HTML UI
function renderHTML() {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Dummy Data Generator</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 20px; }
        h1 { color: #007BFF; }
        form { max-width: 500px; margin: auto; display: flex; flex-direction: column; gap: 10px; }
        input, select, button { width: 100%; padding: 10px; margin: 5px 0; font-size: 16px; }
        .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
        pre { text-align: left; background: #f4f4f4; padding: 10px; overflow: auto; max-width: 600px; margin: auto; }
        button { background-color: #007BFF; color: white; border: none; cursor: pointer; }
        button:hover { background-color: #0056b3; }
        .help-section { background: #eef6ff; padding: 15px; border-radius: 5px; text-align: left; margin: 20px auto; max-width: 600px; }
        .help-section h2 { color: #007BFF; font-size: 18px; }
        .help-section ul { padding-left: 20px; }
      </style>
      <script>
        function previewResult(event) {
          event.preventDefault();
          const form = document.querySelector("form");
          fetch("/generate", { method: "POST", body: new FormData(form) })
            .then(response => response.text())
            .then(data => document.getElementById("result").textContent = data);
        }
      </script>
    </head>
    <body>
      <h1>Dummy Data Generator</h1>
      <form onsubmit="previewResult(event)">
        <label>Format:</label>
        <select name="format">
          <option value="json">JSON</option>
          <option value="xml">XML</option>
        </select>

        <div class="grid">
          <div>
            <label>Number of Fields:</label>
            <input type="number" name="fields" value="5" min="1">
          </div>
          <div>
            <label>Field Type:</label>
            <select name="fieldType">
              <option value="string">String</option>
              <option value="number">Number</option>
              <option value="boolean">Boolean</option>
              <option value="uuid">UUID</option>
              <option value="email">Email</option>
            </select>
          </div>
        </div>

        <div class="grid">
          <div>
            <label>Sub Modules:</label>
            <input type="number" name="subModules" value="0" min="0">
          </div>
          <div>
            <label>Array Size:</label>
            <input type="number" name="arraySize" value="1" min="1">
          </div>
        </div>

        <button type="submit">Generate Data</button>
      </form>

      <h2>Preview:</h2>
      <pre id="result">Click "Generate Data" to preview...</pre>

      <div class="help-section">
        <h2>🔹 How to Customize Your Dummy Data</h2>
        <ul>
          <li>**Format** → Choose JSON or XML output.</li>
          <li>**Number of Fields** → How many key-value pairs per object.</li>
          <li>**Field Type** → Select the type of data (String, Number, Boolean, UUID, Email).</li>
          <li>**Sub Modules** → Add nested objects for complex structures.</li>
          <li>**Array Size** → Create multiple objects inside an array.</li>
        </ul>
        <p><strong>💡 Setting "0" values:</strong></p>
        <ul>
          <li>**Sub Modules = 0** → No nested objects.</li>
          <li>**Array Size = 0** → Returns an empty array <code>[]</code>.</li>
        </ul>
      </div>
    </body>
    </html>
  `;
}

