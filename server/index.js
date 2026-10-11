require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const discoveryService = require('./services/discoveryService');
const filteringService = require('./services/filteringService');
const enrichmentService = require('./services/enrichmentService');
const aiService = require('./services/aiService');
const sendingService = require('./services/sendingService');
const storageService = require('./services/storageService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  if (req.path.startsWith('/api') && req.path !== '/api/logs' && req.path !== '/api/health') {
    storageService.logActivity(`${req.method} ${req.path}`);
  }
  next();
});

// 1. Health check & system overview
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      discovery: 'active',
      filtering: 'active',
      enrichment: 'active',
      aiPersonalization: 'active',
      sendingLayer: 'active',
      storage: 'active'
    }
  });
});

// 2. Complete End-to-End Pipeline Execution in one call
app.post('/api/pipeline/run', async (req, res) => {
  try {
    const {
      niche = 'Fashion & Beauty',
      source = 'all',
      minCount = 50,
      filterConfig = {},
      campaignConfig = {},
      sendOptions = { mode: 'simulation' }
    } = req.body;

    storageService.logActivity(`▶ TRIGGERED FULL AUTOMATION PIPELINE (Niche: "${niche}")`);

    // Step 1: Influencer Discovery (fetch at least 50)
    const discovered = await discoveryService.discoverInfluencers({
      niche,
      source,
      minCount
    });

    // Step 2: Filtering & Classification
    const filterResults = filteringService.filterInfluencers(discovered, {
      targetNiche: niche,
      ...filterConfig
    });

    // Step 3: Profile Enrichment
    const enrichmentResults = enrichmentService.enrichInfluencers(filterResults.influencers);

    // Step 4: AI Personalization (Generate Email 60-90 words & DM 15-30 words)
    const personalizedInfluencers = await aiService.generateOutreachBatch(
      enrichmentResults.influencers,
      campaignConfig
    );

    // Step 5: Sending Layer & Tracker
    const sendResults = await sendingService.sendEmailBatch(
      personalizedInfluencers,
      sendOptions
    );

    const tracker = storageService.getOutreachTracker();

    res.json({
      success: true,
      summary: {
        totalDiscovered: discovered.length,
        passedFilter: filterResults.passedCount,
        failedFilter: filterResults.failedCount,
        totalEnriched: enrichmentResults.enrichedCount,
        emailsFound: enrichmentResults.emailsFoundCount,
        messagesGenerated: personalizedInfluencers.filter((i) => i.messagesGenerated).length,
        emailsDispatched: sendResults.sentCount,
        duplicatesPrevented: sendResults.duplicateCount,
        trackerEntries: tracker.length
      },
      influencers: personalizedInfluencers,
      sendResults,
      tracker
    });
  } catch (error) {
    storageService.logActivity(`Pipeline Execution Error: ${error.message}`, 'error');
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Step 1: Discovery
app.post('/api/discover', async (req, res) => {
  try {
    const { niche = 'Fashion & Beauty', source = 'all', minCount = 50, apiKey } = req.body;
    const influencers = await discoveryService.discoverInfluencers({ niche, source, minCount, apiKey });
    res.json({
      success: true,
      count: influencers.length,
      influencers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. Retrieve Current Influencers (with optional filters)
app.get('/api/influencers', (req, res) => {
  try {
    let influencers = storageService.getInfluencers();
    const { filterStatus, niche, search, hasEmail } = req.query;

    if (filterStatus) {
      influencers = influencers.filter((i) => i.filterStatus === filterStatus);
    }
    if (niche && niche !== 'All') {
      influencers = influencers.filter((i) => (i.niche || '').toLowerCase().includes(niche.toLowerCase()));
    }
    if (hasEmail === 'true') {
      influencers = influencers.filter((i) => i.contactEmail && i.contactEmail !== 'Not Found');
    }
    if (search) {
      const q = search.toLowerCase();
      influencers = influencers.filter(
        (i) =>
          (i.name && i.name.toLowerCase().includes(q)) ||
          (i.handle && i.handle.toLowerCase().includes(q)) ||
          (i.niche && i.niche.toLowerCase().includes(q))
      );
    }

    res.json({
      success: true,
      count: influencers.length,
      influencers
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 5. Retrieve Single Influencer by ID
app.get('/api/influencers/:id', (req, res) => {
  const influencers = storageService.getInfluencers();
  const inf = influencers.find((i) => i.id === req.params.id);
  if (!inf) {
    return res.status(404).json({ success: false, error: 'Influencer not found' });
  }
  res.json({ success: true, influencer: inf });
});

// 6. Step 2: Filtering & Classification
app.post('/api/filter', (req, res) => {
  try {
    const influencers = storageService.getInfluencers();
    const result = filteringService.filterInfluencers(influencers, req.body);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 7. Step 3: Profile Enrichment
app.post('/api/enrich', (req, res) => {
  try {
    const { onlyPassed = false } = req.body;
    const influencers = storageService.getInfluencers();
    const result = enrichmentService.enrichInfluencers(influencers, onlyPassed);
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 8. Step 4: AI Personalization (Batch)
app.post('/api/personalize', async (req, res) => {
  try {
    const influencers = storageService.getInfluencers();
    const result = await aiService.generateOutreachBatch(influencers, req.body);
    res.json({
      success: true,
      count: result.length,
      influencers: result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 9. Step 4: AI Personalization (Single Creator)
app.post('/api/personalize/:id', async (req, res) => {
  try {
    const influencers = storageService.getInfluencers();
    const infIndex = influencers.findIndex((i) => i.id === req.params.id);
    if (infIndex === -1) {
      return res.status(404).json({ success: false, error: 'Influencer not found' });
    }

    const outreach = await aiService.generatePersonalizedMessages(influencers[infIndex], req.body);
    influencers[infIndex] = {
      ...influencers[infIndex],
      outreach,
      messagesGenerated: true,
      generatedAt: new Date().toISOString()
    };

    storageService.saveInfluencers(influencers);
    res.json({
      success: true,
      influencer: influencers[infIndex]
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 10. Step 5: Email Sending Batch
app.post('/api/send/email', async (req, res) => {
  try {
    const influencers = storageService.getInfluencers();
    const { mode = 'simulation', senderEmail } = req.body;
    const result = await sendingService.sendEmailBatch(influencers, { mode, senderEmail });
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 11. Step 5: Single Email Dispatch
app.post('/api/send/single-email/:id', async (req, res) => {
  try {
    const influencers = storageService.getInfluencers();
    const inf = influencers.find((i) => i.id === req.params.id);
    if (!inf) return res.status(404).json({ success: false, error: 'Influencer not found' });
    if (!inf.contactEmail || inf.contactEmail === 'Not Found') {
      return res.status(400).json({ success: false, error: 'Creator does not have a valid contact email' });
    }

    const { mode = 'simulation' } = req.body;
    const result = await sendingService.sendEmailBatch([inf], { mode });
    res.json({
      success: true,
      result: result.results[0] || null
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 12. Instagram DM Workflow / Dispatch Simulator
app.post('/api/send/instagram-dm', async (req, res) => {
  try {
    const { influencerId, action = 'MARK_SENT' } = req.body;
    const entry = await sendingService.processInstagramDmAction(influencerId, action);
    res.json({
      success: true,
      entry
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 13. Outreach Tracker
app.get('/api/tracker', (req, res) => {
  try {
    const tracker = storageService.getOutreachTracker();
    res.json({
      success: true,
      count: tracker.length,
      tracker
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 14. Activity Logs
app.get('/api/logs', (req, res) => {
  try {
    const logs = storageService.getActivityLogs();
    res.json({
      success: true,
      count: logs.length,
      logs
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 15. CSV Dataset Export Downloads
app.get('/api/export/csv/:type', (req, res) => {
  try {
    const type = req.params.type; // 'influencers' or 'tracker'
    const exportsDir = path.join(__dirname, 'data', 'exports');
    const filename = type === 'tracker' ? 'outreach_tracker.csv' : 'influencers_dataset.csv';
    const filePath = path.join(exportsDir, filename);

    if (!fs.existsSync(filePath)) {
      // Trigger generation if not present
      if (type === 'tracker') {
        storageService.exportTrackerToCsv(storageService.getOutreachTracker());
      } else {
        storageService.exportInfluencersToCsv(storageService.getInfluencers());
      }
    }

    res.download(filePath, filename);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 16. Pipeline Data Reset
app.post('/api/reset', async (req, res) => {
  try {
    const curated = storageService.getCuratedCreators();
    storageService.saveInfluencers(curated);
    storageService.saveOutreachTracker([]);
    storageService.logActivity('Pipeline state reset to initial curated creator state');
    res.json({
      success: true,
      message: 'System state reset successfully',
      influencersCount: curated.length
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend static build in production
const distPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Start Express server
app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(` MICRO-INFLUENCER OUTREACH SYSTEM BACKEND ONLINE   `);
  console.log(` Server URL: http://localhost:${PORT}             `);
  console.log(` API Health: http://localhost:${PORT}/api/health   `);
  console.log(`====================================================`);
});

