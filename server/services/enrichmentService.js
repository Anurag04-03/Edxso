const storageService = require('./storageService');

class EnrichmentService {
  /**
   * Enriches shortlisted influencers with full mandatory and optional context
   */
  enrichInfluencers(influencers, onlyPassed = false) {
    storageService.logActivity(`Starting Profile Enrichment pipeline (Target: ${influencers.length} creators)`);

    const enriched = influencers.map((inf) => {
      // Only enrich if requested or enrich all
      if (onlyPassed && inf.filterStatus !== 'PASSED') {
        return inf;
      }

      return this.enrichSingleProfile(inf);
    });

    const enrichedCount = enriched.filter((i) => i.isEnriched).length;
    const emailsFoundCount = enriched.filter((i) => i.contactEmail && i.contactEmail !== 'Not Found').length;

    storageService.logActivity(
      `Enrichment completed: ${enrichedCount} profiles enriched. Valid emails: ${emailsFoundCount}, Not Found: ${enrichedCount - emailsFoundCount}`
    );

    storageService.saveInfluencers(enriched);
    return {
      total: enriched.length,
      enrichedCount,
      emailsFoundCount,
      influencers: enriched
    };
  }

  /**
   * Enrich a single influencer record
   */
  enrichSingleProfile(inf) {
    // 1. Mandatory Field Validation
    const name = inf.name || 'Unknown Creator';
    const platform = inf.platform || 'Instagram';
    const profileUrl = inf.profileUrl || `https://${platform.toLowerCase()}.com/${inf.handle ? inf.handle.replace('@', '') : ''}`;
    const followers = Number(inf.followers) || 0;
    const engagementRate = Number(inf.engagementRate) || 0;
    const niche = inf.niche || 'Fashion & Beauty';

    // 2. Content Themes (Mandatory)
    let contentThemes = inf.contentThemes;
    if (!contentThemes || (Array.isArray(contentThemes) && contentThemes.length === 0)) {
      contentThemes = this.inferThemesFromNiche(niche);
    }

    // 3. Contact Email (Strict: If missing or empty, set to "Not Found" - NO GUESSING)
    let contactEmail = inf.contactEmail ? inf.contactEmail.trim() : 'Not Found';
    if (!contactEmail || contactEmail === '' || contactEmail.toLowerCase() === 'none' || contactEmail.toLowerCase() === 'null') {
      contactEmail = 'Not Found';
    }

    // 4. Optional: Website, Handles, Demographics
    const website = inf.website && inf.website.trim() !== '' ? inf.website : 'Not Found';
    const audienceAge = inf.audienceAge || '18-34 (Core Demographic)';
    const audienceGender = inf.audienceGender || 'Female Skewed (75%+)';
    const audienceGeography = inf.audienceGeography || 'United States, Canada, UK';

    // 5. Advanced Enrichment: Content tone, key hooks, and engagement tiers
    const contentStyle = this.determineContentStyle(inf);
    const primaryHook = inf.recentContent || (contentThemes[0] ? `Recent showcase on ${contentThemes[0]}` : 'Latest creator updates');

    return {
      ...inf,
      name,
      platform,
      profileUrl,
      followers,
      engagementRate,
      niche,
      contentThemes: Array.isArray(contentThemes) ? contentThemes : [contentThemes],
      contactEmail,
      emailStatus: contactEmail !== 'Not Found' ? 'FOUND' : 'NOT_FOUND',
      website,
      audienceAge,
      audienceGender,
      audienceGeography,
      contentStyle,
      primaryHook,
      isEnriched: true,
      enrichedAt: new Date().toISOString()
    };
  }

  determineContentStyle(inf) {
    const text = `${inf.name} ${inf.recentContent || ''} ${(inf.contentThemes || []).join(' ')}`.toLowerCase();
    if (text.includes('chemist') || text.includes('science') || text.includes('experiment') || text.includes('clinical') || text.includes('dr.')) {
      return 'Educational & Scientific Reviewer';
    }
    if (text.includes('thrift') || text.includes('sustainable') || text.includes('capsule') || text.includes('minimalist')) {
      return 'Authentic, Aesthetic & Sustainable';
    }
    if (text.includes('budget') || text.includes('dupe') || text.includes('drugstore') || text.includes('under $')) {
      return 'High-Value Accessible & Pragmatic';
    }
    if (text.includes('workout') || text.includes('strength') || text.includes('mobility') || text.includes('hiit')) {
      return 'Actionable, Coach-Driven & High-Energy';
    }
    return 'Modern Lifestyle & Relatable Storyteller';
  }

  inferThemesFromNiche(niche) {
    if (niche.toLowerCase().includes('beauty') || niche.toLowerCase().includes('fashion')) {
      return ['Skincare Routine', 'Everyday Glam', 'Outfit Inspiration', 'Beauty Hauls'];
    }
    if (niche.toLowerCase().includes('fit')) {
      return ['Strength Conditioning', 'Nutrition Tips', 'Mobility Drills', 'Home Workouts'];
    }
    if (niche.toLowerCase().includes('tech')) {
      return ['Productivity Tools', 'Desk Setup', 'Software Automations', 'Hardware Reviews'];
    }
    return ['Lifestyle Inspiration', 'Product Reviews', 'Community Tips'];
  }
}

module.exports = new EnrichmentService();
