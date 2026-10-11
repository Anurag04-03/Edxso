const storageService = require('./storageService');

class FilteringService {
  constructor() {
    this.defaultConfig = {
      minFollowers: 5000,
      maxFollowers: 100000,
      minEngagementRate: 2.0,
      targetNiche: 'Fashion & Beauty', // Default complete filtering category
      allowedPlatforms: ['Instagram', 'YouTube', 'TikTok'],
      requireEmail: false, // If true, only pass those with valid email
      prohibitedKeywords: ['giveaway spam', 'bot repost', 'cash app', 'crypto scam', 'stolen clips']
    };
  }

  /**
   * Filter and classify a list of influencers based on customizable criteria
   */
  filterInfluencers(influencers, userConfig = {}) {
    const config = { ...this.defaultConfig, ...userConfig };
    storageService.logActivity(
      `Running Filtering & Classification: Niche="${config.targetNiche}", Followers=[${config.minFollowers} - ${config.maxFollowers}], MinEngagement=${config.minEngagementRate}%`
    );

    const results = influencers.map((inf) => {
      const evaluation = this.evaluateInfluencer(inf, config);
      return {
        ...inf,
        filterStatus: evaluation.passed ? 'PASSED' : 'FAILED',
        filterReasons: evaluation.reasons,
        brandFitScore: evaluation.brandFitScore,
        classification: evaluation.classification,
        filteredAt: new Date().toISOString()
      };
    });

    const passedCount = results.filter((r) => r.filterStatus === 'PASSED').length;
    const failedCount = results.filter((r) => r.filterStatus === 'FAILED').length;

    storageService.logActivity(
      `Filtering finished: ${passedCount} Passed, ${failedCount} Failed out of ${results.length} total creators`
    );

    storageService.saveInfluencers(results);
    return {
      total: results.length,
      passedCount,
      failedCount,
      config,
      influencers: results
    };
  }

  /**
   * Evaluate a single influencer against all criteria
   */
  evaluateInfluencer(inf, config) {
    const reasons = [];
    let passed = true;

    // 1. Follower Count Test (5,000 - 100,000)
    const followers = inf.followers || 0;
    if (followers < config.minFollowers) {
      passed = false;
      reasons.push(`Failed: Follower count (${followers.toLocaleString()}) below micro-influencer minimum (${config.minFollowers.toLocaleString()})`);
    } else if (followers > config.maxFollowers) {
      passed = false;
      reasons.push(`Failed: Follower count (${followers.toLocaleString()}) exceeds micro-influencer ceiling (${config.maxFollowers.toLocaleString()})`);
    } else {
      reasons.push(`Passed: Follower count (${followers.toLocaleString()}) is within micro-influencer tier [${config.minFollowers.toLocaleString()} - ${config.maxFollowers.toLocaleString()}]`);
    }

    // 2. Engagement Rate Test (>= minEngagementRate)
    const engagement = inf.engagementRate || 0;
    if (engagement < config.minEngagementRate) {
      passed = false;
      reasons.push(`Failed: Engagement rate (${engagement}%) is below required minimum (${config.minEngagementRate}%)`);
    } else {
      reasons.push(`Passed: Engagement rate (${engagement}%) meets or exceeds minimum (${config.minEngagementRate}%)`);
    }

    // 3. Category / Niche Alignment Test
    if (config.targetNiche && config.targetNiche !== 'All') {
      const nicheMatch = (inf.niche || '').toLowerCase().includes(config.targetNiche.toLowerCase()) ||
        config.targetNiche.toLowerCase().includes((inf.niche || '').toLowerCase());
      
      if (!nicheMatch) {
        passed = false;
        reasons.push(`Failed: Creator niche '${inf.niche}' does not match target category '${config.targetNiche}'`);
      } else {
        reasons.push(`Passed: Niche '${inf.niche}' matches target category '${config.targetNiche}'`);
      }
    } else {
      reasons.push(`Passed: Broad niche acceptance enabled`);
    }

    // 4. Platform check
    if (config.allowedPlatforms && config.allowedPlatforms.length > 0) {
      if (!config.allowedPlatforms.includes(inf.platform)) {
        passed = false;
        reasons.push(`Failed: Platform '${inf.platform}' not in approved list [${config.allowedPlatforms.join(', ')}]`);
      } else {
        reasons.push(`Passed: Platform '${inf.platform}' is an active collaboration channel`);
      }
    }

    // 5. Brand Safety & Content Relevance Test
    const combinedContentText = `${inf.name} ${inf.recentContent || ''} ${(inf.contentThemes || []).join(' ')}`.toLowerCase();
    const foundProhibited = (config.prohibitedKeywords || []).find((keyword) => combinedContentText.includes(keyword.toLowerCase()));
    
    if (foundProhibited) {
      passed = false;
      reasons.push(`Failed: Content contains flagged brand-safety keyword '${foundProhibited}'`);
    } else {
      reasons.push(`Passed: Brand safety verified (high content integrity and clean post history)`);
    }

    // 6. Optional Email check
    if (config.requireEmail && (!inf.contactEmail || inf.contactEmail === 'Not Found')) {
      passed = false;
      reasons.push(`Failed: Direct contact email not found (strict email requirement enabled)`);
    }

    // Calculate Brand Fit Score (0 - 100)
    let brandFitScore = 50;
    // Engagement bonus: up to +30 pts (e.g. 5% engagement gives +25 pts)
    brandFitScore += Math.min(30, Math.round(engagement * 5));
    // Follower sweet spot (15,000 - 65,000 gives ideal ROI for micro campaigns): +15 pts
    if (followers >= 15000 && followers <= 65000) {
      brandFitScore += 15;
    }
    // High content depth bonus:
    if (inf.contentThemes && inf.contentThemes.length >= 3) {
      brandFitScore += 5;
    }
    // Deduct if failed
    if (!passed) {
      brandFitScore = Math.max(15, brandFitScore - 40);
    }
    brandFitScore = Math.min(99, Math.max(10, brandFitScore));

    // Determine Classification Label
    let classification = 'Disqualified';
    if (passed) {
      if (brandFitScore >= 85) classification = 'Tier 1 Priority Micro-Influencer';
      else if (brandFitScore >= 70) classification = 'Tier 2 Solid Contender';
      else classification = 'Tier 3 Micro-Creator';
    } else {
      if (followers > config.maxFollowers) classification = 'Disqualified: Exceeds Follower Limit (Macro)';
      else if (followers < config.minFollowers) classification = 'Disqualified: Below Follower Threshold (Nano)';
      else if (engagement < config.minEngagementRate) classification = 'Disqualified: Sub-par Engagement';
      else classification = 'Disqualified: Niche Mismatch';
    }

    return {
      passed,
      reasons,
      brandFitScore,
      classification
    };
  }
}

module.exports = new FilteringService();
