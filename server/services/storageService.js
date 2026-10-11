const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const EXPORTS_DIR = path.join(DATA_DIR, 'exports');

// Ensure directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(EXPORTS_DIR)) {
  fs.mkdirSync(EXPORTS_DIR, { recursive: true });
}

const INFLUENCERS_FILE = path.join(DATA_DIR, 'influencers.json');
const TRACKER_FILE = path.join(DATA_DIR, 'outreach_tracker.json');
const LOGS_FILE = path.join(DATA_DIR, 'activity_logs.json');

class StorageService {
  constructor() {
    this.initFiles();
  }

  initFiles() {
    if (!fs.existsSync(INFLUENCERS_FILE)) {
      fs.writeFileSync(INFLUENCERS_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(TRACKER_FILE)) {
      fs.writeFileSync(TRACKER_FILE, JSON.stringify([], null, 2));
    }
    if (!fs.existsSync(LOGS_FILE)) {
      fs.writeFileSync(LOGS_FILE, JSON.stringify([], null, 2));
    }
  }

  getCuratedCreators() {
    const curatedPath = path.join(DATA_DIR, 'curated_creators.json');
    if (fs.existsSync(curatedPath)) {
      const data = fs.readFileSync(curatedPath, 'utf8');
      return JSON.parse(data);
    }
    return [];
  }

  getInfluencers() {
    try {
      const data = fs.readFileSync(INFLUENCERS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  saveInfluencers(influencers) {
    fs.writeFileSync(INFLUENCERS_FILE, JSON.stringify(influencers, null, 2));
    this.exportInfluencersToCsv(influencers);
    return influencers;
  }

  getOutreachTracker() {
    try {
      const data = fs.readFileSync(TRACKER_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  saveOutreachTracker(tracker) {
    fs.writeFileSync(TRACKER_FILE, JSON.stringify(tracker, null, 2));
    this.exportTrackerToCsv(tracker);
    return tracker;
  }

  recordOutreachEntry(entry) {
    const tracker = this.getOutreachTracker();
    const existingIndex = tracker.findIndex(
      (item) => item.influencerId === entry.influencerId || (item.email && item.email === entry.email && item.email !== 'Not Found')
    );

    if (existingIndex >= 0) {
      tracker[existingIndex] = { ...tracker[existingIndex], ...entry, updatedAt: new Date().toISOString() };
    } else {
      tracker.unshift({
        id: `outreach-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...entry,
        createdAt: new Date().toISOString()
      });
    }

    this.saveOutreachTracker(tracker);
    this.logActivity(`Outreach recorded for ${entry.influencerName} (${entry.status})`);
    return tracker;
  }

  getActivityLogs() {
    try {
      const data = fs.readFileSync(LOGS_FILE, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return [];
    }
  }

  logActivity(message, level = 'info') {
    const logs = this.getActivityLogs();
    logs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      level,
      message
    });
    // keep latest 200 logs
    if (logs.length > 200) logs.pop();
    fs.writeFileSync(LOGS_FILE, JSON.stringify(logs, null, 2));
  }

  exportInfluencersToCsv(influencers) {
    const headers = [
      'Name',
      'Platform',
      'Followers',
      'Engagement',
      'Niche',
      'Email',
      'Profile URL',
      'Content Theme',
      'Filter Status',
      'Filter Reasons',
      'Brand Fit Score',
      'Recent Content'
    ];

    const rows = influencers.map((inf) => {
      const themes = Array.isArray(inf.contentThemes) ? inf.contentThemes.join('; ') : inf.contentThemes || '';
      const reasons = Array.isArray(inf.filterReasons) ? inf.filterReasons.join(' | ') : inf.filterReasons || '';
      return [
        `"${(inf.name || '').replace(/"/g, '""')}"`,
        `"${inf.platform || ''}"`,
        inf.followers || 0,
        `"${inf.engagementRate || 0}%"`,
        `"${(inf.niche || '').replace(/"/g, '""')}"`,
        `"${inf.contactEmail || 'Not Found'}"`,
        `"${inf.profileUrl || ''}"`,
        `"${themes.replace(/"/g, '""')}"`,
        `"${inf.filterStatus || 'DISCOVERED'}"`,
        `"${reasons.replace(/"/g, '""')}"`,
        inf.brandFitScore || 0,
        `"${(inf.recentContent || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const targetPath = path.join(EXPORTS_DIR, 'influencers_dataset.csv');
    fs.writeFileSync(targetPath, csvContent, 'utf8');
    return targetPath;
  }

  exportTrackerToCsv(tracker) {
    const headers = [
      'Influencer',
      'Platform',
      'Email',
      'Message Generated',
      'Sent',
      'Date',
      'Status',
      'Collaboration Angle',
      'Preview URL / Notes'
    ];

    const rows = tracker.map((item) => {
      const dateStr = item.sentDate || item.createdAt || new Date().toISOString();
      const messageGen = item.emailSubject ? `Subject: ${item.emailSubject} | Words: ${item.emailWordCount || 0}` : 'Yes';
      return [
        `"${(item.influencerName || '').replace(/"/g, '""')}"`,
        `"${item.platform || ''}"`,
        `"${item.email || 'Not Found'}"`,
        `"${messageGen.replace(/"/g, '""')}"`,
        item.sent ? 'YES' : 'NO',
        `"${dateStr}"`,
        `"${item.status || 'PENDING'}"`,
        `"${item.collaborationType || 'Sponsorship'}"`,
        `"${(item.previewUrl || item.notes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const targetPath = path.join(EXPORTS_DIR, 'outreach_tracker.csv');
    fs.writeFileSync(targetPath, csvContent, 'utf8');
    return targetPath;
  }
}

module.exports = new StorageService();
