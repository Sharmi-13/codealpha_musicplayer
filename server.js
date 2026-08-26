const express = require('express');
const path = require('path');
const app = express();

const PORT = process.env.PORT || 3000;

// Serve static assets from the musiclub directory
app.use(express.static(path.join(__dirname, 'musiclub')));

// Fallback route to serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'musiclub', 'index.html'));
});

app.listen(PORT, () => {
  console.log('==================================================');
  console.log(`🎵 MUSICLUB is running at: http://localhost:${PORT}`);
  console.log('==================================================');
  console.log('Press Ctrl+C to stop the server.');
});
