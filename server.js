import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { validateEnv } from './config/env.js';
import { omadaLogin, getOmadaSitesList, getOmadaDevicesList } from './controllers/omadaController.js';
import { ruijieLogin, getRuijieProjectsList, getRuijieDevicesList } from './controllers/ruijieController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Validate environment variables
validateEnv();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API routes
app.post('/api/omada/login', omadaLogin);
app.get('/api/omada/sites', getOmadaSitesList);
app.get('/api/omada/devices', getOmadaDevicesList);
app.post('/api/ruijie/login', ruijieLogin);
app.get('/api/ruijie/projects', getRuijieProjectsList);
app.get('/api/ruijie/devices', getRuijieDevicesList);
app.get('/api/combined/sites-projects', async (req, res) => {
  try {
    const { getOmadaSites } = await import('./services/omadaService.js');
    const { getRuijieProjects } = await import('./services/ruijieService.js');

    const [omadaSites, ruijieProjects] = await Promise.allSettled([
      getOmadaSites(),
      getRuijieProjects()
    ]);

    const response = {
      omada: {
        success: omadaSites.status === 'fulfilled',
        data: omadaSites.status === 'fulfilled' ? omadaSites.value : null,
        error: omadaSites.status === 'rejected' ? omadaSites.reason.message : null
      },
      ruijie: {
        success: ruijieProjects.status === 'fulfilled',
        data: ruijieProjects.status === 'fulfilled' ? ruijieProjects.value : null,
        error: ruijieProjects.status === 'rejected' ? ruijieProjects.reason.message : null
      }
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Failed to fetch combined data:', error.message);
    res.status(500).json({ error: 'Failed to fetch combined data' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard available at: http://localhost:${PORT}`);
});