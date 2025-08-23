const express = require('express');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Route to call Omada API login
app.post('/omada/login', async (req, res) => {
  const loginUrl = 'https://aps1-api-omada-controller.tplinkcloud.com/a34134a3734d728c719318f3c6db575e/api/v2/login';

  const loginBody = {
    username: 'freqitsupp0rt@gmail.com',
    password: 'Freqit@098765'
  };

  try {
    const response = await axios.post(loginUrl, loginBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    res.status(200).json({
      message: 'Login successful',
      data: response.data
    });
  } catch (error) {
    console.error('Login failed:', error?.response?.data || error.message);
    res.status(500).json({
      message: 'Login failed',
      error: error?.response?.data || error.message
    });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('Omada API Server Running');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
