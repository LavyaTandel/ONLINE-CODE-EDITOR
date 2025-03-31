const express = require('express');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Create temporary directory for code files
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir);
}

// Route to execute code
app.post('/api/execute', (req, res) => {
  const { code, language } = req.body;
  
  if (!code || !language) {
    return res.status(400).json({ error: 'Code and language are required' });
  }

  const fileId = uuidv4();
  let fileExtension, command;

  // Configure based on language
  switch (language.toLowerCase()) {
    case 'javascript':
      fileExtension = 'js';
      command = 'node';
      break;
    case 'python':
      fileExtension = 'py';
      command = 'python';
      break;
    case 'java':
      fileExtension = 'java';
      // For Java, we would need additional handling for class names
      command = 'javac';
      return res.status(400).json({ error: 'Java is not supported yet' });
    case 'c++':
      fileExtension = 'cpp';
      command = 'g++';
      return res.status(400).json({ error: 'C++ is not supported yet' });
    default:
      return res.status(400).json({ error: 'Unsupported language' });
  }

  const filePath = path.join(tempDir, `${fileId}.${fileExtension}`);
  
  // Write code to temporary file
  fs.writeFileSync(filePath, code);

  // Execute code
  exec(`${command} ${filePath}`, { timeout: 5000 }, (error, stdout, stderr) => {
    // Clean up - delete temporary file
    fs.unlinkSync(filePath);

    if (error) {
      return res.json({
        status: 'error',
        output: stderr || error.message
      });
    }

    res.json({
      status: 'success',
      output: stdout
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});