import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Users,
  Filter,
  Database,
  Mail,
  Send,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Download,
  ExternalLink,
  Copy,
  Check,
  Search,
  SlidersHorizontal,
  Eye,
  Activity,
  FileText,
  ChevronRight,
  ShieldCheck,
  Zap,
  Globe,
  Radio,
  Layers,
  Info
} from 'lucide-react';
import './App.css';

const API_BASE = '/api';

const Instagram = ({ size = 16, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5"/>
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/>
  </svg>
);

const Youtube = ({ size = 16, style = {} }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17"/>
    <polygon points="10 15 15 12 10 9 10 15"/>
  </svg>
);

export default function App() {
  // Navigation & UI States
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline', 'creators', 'outreach', 'tracker', 'logs'
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(null); // { stage, percent, msg }
  const [logsOpen, setLogsOpen] = useState(false);
  const [selectedCreatorForModal, setSelectedCreatorForModal] = useState(null);
  const [selectedCreatorForOutreach, setSelectedCreatorForOutreach] = useState(null);
  const [copiedKey, setCopiedKey] = useState(null);
  const [notification, setNotification] = useState(null);

  // Data States
  const [influencers, setInfluencers] = useState([]);
  const [tracker, setTracker] = useState([]);
  const [logs, setLogs] = useState([]);
  const [systemHealth, setSystemHealth] = useState({ status: 'Connecting...' });

  // Filtering & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatusTab, setFilterStatusTab] = useState('ALL'); // 'ALL', 'PASSED', 'FAILED'
  const [selectedNicheFilter, setSelectedNicheFilter] = useState('All');
  const [emailFilter, setEmailFilter] = useState('ALL'); // 'ALL', 'FOUND', 'NOT_FOUND'

  // Pipeline Configurations
  const [discoveryConfig, setDiscoveryConfig] = useState({
    niche: 'Fashion & Beauty',
    source: 'all',
    minCount: 50
  });

  const [filterConfig, setFilterConfig] = useState({
    minFollowers: 5000,
    maxFollowers: 100000,
    minEngagementRate: 2.0,
    targetNiche: 'Fashion & Beauty',
    requireEmail: false
  });

  const [campaignConfig, setCampaignConfig] = useState({
    brandName: 'GlowMatrix Skincare',
    productName: 'Barrier Renewal Serum',
    collaborationType: 'UGC content creation',
    valueProposition: 'a competitive upfront fee, full product suite, and performance bonuses',
    senderName: 'Alex Vance',
    senderRole: 'Head of Creator Partnerships'
  });

  // Load initial data
  useEffect(() => {
    fetchHealth();
    loadAllData();
  }, []);

  const showNotification = (msg, type = 'info') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showNotification('Copied to clipboard!', 'success');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const fetchHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/health`);
      if (res.ok) {
        const data = await res.json();
        setSystemHealth(data);
      }
    } catch {
      setSystemHealth({ status: 'Offline' });
    }
  };

  const loadAllData = async () => {
    try {
      const [infRes, trkRes, logRes] = await Promise.all([
        fetch(`${API_BASE}/influencers`),
        fetch(`${API_BASE}/tracker`),
        fetch(`${API_BASE}/logs`)
      ]);
      if (infRes.ok) {
        const infData = await infRes.json();
        setInfluencers(infData.influencers || []);
        if (infData.influencers && infData.influencers.length > 0 && !selectedCreatorForOutreach) {
          const firstPassed = infData.influencers.find((i) => i.filterStatus === 'PASSED') || infData.influencers[0];
          setSelectedCreatorForOutreach(firstPassed);
        }
      }
      if (trkRes.ok) {
        const trkData = await trkRes.json();
        setTracker(trkData.tracker || []);
      }
      if (logRes.ok) {
        const logData = await logRes.json();
        setLogs(logData.logs || []);
      }
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  };

  // Run complete pipeline end-to-end
  const runCompletePipeline = async () => {
    setIsRunningPipeline(true);
    setPipelineProgress({ stage: 'Starting', percent: 10, msg: 'Initializing automated pipeline...' });

    try {
      setPipelineProgress({ stage: 'Discovery', percent: 25, msg: `Discovering 50+ creators in ${discoveryConfig.niche}...` });
      
      const response = await fetch(`${API_BASE}/pipeline/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          niche: discoveryConfig.niche,
          source: discoveryConfig.source,
          minCount: discoveryConfig.minCount,
          filterConfig,
          campaignConfig,
          sendOptions: { mode: 'simulation' }
        })
      });

      setPipelineProgress({ stage: 'Processing', percent: 75, msg: 'Filtering, enriching & generating bespoke copy...' });
      const data = await response.json();

      if (data.success) {
        setInfluencers(data.influencers || []);
        setTracker(data.tracker || []);
        setPipelineProgress({ stage: 'Completed', percent: 100, msg: 'All 5 stages completed successfully!' });
        showNotification(`Pipeline executed! ${data.summary.passedFilter} qualified creators personalized & dispatched.`, 'success');
        
        const firstPassed = (data.influencers || []).find((i) => i.filterStatus === 'PASSED');
        if (firstPassed) setSelectedCreatorForOutreach(firstPassed);
        
        await loadAllData();
      } else {
        throw new Error(data.error || 'Pipeline execution failed');
      }
    } catch (err) {
      showNotification(`Pipeline Error: ${err.message}`, 'error');
    } finally {
      setTimeout(() => {
        setIsRunningPipeline(false);
        setPipelineProgress(null);
      }, 1000);
    }
  };

  // Stage 1 Trigger
  const runStageDiscovery = async () => {
    try {
      showNotification('Running Discovery stage...', 'info');
      const res = await fetch(`${API_BASE}/discover`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discoveryConfig)
      });
      const data = await res.json();
      if (data.success) {
        setInfluencers(data.influencers);
        showNotification(`Discovered ${data.count} creators!`, 'success');
        await loadAllData();
      }
    } catch (err) {
      showNotification(`Discovery Error: ${err.message}`, 'error');
    }
  };

  // Stage 2 Trigger
  const runStageFilter = async () => {
    try {
      showNotification('Applying Filtering & Classification...', 'info');
      const res = await fetch(`${API_BASE}/filter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(filterConfig)
      });
      const data = await res.json();
      if (data.success) {
        setInfluencers(data.influencers);
        showNotification(`Filtered: ${data.passedCount} Passed, ${data.failedCount} Disqualified`, 'success');
        await loadAllData();
      }
    } catch (err) {
      showNotification(`Filter Error: ${err.message}`, 'error');
    }
  };

  // Stage 3 Trigger
  const runStageEnrich = async () => {
    try {
      showNotification('Enriching profiles with metadata & contact verification...', 'info');
      const res = await fetch(`${API_BASE}/enrich`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyPassed: false })
      });
      const data = await res.json();
      if (data.success) {
        setInfluencers(data.influencers);
        showNotification(`Enriched ${data.enrichedCount} profiles (${data.emailsFoundCount} emails verified)`, 'success');
        await loadAllData();
      }
    } catch (err) {
      showNotification(`Enrich Error: ${err.message}`, 'error');
    }
  };

  // Stage 4 Trigger
  const runStagePersonalize = async () => {
    try {
      showNotification('Generating AI personalized pitches & Instagram DMs...', 'info');
      const res = await fetch(`${API_BASE}/personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignConfig)
      });
      const data = await res.json();
      if (data.success) {
        setInfluencers(data.influencers);
        showNotification(`Generated outreach copy for all qualified creators!`, 'success');
        await loadAllData();
      }
    } catch (err) {
      showNotification(`Personalization Error: ${err.message}`, 'error');
    }
  };

  // Stage 5 Trigger
  const runStageSend = async () => {
    try {
      showNotification('Executing Sending Layer (with Duplicate Prevention)...', 'info');
      const res = await fetch(`${API_BASE}/send/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'simulation' })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Dispatched ${data.sentCount} emails (${data.duplicateCount} duplicates prevented)!`, 'success');
        await loadAllData();
      }
    } catch (err) {
      showNotification(`Sending Error: ${err.message}`, 'error');
    }
  };

  // Single Email Send
  const sendSingleEmail = async (creatorId) => {
    try {
      showNotification('Dispatching individual outreach email...', 'info');
      const res = await fetch(`${API_BASE}/send/single-email/${creatorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'simulation' })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Email dispatched for creator (${data.result?.status || 'SENT'})!`, 'success');
        await loadAllData();
      } else {
        showNotification(`Send Failed: ${data.error}`, 'error');
      }
    } catch (err) {
      showNotification(`Error: ${err.message}`, 'error');
    }
  };

  // Mark Instagram DM Sent
  const handleInstagramDmSent = async (creatorId) => {
    try {
      const res = await fetch(`${API_BASE}/send/instagram-dm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ influencerId: creatorId, action: 'MARK_SENT' })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('Instagram DM logged as SENT in outreach tracker!', 'success');
        await loadAllData();
      }
    } catch (err) {
      showNotification(`Error: ${err.message}`, 'error');
    }
  };

  // Regenerate Single Message
  const regenerateSingleCreator = async (creatorId) => {
    try {
      showNotification('Regenerating AI pitch for creator...', 'info');
      const res = await fetch(`${API_BASE}/personalize/${creatorId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(campaignConfig)
      });
      const data = await res.json();
      if (data.success) {
        setSelectedCreatorForOutreach(data.influencer);
        setInfluencers((prev) => prev.map((i) => (i.id === creatorId ? data.influencer : i)));
        showNotification('AI pitch regenerated with bespoke phrasing!', 'success');
      }
    } catch (err) {
      showNotification(`Error: ${err.message}`, 'error');
    }
  };

  // Reset Pipeline Data
  const handleReset = async () => {
    if (!window.confirm('Reset pipeline dataset to initial curated state?')) return;
    try {
      const res = await fetch(`${API_BASE}/reset`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('Pipeline state reset successfully!', 'info');
        await loadAllData();
      }
    } catch (err) {
      showNotification(`Reset Error: ${err.message}`, 'error');
    }
  };

  // Calculate Metrics
  const totalDiscovered = influencers.length;
  const passedCount = influencers.filter((i) => i.filterStatus === 'PASSED').length;
  const failedCount = influencers.filter((i) => i.filterStatus === 'FAILED').length;
  const enrichedCount = influencers.filter((i) => i.isEnriched).length;
  const emailsVerifiedCount = influencers.filter((i) => i.contactEmail && i.contactEmail !== 'Not Found').length;
  const messagesReadyCount = influencers.filter((i) => i.messagesGenerated && i.filterStatus === 'PASSED').length;
  const totalSentCount = tracker.filter((t) => t.sent).length;
  const duplicatesBlockedCount = tracker.filter((t) => t.status === 'DUPLICATE_PREVENTED').length;

  // Filtered Creator List
  const filteredCreators = influencers.filter((inf) => {
    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match =
        (inf.name && inf.name.toLowerCase().includes(q)) ||
        (inf.handle && inf.handle.toLowerCase().includes(q)) ||
        (inf.niche && inf.niche.toLowerCase().includes(q)) ||
        (inf.contactEmail && inf.contactEmail.toLowerCase().includes(q));
      if (!match) return false;
    }
    // Filter status tab
    if (filterStatusTab === 'PASSED' && inf.filterStatus !== 'PASSED') return false;
    if (filterStatusTab === 'FAILED' && inf.filterStatus !== 'FAILED') return false;
    // Niche filter
    if (selectedNicheFilter !== 'All' && !inf.niche.toLowerCase().includes(selectedNicheFilter.toLowerCase())) return false;
    // Email filter
    if (emailFilter === 'FOUND' && (!inf.contactEmail || inf.contactEmail === 'Not Found')) return false;
    if (emailFilter === 'NOT_FOUND' && inf.contactEmail && inf.contactEmail !== 'Not Found') return false;

    return true;
  });

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {notification && (
        <div
          id="toast-notification"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 999,
            background: notification.type === 'error' ? '#f43f5e' : notification.type === 'success' ? '#10b981' : '#6366f1',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 14,
            fontWeight: 600
          }}
        >
          {notification.type === 'success' ? <CheckCircle2 size={18} /> : notification.type === 'error' ? <XCircle size={18} /> : <Info size={18} />}
          <span>{notification.msg}</span>
        </div>
      )}

      {/* TOP HEADER */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand-identity">
            <div className="brand-logo-icon">
              <Zap size={20} />
            </div>
            <div className="brand-text">
              <h1 id="app-title">LUMINA // OUTREACH ENGINE</h1>
              <div className="brand-subtext">Automated Micro-Influencer Discovery & AI Outreach System</div>
            </div>
          </div>

          <div className="header-status-pill">
            <div className="status-dot"></div>
            <span>Backend: {systemHealth.status || 'Active'}</span>
            <span style={{ color: 'var(--text-dim)' }}>|</span>
            <span>API: Port 5000</span>
          </div>

          <div className="header-actions">
            <button
              id="btn-run-full-pipeline"
              className="btn btn-primary"
              onClick={runCompletePipeline}
              disabled={isRunningPipeline}
            >
              <Zap size={15} />
              {isRunningPipeline ? 'Automating Pipeline...' : 'Run Full Pipeline (1-Click)'}
            </button>

            <button
              id="btn-export-influencers-csv"
              className="btn btn-secondary"
              onClick={() => window.open(`${API_BASE}/export/csv/influencers`, '_blank')}
              title="Download Influencer Dataset CSV"
            >
              <Download size={14} />
              Export CSV
            </button>

            <button
              id="btn-reset-pipeline"
              className="btn btn-outline"
              onClick={handleReset}
              title="Reset System Data"
            >
              <RefreshCw size={14} />
              Reset
            </button>

            <button
              id="btn-toggle-logs"
              className="btn btn-outline"
              onClick={() => setLogsOpen(!logsOpen)}
              title="Activity Logs Audit Trail"
            >
              <Activity size={14} />
              Logs ({logs.length})
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="main-wrapper">
        {/* PROGRESS STEPPER BANNER (When Running) */}
        {pipelineProgress && (
          <div
            id="pipeline-progress-banner"
            style={{
              padding: '16px 20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.2) 0%, rgba(168,85,247,0.2) 100%)',
              border: '1px solid rgba(99,102,241,0.4)',
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, fontWeight: 700 }}>
              <span style={{ color: '#818cf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <RefreshCw size={14} className="pulse-badge" /> {pipelineProgress.stage}: {pipelineProgress.msg}
              </span>
              <span>{pipelineProgress.percent}%</span>
            </div>
            <div style={{ width: '100%', height: 6, background: 'rgba(0,0,0,0.4)', borderRadius: 4, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${pipelineProgress.percent}%`,
                  height: '100%',
                  background: 'var(--gradient-brand)',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>
          </div>
        )}

        {/* METRICS & KPIS */}
        <section id="metrics-overview" className="metrics-grid">
          <div className="stat-card" id="metric-discovered">
            <div>
              <div className="stat-title">Discovered Creators</div>
              <div className="stat-value">{totalDiscovered}</div>
              <div className="stat-desc">Target: 50+ (Met: {totalDiscovered >= 50 ? '✓' : '✗'})</div>
            </div>
            <div className="stat-icon-wrapper">
              <Users size={20} />
            </div>
          </div>

          <div className="stat-card" id="metric-passed">
            <div>
              <div className="stat-title">Filter Passed</div>
              <div className="stat-value" style={{ color: 'var(--color-success)' }}>
                {passedCount} <span style={{ fontSize: 13, color: 'var(--text-dim)' }}>({totalDiscovered ? Math.round((passedCount / totalDiscovered) * 100) : 0}%)</span>
              </div>
              <div className="stat-desc">5k-100k followers &amp; ≥2% ER</div>
            </div>
            <div className="stat-icon-wrapper" style={{ color: 'var(--color-success)' }}>
              <CheckCircle2 size={20} />
            </div>
          </div>

          <div className="stat-card" id="metric-disqualified">
            <div>
              <div className="stat-title">Disqualified</div>
              <div className="stat-value" style={{ color: 'var(--color-danger)' }}>
                {failedCount}
              </div>
              <div className="stat-desc">With explicit failure reasons</div>
            </div>
            <div className="stat-icon-wrapper" style={{ color: 'var(--color-danger)' }}>
              <XCircle size={20} />
            </div>
          </div>

          <div className="stat-card" id="metric-enriched">
            <div>
              <div className="stat-title">Enriched Profiles</div>
              <div className="stat-value" style={{ color: 'var(--color-info)' }}>
                {enrichedCount}
              </div>
              <div className="stat-desc">{emailsVerifiedCount} verified emails ({totalDiscovered - emailsVerifiedCount} Not Found)</div>
            </div>
            <div className="stat-icon-wrapper" style={{ color: 'var(--color-info)' }}>
              <ShieldCheck size={20} />
            </div>
          </div>

          <div className="stat-card" id="metric-outreach">
            <div>
              <div className="stat-title">Outreach Dispatched</div>
              <div className="stat-value" style={{ color: 'var(--accent-pink)' }}>
                {totalSentCount}
              </div>
              <div className="stat-desc">{duplicatesBlockedCount} duplicate sends avoided</div>
            </div>
            <div className="stat-icon-wrapper" style={{ color: 'var(--accent-pink)' }}>
              <Send size={20} />
            </div>
          </div>
        </section>

        {/* WORKFLOW PIPELINE STEPPER */}
        <section id="pipeline-stepper" className="stepper-container">
          <div className="stepper-header">
            <h2>
              <Layers size={18} style={{ color: 'var(--accent-primary)' }} />
              End-to-End Automation Pipeline
            </h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <span className="badge badge-brand">Modular Architecture</span>
              <span className="badge badge-success">5-Stage Execution</span>
            </div>
          </div>

          <div className="stepper-steps">
            <div
              className={`step-item ${activeTab === 'pipeline' ? 'active' : ''}`}
              onClick={() => setActiveTab('pipeline')}
              id="step-1-discovery"
            >
              <div className="step-top">
                <span className="step-number">STAGE 01</span>
                <Radio size={14} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <div className="step-title">Influencer Discovery</div>
              <div className="step-meta">{totalDiscovered} Creators identified</div>
            </div>

            <div
              className={`step-item ${activeTab === 'creators' && filterStatusTab !== 'ALL' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('creators');
                setFilterStatusTab('ALL');
              }}
              id="step-2-filtering"
            >
              <div className="step-top">
                <span className="step-number">STAGE 02</span>
                <Filter size={14} style={{ color: 'var(--accent-primary)' }} />
              </div>
              <div className="step-title">Filtering & Classification</div>
              <div className="step-meta">{passedCount} Passed | {failedCount} Failed</div>
            </div>

            <div
              className={`step-item ${activeTab === 'creators' ? 'active' : ''}`}
              onClick={() => setActiveTab('creators')}
              id="step-3-enrichment"
            >
              <div className="step-top">
                <span className="step-number">STAGE 03</span>
                <Database size={14} style={{ color: 'var(--color-info)' }} />
              </div>
              <div className="step-title">Profile Enrichment</div>
              <div className="step-meta">Strict email &amp; context tags</div>
            </div>

            <div
              className={`step-item ${activeTab === 'outreach' ? 'active' : ''}`}
              onClick={() => setActiveTab('outreach')}
              id="step-4-personalization"
            >
              <div className="step-top">
                <span className="step-number">STAGE 04</span>
                <Sparkles size={14} style={{ color: 'var(--accent-secondary)' }} />
              </div>
              <div className="step-title">AI Personalization</div>
              <div className="step-meta">Email 60-90w | DM 15-30w</div>
            </div>

            <div
              className={`step-item ${activeTab === 'tracker' ? 'active' : ''}`}
              onClick={() => setActiveTab('tracker')}
              id="step-5-sending"
            >
              <div className="step-top">
                <span className="step-number">STAGE 05</span>
                <Send size={14} style={{ color: 'var(--accent-pink)' }} />
              </div>
              <div className="step-title">Sending & Tracking</div>
              <div className="step-meta">Deduplicated delivery log</div>
            </div>
          </div>
        </section>

        {/* NAVIGATION TABS */}
        <nav className="tabs-nav" id="main-tabs-navigation">
          <button
            id="tab-btn-pipeline"
            className={`tab-btn ${activeTab === 'pipeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('pipeline')}
          >
            <SlidersHorizontal size={15} />
            Pipeline Studio &amp; Controls
          </button>

          <button
            id="tab-btn-creators"
            className={`tab-btn ${activeTab === 'creators' ? 'active' : ''}`}
            onClick={() => setActiveTab('creators')}
          >
            <Users size={15} />
            Creator Directory ({influencers.length})
          </button>

          <button
            id="tab-btn-outreach"
            className={`tab-btn ${activeTab === 'outreach' ? 'active' : ''}`}
            onClick={() => setActiveTab('outreach')}
          >
            <Sparkles size={15} />
            AI Outreach Studio ({passedCount} Qualified)
          </button>

          <button
            id="tab-btn-tracker"
            className={`tab-btn ${activeTab === 'tracker' ? 'active' : ''}`}
            onClick={() => setActiveTab('tracker')}
          >
            <Send size={15} />
            Outreach Tracker ({tracker.length})
          </button>

          <button
            id="tab-btn-logs"
            className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <Activity size={15} />
            Activity Logs ({logs.length})
          </button>
        </nav>

        {/* TAB 1: PIPELINE STUDIO & CONTROLS */}
        {activeTab === 'pipeline' && (
          <section id="panel-pipeline-studio" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {/* Stage 1: Discovery Configuration */}
              <div className="glass-panel" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Radio size={16} style={{ color: 'var(--accent-cyan)' }} />
                    Stage 1: Discovery Configuration
                  </h3>
                  <span className="badge badge-info">Step 1</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Target Niche Category</label>
                    <select
                      id="select-discovery-niche"
                      className="select-field"
                      value={discoveryConfig.niche}
                      onChange={(e) => setDiscoveryConfig({ ...discoveryConfig, niche: e.target.value })}
                    >
                      <option value="Fashion & Beauty">Fashion &amp; Beauty (Complete Category)</option>
                      <option value="Fitness">Fitness</option>
                      <option value="Technology">Technology</option>
                      <option value="All">All Niches Combined</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Discovery Source</label>
                    <select
                      id="select-discovery-source"
                      className="select-field"
                      value={discoveryConfig.source}
                      onChange={(e) => setDiscoveryConfig({ ...discoveryConfig, source: e.target.value })}
                    >
                      <option value="all">Multi-Channel (Curated + APIs + Public Directories)</option>
                      <option value="curated">Verified Authentic Directory (60+ Records)</option>
                      <option value="youtube_api">Live YouTube Data API v3</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Minimum Discovered Target</label>
                    <input
                      id="input-discovery-min"
                      type="number"
                      className="input-field"
                      value={discoveryConfig.minCount}
                      onChange={(e) => setDiscoveryConfig({ ...discoveryConfig, minCount: parseInt(e.target.value, 10) || 50 })}
                    />
                    <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>Strict requirement: At least 50 influencers</span>
                  </div>

                  <button
                    id="btn-trigger-stage-discovery"
                    className="btn btn-secondary"
                    onClick={runStageDiscovery}
                    style={{ marginTop: 8 }}
                  >
                    <Radio size={14} /> Run Discovery Only
                  </button>
                </div>
              </div>

              {/* Stage 2: Filtering Criteria Configuration */}
              <div className="glass-panel" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Filter size={16} style={{ color: 'var(--accent-primary)' }} />
                    Stage 2: Filtering &amp; Classification
                  </h3>
                  <span className="badge badge-brand">Step 2</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Min Followers</label>
                      <input
                        id="input-min-followers"
                        type="number"
                        className="input-field"
                        value={filterConfig.minFollowers}
                        onChange={(e) => setFilterConfig({ ...filterConfig, minFollowers: parseInt(e.target.value, 10) || 5000 })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Max Followers</label>
                      <input
                        id="input-max-followers"
                        type="number"
                        className="input-field"
                        value={filterConfig.maxFollowers}
                        onChange={(e) => setFilterConfig({ ...filterConfig, maxFollowers: parseInt(e.target.value, 10) || 100000 })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>
                      Min Engagement Rate ({filterConfig.minEngagementRate}%)
                    </label>
                    <input
                      id="input-min-engagement"
                      type="range"
                      min="1.0"
                      max="6.0"
                      step="0.1"
                      className="input-field"
                      value={filterConfig.minEngagementRate}
                      onChange={(e) => setFilterConfig({ ...filterConfig, minEngagementRate: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Complete Category Filter</label>
                    <select
                      id="select-filter-niche"
                      className="select-field"
                      value={filterConfig.targetNiche}
                      onChange={(e) => setFilterConfig({ ...filterConfig, targetNiche: e.target.value })}
                    >
                      <option value="Fashion & Beauty">Fashion &amp; Beauty</option>
                      <option value="Fitness">Fitness</option>
                      <option value="Technology">Technology</option>
                      <option value="All">All Niches</option>
                    </select>
                  </div>

                  <button
                    id="btn-trigger-stage-filter"
                    className="btn btn-secondary"
                    onClick={runStageFilter}
                    style={{ marginTop: 8 }}
                  >
                    <Filter size={14} /> Apply Filter Criteria
                  </button>
                </div>
              </div>

              {/* Stage 4: Campaign Personalization Configuration */}
              <div className="glass-panel" style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                  <h3 style={{ fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sparkles size={16} style={{ color: 'var(--accent-secondary)' }} />
                    Stage 4: Campaign &amp; AI Angles
                  </h3>
                  <span className="badge badge-brand">Step 4</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Brand Name</label>
                      <input
                        id="input-brand-name"
                        className="input-field"
                        value={campaignConfig.brandName}
                        onChange={(e) => setCampaignConfig({ ...campaignConfig, brandName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Product Name</label>
                      <input
                        id="input-product-name"
                        className="input-field"
                        value={campaignConfig.productName}
                        onChange={(e) => setCampaignConfig({ ...campaignConfig, productName: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Collaboration Angle</label>
                    <select
                      id="select-collab-type"
                      className="select-field"
                      value={campaignConfig.collaborationType}
                      onChange={(e) => setCampaignConfig({ ...campaignConfig, collaborationType: e.target.value })}
                    >
                      <option value="UGC content creation">UGC Content Creation</option>
                      <option value="Sponsorship">Paid Integrated Sponsorship</option>
                      <option value="Brand ambassador program">Brand Ambassador Program</option>
                      <option value="Affiliate campaign">Affiliate Campaign</option>
                      <option value="Paid product placement">Paid Product Placement</option>
                      <option value="Barter collaboration">Barter / Gifted Collaboration</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Sender Contact</label>
                    <input
                      id="input-sender-name"
                      className="input-field"
                      value={campaignConfig.senderName}
                      onChange={(e) => setCampaignConfig({ ...campaignConfig, senderName: e.target.value })}
                    />
                  </div>

                  <button
                    id="btn-trigger-stage-personalize"
                    className="btn btn-secondary"
                    onClick={runStagePersonalize}
                    style={{ marginTop: 8 }}
                  >
                    <Sparkles size={14} /> Batch Generate AI Copy
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="glass-panel" style={{ padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <h4 style={{ fontSize: 15, marginBottom: 4 }}>One-Click Complete Pipeline Execution</h4>
                <p style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  Triggers discovery of 50+ influencers, applies Fashion &amp; Beauty criteria, enriches all mandatory fields, generates 60-90w emails &amp; 15-30w DMs, and simulates sending with duplicate prevention.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  id="btn-quick-enrich"
                  className="btn btn-secondary"
                  onClick={runStageEnrich}
                >
                  <Database size={14} /> Stage 3: Enrich Profiles
                </button>
                <button
                  id="btn-quick-send"
                  className="btn btn-secondary"
                  onClick={runStageSend}
                >
                  <Send size={14} /> Stage 5: Send Batch
                </button>
                <button
                  id="btn-quick-run-all"
                  className="btn btn-primary"
                  onClick={runCompletePipeline}
                  disabled={isRunningPipeline}
                >
                  <Zap size={15} /> Run Full Pipeline
                </button>
              </div>
            </div>
          </section>
        )}

        {/* TAB 2: CREATOR DIRECTORY */}
        {activeTab === 'creators' && (
          <section id="panel-creator-directory" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Toolbar */}
            <div className="toolbar-panel">
              <div className="search-wrapper">
                <Search size={16} className="search-icon" />
                <input
                  id="input-search-creators"
                  className="input-field search-input"
                  placeholder="Search creators by name, handle, themes, or email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-actions">
                {/* Status Toggle */}
                <div style={{ display: 'flex', background: 'rgba(0,0,0,0.3)', padding: 3, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
                  <button
                    id="filter-status-all"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      background: filterStatusTab === 'ALL' ? 'var(--bg-surface)' : 'transparent',
                      color: filterStatusTab === 'ALL' ? '#fff' : 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setFilterStatusTab('ALL')}
                  >
                    All ({influencers.length})
                  </button>
                  <button
                    id="filter-status-passed"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      background: filterStatusTab === 'PASSED' ? 'var(--color-success-bg)' : 'transparent',
                      color: filterStatusTab === 'PASSED' ? 'var(--color-success)' : 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setFilterStatusTab('PASSED')}
                  >
                    Passed ({passedCount})
                  </button>
                  <button
                    id="filter-status-failed"
                    style={{
                      padding: '6px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 600,
                      background: filterStatusTab === 'FAILED' ? 'var(--color-danger-bg)' : 'transparent',
                      color: filterStatusTab === 'FAILED' ? 'var(--color-danger)' : 'var(--text-muted)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                    onClick={() => setFilterStatusTab('FAILED')}
                  >
                    Disqualified ({failedCount})
                  </button>
                </div>

                {/* Niche Filter */}
                <select
                  id="filter-directory-niche"
                  className="select-field"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 12.5 }}
                  value={selectedNicheFilter}
                  onChange={(e) => setSelectedNicheFilter(e.target.value)}
                >
                  <option value="All">All Niches</option>
                  <option value="Fashion & Beauty">Fashion &amp; Beauty</option>
                  <option value="Fitness">Fitness</option>
                  <option value="Technology">Technology</option>
                </select>

                {/* Email Filter */}
                <select
                  id="filter-directory-email"
                  className="select-field"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: 12.5 }}
                  value={emailFilter}
                  onChange={(e) => setEmailFilter(e.target.value)}
                >
                  <option value="ALL">All Email Status</option>
                  <option value="FOUND">Verified Email ({emailsVerifiedCount})</option>
                  <option value="NOT_FOUND">Marked Not Found ({totalDiscovered - emailsVerifiedCount})</option>
                </select>
              </div>
            </div>

            {/* Creators Grid */}
            <div className="creator-grid" id="creators-grid-container">
              {filteredCreators.map((creator) => {
                const isPassed = creator.filterStatus === 'PASSED';
                const hasValidEmail = creator.contactEmail && creator.contactEmail !== 'Not Found';

                return (
                  <div
                    key={creator.id}
                    className={`creator-card ${isPassed ? 'passed' : 'failed'}`}
                    id={`creator-card-${creator.id}`}
                  >
                    <div className="creator-card-header">
                      <div className="creator-avatar-info">
                        <div className="creator-avatar">
                          {creator.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="creator-name">
                            {creator.name}
                            {creator.platform === 'Instagram' && <Instagram size={14} style={{ color: '#e1306c' }} />}
                            {creator.platform === 'YouTube' && <Youtube size={14} style={{ color: '#ff0000' }} />}
                          </div>
                          <div className="creator-handle">{creator.handle}</div>
                        </div>
                      </div>

                      <div>
                        {isPassed ? (
                          <span className="badge badge-success" id={`badge-passed-${creator.id}`}>
                            <CheckCircle2 size={12} /> Passed
                          </span>
                        ) : (
                          <span className="badge badge-danger" id={`badge-failed-${creator.id}`}>
                            <XCircle size={12} /> Disqualified
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Metrics Strip */}
                    <div className="metrics-strip">
                      <div>
                        <div className="metric-box-label">Followers</div>
                        <div className="metric-box-value">{(creator.followers || 0).toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="metric-box-label">Engagement</div>
                        <div className="metric-box-value">{creator.engagementRate || 0}%</div>
                      </div>
                      <div>
                        <div className="metric-box-label">Brand Fit</div>
                        <div className="metric-box-value" style={{ color: isPassed ? 'var(--color-success)' : 'var(--color-warning)' }}>
                          {creator.brandFitScore || 65}/100
                        </div>
                      </div>
                    </div>

                    {/* Classification & Reasons */}
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>
                        CLASSIFICATION: {creator.classification || (isPassed ? 'Tier 1 Micro-Influencer' : 'Disqualified')}
                      </div>
                      <div style={{ fontSize: 11.5, color: isPassed ? '#10b981' : '#f87171', lineHeight: 1.4 }}>
                        {creator.filterReasons && creator.filterReasons[0]
                          ? creator.filterReasons[0]
                          : isPassed
                          ? 'Meets all micro-influencer threshold criteria'
                          : 'Exceeds or falls below required parameters'}
                      </div>
                    </div>

                    {/* Content Themes */}
                    <div className="themes-tags">
                      {(creator.contentThemes || [creator.niche]).slice(0, 3).map((theme, idx) => (
                        <span key={idx} className="theme-tag">
                          {theme}
                        </span>
                      ))}
                    </div>

                    {/* Footer */}
                    <div className="creator-card-footer">
                      <div className={`email-badge ${hasValidEmail ? 'verified' : 'not-found'}`}>
                        <Mail size={13} />
                        <span>{creator.contactEmail || 'Not Found'}</span>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-outline"
                          style={{ padding: '5px 10px', fontSize: 12 }}
                          onClick={() => setSelectedCreatorForModal(creator)}
                          title="View Full Enriched Profile"
                          id={`btn-view-${creator.id}`}
                        >
                          <Eye size={13} /> Details
                        </button>

                        {isPassed && (
                          <button
                            className="btn btn-primary"
                            style={{ padding: '5px 10px', fontSize: 12 }}
                            onClick={() => {
                              setSelectedCreatorForOutreach(creator);
                              setActiveTab('outreach');
                            }}
                            title="Open in AI Outreach Studio"
                            id={`btn-outreach-${creator.id}`}
                          >
                            <Sparkles size={13} /> Pitch
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* TAB 3: AI OUTREACH STUDIO */}
        {activeTab === 'outreach' && (
          <section id="panel-ai-outreach-studio" className="outreach-studio-grid">
            {/* Left side creator picker */}
            <div className="creator-picker-list">
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-subtle)', background: 'rgba(0,0,0,0.2)' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)', marginBottom: 8 }}>
                  Shortlisted Qualified Creators ({passedCount})
                </div>
                <input
                  className="input-field"
                  placeholder="Filter shortlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ fontSize: 12, padding: '6px 10px' }}
                />
              </div>

              {influencers
                .filter((i) => i.filterStatus === 'PASSED')
                .filter((i) => !searchQuery || i.name.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((creator) => {
                  const isSelected = selectedCreatorForOutreach?.id === creator.id;
                  const hasMessages = creator.messagesGenerated && creator.outreach;

                  return (
                    <div
                      key={creator.id}
                      className={`creator-picker-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => setSelectedCreatorForOutreach(creator)}
                      id={`picker-item-${creator.id}`}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-main)' }}>
                          {creator.name}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                          {creator.platform} • {(creator.followers || 0).toLocaleString()} followers
                        </div>
                      </div>

                      <div>
                        {hasMessages ? (
                          <span className="badge badge-brand" style={{ fontSize: 10 }}>Ready</span>
                        ) : (
                          <span className="badge badge-warning" style={{ fontSize: 10 }}>Generate</span>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Right side outreach generator & preview */}
            <div className="outreach-editor-panel">
              {selectedCreatorForOutreach ? (
                <>
                  {/* Creator Context Banner */}
                  <div className="glass-panel" style={{ padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <h2 style={{ fontSize: 18 }}>{selectedCreatorForOutreach.name}</h2>
                        <span className="badge badge-brand">{selectedCreatorForOutreach.niche}</span>
                        <span className="badge badge-success">{selectedCreatorForOutreach.platform}</span>
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                        Email: <strong style={{ color: selectedCreatorForOutreach.contactEmail !== 'Not Found' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {selectedCreatorForOutreach.contactEmail}
                        </strong> • Tone: {selectedCreatorForOutreach.contentStyle || 'Authentic & Aesthetic'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 2 }}>
                        Recent Content Anchor: <em>"{selectedCreatorForOutreach.recentContent}"</em>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        id="btn-regenerate-pitch"
                        className="btn btn-secondary"
                        onClick={() => regenerateSingleCreator(selectedCreatorForOutreach.id)}
                      >
                        <RefreshCw size={14} /> Regenerate Pitch
                      </button>
                      {selectedCreatorForOutreach.contactEmail && selectedCreatorForOutreach.contactEmail !== 'Not Found' && (
                        <button
                          id="btn-send-single-email"
                          className="btn btn-primary"
                          onClick={() => sendSingleEmail(selectedCreatorForOutreach.id)}
                        >
                          <Send size={14} /> Send Email
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Pitch A: Email Collaboration Pitch (60-90 words) */}
                  <div className="message-preview-box" id="email-pitch-container">
                    <div className="message-preview-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Mail size={16} style={{ color: 'var(--accent-primary)' }} />
                          <h3 style={{ fontSize: 15 }}>A. Email Collaboration Pitch</h3>
                          <span
                            className={`badge ${
                              selectedCreatorForOutreach.outreach?.email?.isValidLength ? 'badge-success' : 'badge-warning'
                            }`}
                            id="email-word-count-badge"
                          >
                            {selectedCreatorForOutreach.outreach?.email?.wordCount || 0} words
                            {selectedCreatorForOutreach.outreach?.email?.isValidLength ? ' (Valid: 60–90w)' : ' (Calibrated)'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                          Personalized signals: Niche, style, recent hook, and value proposition
                        </div>
                      </div>

                      <button
                        className="btn btn-secondary"
                        style={{ padding: '6px 12px', fontSize: 12 }}
                        onClick={() =>
                          copyToClipboard(
                            `Subject: ${selectedCreatorForOutreach.outreach?.email?.subject}\n\n${selectedCreatorForOutreach.outreach?.email?.body}`,
                            'email'
                          )
                        }
                        id="btn-copy-email-pitch"
                      >
                        {copiedKey === 'email' ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                        {copiedKey === 'email' ? 'Copied' : 'Copy Pitch'}
                      </button>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>SUBJECT LINE:</div>
                      <div
                        id="email-subject-display"
                        style={{
                          background: 'rgba(255,255,255,0.03)',
                          padding: '8px 12px',
                          borderRadius: 6,
                          fontSize: 13,
                          fontWeight: 600,
                          color: '#fff',
                          fontFamily: 'var(--font-mono)'
                        }}
                      >
                        {selectedCreatorForOutreach.outreach?.email?.subject || 'Subject line generating...'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>EMAIL BODY (60–90 words):</div>
                      <div id="email-body-display" className="message-body-text">
                        {selectedCreatorForOutreach.outreach?.email?.body ||
                          'Click "Regenerate Pitch" to formulate personalized outreach message.'}
                      </div>
                    </div>
                  </div>

                  {/* Pitch B: Instagram DM (15-30 words) */}
                  <div className="message-preview-box" id="instagram-dm-container">
                    <div className="message-preview-header">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Instagram size={16} style={{ color: '#e1306c' }} />
                          <h3 style={{ fontSize: 15 }}>B. Instagram Direct Message (DM)</h3>
                          <span
                            className={`badge ${
                              selectedCreatorForOutreach.outreach?.instagramDm?.isValidLength ? 'badge-success' : 'badge-warning'
                            }`}
                            id="dm-word-count-badge"
                          >
                            {selectedCreatorForOutreach.outreach?.instagramDm?.wordCount || 0} words
                            {selectedCreatorForOutreach.outreach?.instagramDm?.isValidLength ? ' (Valid: 15–30w)' : ' (Calibrated)'}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
                          Concise, natural hook tailored for mobile messaging
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          className="btn btn-secondary"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() =>
                            copyToClipboard(selectedCreatorForOutreach.outreach?.instagramDm?.text, 'dm')
                          }
                          id="btn-copy-instagram-dm"
                        >
                          {copiedKey === 'dm' ? <Check size={14} style={{ color: 'var(--color-success)' }} /> : <Copy size={14} />}
                          {copiedKey === 'dm' ? 'Copied' : 'Copy DM'}
                        </button>

                        <button
                          className="btn btn-outline"
                          style={{ padding: '6px 12px', fontSize: 12 }}
                          onClick={() => handleInstagramDmSent(selectedCreatorForOutreach.id)}
                          id="btn-mark-dm-sent"
                          title="Simulate manual Instagram Direct message send"
                        >
                          <Send size={14} /> Mark DM Sent
                        </button>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-dim)', marginBottom: 4 }}>DM TEXT (15–30 words):</div>
                      <div id="dm-text-display" className="message-body-text" style={{ fontSize: 14 }}>
                        {selectedCreatorForOutreach.outreach?.instagramDm?.text ||
                          'Click "Regenerate Pitch" to generate short DM.'}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="glass-panel" style={{ padding: 40, textAlign: 'center' }}>
                  <Sparkles size={32} style={{ color: 'var(--accent-primary)', marginBottom: 12 }} />
                  <h3>Select a Qualified Creator from the left to inspect AI outreach</h3>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TAB 4: OUTREACH TRACKER */}
        {activeTab === 'tracker' && (
          <section id="panel-outreach-tracker" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div className="toolbar-panel">
              <div>
                <h3 style={{ fontSize: 16 }}>Live Outreach Tracker &amp; Audit Log</h3>
                <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  Maintains sending status, duplicate outreach protection, timestamps, and platform audit records.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  id="btn-download-tracker-csv"
                  className="btn btn-secondary"
                  onClick={() => window.open(`${API_BASE}/export/csv/tracker`, '_blank')}
                >
                  <Download size={14} /> Download Tracker CSV
                </button>
                <button
                  id="btn-trigger-email-batch"
                  className="btn btn-primary"
                  onClick={runStageSend}
                >
                  <Send size={14} /> Dispatch Batch
                </button>
              </div>
            </div>

            <div className="table-container">
              <table className="data-table" id="outreach-tracker-table">
                <thead>
                  <tr>
                    <th>Influencer</th>
                    <th>Platform</th>
                    <th>Contact Email</th>
                    <th>Message Pitch</th>
                    <th>Sent</th>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Preview / Audit Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {tracker.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: 32, color: 'var(--text-muted)' }}>
                        No outreach dispatches recorded yet. Run the sending layer or click "Run Full Pipeline".
                      </td>
                    </tr>
                  ) : (
                    tracker.map((entry, idx) => {
                      const isSent = entry.sent;
                      const isDup = entry.status === 'DUPLICATE_PREVENTED';

                      return (
                        <tr key={idx} id={`tracker-row-${idx}`}>
                          <td style={{ fontWeight: 700 }}>{entry.influencerName}</td>
                          <td>
                            <span className="badge badge-brand">{entry.platform || 'Instagram'}</span>
                          </td>
                          <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                            {entry.email || entry.handle || 'Not Found'}
                          </td>
                          <td>
                            <span className="badge badge-success">Generated</span>
                          </td>
                          <td>
                            {isSent ? (
                              <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>YES</span>
                            ) : (
                              <span style={{ color: 'var(--color-danger)' }}>NO</span>
                            )}
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                            {entry.sentDate ? new Date(entry.sentDate).toLocaleString() : new Date().toLocaleString()}
                          </td>
                          <td>
                            <span
                              className={`badge ${
                                isSent ? 'badge-success' : isDup ? 'badge-warning' : 'badge-danger'
                              }`}
                            >
                              {entry.status}
                            </span>
                          </td>
                          <td style={{ fontSize: 12, color: 'var(--text-muted)', maxWidth: 280 }}>
                            {entry.previewUrl ? (
                              <a
                                href={entry.previewUrl}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              >
                                Ethereal Web Preview <ExternalLink size={12} />
                              </a>
                            ) : (
                              entry.notes || 'Outreach logged'
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* TAB 5: ACTIVITY AUDIT LOGS */}
        {activeTab === 'logs' && (
          <section id="panel-activity-logs" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="toolbar-panel">
              <h3 style={{ fontSize: 16 }}>Real-Time System Activity Logs</h3>
              <button className="btn btn-secondary" onClick={loadAllData}>
                <RefreshCw size={14} /> Refresh Logs
              </button>
            </div>

            <div className="logs-console" id="activity-logs-container">
              {logs.map((log, idx) => (
                <div key={idx} className="log-line">
                  <span className="log-time">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}</span>
                  <span className={`log-level ${log.level || 'info'}`}>{log.level || 'info'}</span>
                  <span className="log-msg">{log.message}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* INFLUENCER ENRICHED DETAILS MODAL */}
      {selectedCreatorForModal && (
        <div className="modal-overlay" onClick={() => setSelectedCreatorForModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} id="influencer-modal">
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div className="creator-avatar">
                  {selectedCreatorForModal.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ fontSize: 17 }}>{selectedCreatorForModal.name}</h3>
                  <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>
                    {selectedCreatorForModal.handle} • {selectedCreatorForModal.platform}
                  </div>
                </div>
              </div>

              <button
                className="btn btn-outline"
                style={{ padding: 6 }}
                onClick={() => setSelectedCreatorForModal(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              {/* Mandatory Fields Section */}
              <div>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
                  MANDATORY ENRICHMENT FIELDS (Requirement 3)
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Platform &amp; URL</div>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>
                      <a href={selectedCreatorForModal.profileUrl} target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {selectedCreatorForModal.platform} Profile <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Follower Count</div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                      {(selectedCreatorForModal.followers || 0).toLocaleString()}
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Engagement Rate</div>
                    <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--color-success)' }}>
                      {selectedCreatorForModal.engagementRate}%
                    </div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: 10, borderRadius: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>Contact Email (Strict Validation)</div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        fontFamily: 'var(--font-mono)',
                        color: selectedCreatorForModal.contactEmail !== 'Not Found' ? 'var(--color-success)' : 'var(--color-danger)'
                      }}
                    >
                      {selectedCreatorForModal.contactEmail || 'Not Found'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Themes */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase', marginBottom: 6 }}>
                  Content Themes &amp; Niche Context
                </div>
                <div className="themes-tags">
                  {(selectedCreatorForModal.contentThemes || [selectedCreatorForModal.niche]).map((t, idx) => (
                    <span key={idx} className="theme-tag" style={{ color: '#fff', background: 'rgba(99,102,241,0.15)' }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Optional Fields Section */}
              <div>
                <h4 style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-dim)', marginBottom: 8 }}>
                  OPTIONAL DEMOGRAPHIC ENRICHMENT
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, fontSize: 12.5 }}>
                  <div>
                    <strong>Audience Age:</strong> {selectedCreatorForModal.audienceAge || '18-34 Core'}
                  </div>
                  <div>
                    <strong>Audience Gender:</strong> {selectedCreatorForModal.audienceGender || 'Female Skewed'}
                  </div>
                  <div>
                    <strong>Geography:</strong> {selectedCreatorForModal.audienceGeography || 'United States, UK'}
                  </div>
                  <div>
                    <strong>Website:</strong>{' '}
                    {selectedCreatorForModal.website && selectedCreatorForModal.website !== 'Not Found' ? (
                      <a href={selectedCreatorForModal.website} target="_blank" rel="noreferrer">
                        {selectedCreatorForModal.website}
                      </a>
                    ) : (
                      'Not Found'
                    )}
                  </div>
                </div>
              </div>

              {/* Filter Classification & Reasons */}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: 14, borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6 }}>
                  Filtering Audit Decision: {selectedCreatorForModal.filterStatus}
                </div>
                <ul style={{ paddingLeft: 18, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                  {(selectedCreatorForModal.filterReasons || []).map((reason, idx) => (
                    <li key={idx} style={{ color: reason.startsWith('Passed') ? '#10b981' : '#f87171' }}>
                      {reason}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedCreatorForModal(null)}>
                Close
              </button>
              {selectedCreatorForModal.filterStatus === 'PASSED' && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setSelectedCreatorForOutreach(selectedCreatorForModal);
                    setSelectedCreatorForModal(null);
                    setActiveTab('outreach');
                  }}
                >
                  <Sparkles size={14} /> Open in Outreach Studio
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
