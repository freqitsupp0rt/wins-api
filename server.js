import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();  // Load .env variables

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

// Route to call Omada API login
app.post('/omada/login', async (req, res) => {
  const loginUrl = `https://aps1-api-omada-controller.tplinkcloud.com/${process.env.OMADACID}/api/v2/login`;

  const loginBody = {
    username: process.env.USER,
    password: process.env.PASSWORD
  };

  try {
    const response = await axios.post(loginUrl, loginBody, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.data.errorCode === 0) {
      // Return only the token in the response
      res.status(200).json({
        token: response.data.result.token  // Extract token from response and return it
      });
    } else {
      res.status(400).json({
        message: 'Login failed',
        error: response.data.msg || 'Unknown error'
      });
    }
  } catch (error) {
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
