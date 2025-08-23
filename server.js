import express from 'express';
import axios from 'axios';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();  // Load .env variables

const app = express();
const PORT = 3000;

// Middleware
app.use(bodyParser.json());

/**
 * ========= OMADA TOKEN LOGIC =========
 */
let omadaToken = null;
let omadaTokenExpiresAt = null;

async function getOmadaToken() {
  const now = Date.now();

  if (omadaToken && omadaTokenExpiresAt && now < omadaTokenExpiresAt) {
    return omadaToken;
  }

  const loginUrl = `https://aps1-api-omada-controller.tplinkcloud.com/${process.env.OMADACID}/api/v2/login`;
  const loginBody = {
    username: process.env.USER,
    password: process.env.PASSWORD
  };

  const response = await axios.post(loginUrl, loginBody, {
    headers: { 'Content-Type': 'application/json' }
  });

  if (response.data.errorCode === 0) {
    omadaToken = response.data.result.token;
    omadaTokenExpiresAt = Date.now() + 60 * 60 * 1000; // assume 1 hour
    return omadaToken;
  }

  throw new Error('Failed to get Omada token');
}

/**
 * ========= RUIJIE TOKEN LOGIC =========
 */
let ruijieAccessToken = null;
let ruijieTokenExpiresAt = null;

async function getRuijieAccessToken() {
  const now = Date.now();

  if (ruijieAccessToken && ruijieTokenExpiresAt && now < ruijieTokenExpiresAt) {
    return ruijieAccessToken;
  }

  const ruijieUrl = `https://cloud-as.ruijienetworks.com/service/api/oauth20/client/access_token?token=${process.env.TOKEN}`;
  const ruijieBody = {
    appid: process.env.APPID,
    secret: process.env.SECRET
  };

  const response = await axios.post(ruijieUrl, ruijieBody, {
    headers: { 'Content-Type': 'application/json' }
  });

  if (response.data.code === 0) {
    ruijieAccessToken = response.data.accessToken;
    ruijieTokenExpiresAt = Date.now() + 60 * 60 * 1000; // assume 1 hour
    return ruijieAccessToken;
  }

  throw new Error('Failed to get Ruijie token');
}

/**
 * ========= ROUTES =========
 */

// Omada Login
app.post('/omada/login', async (req, res) => {
  try {
    const token = await getOmadaToken();
    res.status(200).json({ token });
  } catch (error) {
    console.error('Omada login failed:', error.message);
    res.status(500).json({
      message: 'Omada login failed',
      error: error.message
    });
  }
});

// Ruijie Login
app.post('/ruijie/login', async (req, res) => {
  try {
    const token = await getRuijieAccessToken();
    res.status(200).json({ accessToken: token });
  } catch (error) {
    console.error('Ruijie login failed:', error.message);
    res.status(500).json({
      message: 'Ruijie login failed',
      error: error.message
    });
  }
});

// Ruijie Projects List
app.get('/ruijie/projects', async (req, res) => {
  try {
    const token = await getRuijieAccessToken();
    const apiUrl = `https://cloud-as.ruijienetworks.com/service/api/group/single/tree?access_token=${token}`;
    const response = await axios.get(apiUrl);

    const data = response.data;

    if (data.code !== 0 || !data.groups) {
      return res.status(500).json({ error: data.msg || 'Invalid group data' });
    }

    const rootSubGroups = data.groups.subGroups || [];
    const projectList = [];

    for (const group of rootSubGroups) {
      const innerGroups = group.subGroups || [];
      for (const project of innerGroups) {
        projectList.push({
          groupId: project.groupId,
          name: project.name,
        });
      }
    }

    res.status(200).json(projectList);

  } catch (error) {
    console.error('❌ Failed to fetch project list:', error.message);
    res.status(500).json({ error: 'Failed to fetch project list' });
  }
});

// Root route
app.get('/', (req, res) => {
  res.send('API Server Running');
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
