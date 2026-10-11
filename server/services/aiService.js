const axios = require('axios');
const storageService = require('./storageService');

class AIService {
  constructor() {
    this.defaultCampaign = {
      brandName: 'GlowMatrix Skincare',
      productName: 'Barrier Renewal Serum',
      collaborationType: 'UGC content creation', // 'UGC content creation', 'Sponsorship', 'Affiliate campaign', 'Brand ambassador program', 'Paid product placement', 'Barter collaboration'
      valueProposition: 'a competitive upfront fee, full product suite, and performance bonuses',
      senderName: 'Alex Vance',
      senderRole: 'Head of Creator Partnerships'
    };
  }

  /**
   * Count words in a string accurately
   */
  countWords(str) {
    if (!str) return 0;
    return str.trim().split(/\s+/).filter(Boolean).length;
  }

  /**
   * Batch generation of personalized outreach messages for qualified creators
   */
  async generateOutreachBatch(influencers, campaignConfig = {}) {
    const campaign = { ...this.defaultCampaign, ...campaignConfig };
    storageService.logActivity(
      `Generating AI personalized outreach messages for ${influencers.length} creators (Brand: "${campaign.brandName}", Type: "${campaign.collaborationType}")`
    );

    const updatedInfluencers = [];
    for (const inf of influencers) {
      if (inf.filterStatus !== 'PASSED') {
        updatedInfluencers.push(inf);
        continue;
      }

      const outreach = await this.generatePersonalizedMessages(inf, campaign);
      updatedInfluencers.push({
        ...inf,
        outreach,
        messagesGenerated: true,
        generatedAt: new Date().toISOString()
      });
    }

    storageService.saveInfluencers(updatedInfluencers);
    storageService.logActivity(`AI message generation complete for all qualified influencers`);
    return updatedInfluencers;
  }

  /**
   * Generates dynamic Email pitch (60-90 words) and Instagram DM (15-30 words)
   */
  async generatePersonalizedMessages(inf, campaign = {}) {
    const cfg = { ...this.defaultCampaign, ...campaign };

    // 1. Check for live Gemini or OpenAI API keys
    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    if (geminiKey) {
      try {
        const result = await this.callGeminiApi(inf, cfg, geminiKey);
        if (result) return result;
      } catch (err) {
        storageService.logActivity(`Gemini API error (${err.message}). Using local AI personalization engine.`, 'warn');
      }
    } else if (openaiKey) {
      try {
        const result = await this.callOpenAIApi(inf, cfg, openaiKey);
        if (result) return result;
      } catch (err) {
        storageService.logActivity(`OpenAI API error (${err.message}). Using local AI personalization engine.`, 'warn');
      }
    }

    // 2. High-performance intelligent dynamic personalization engine
    return this.generateDynamicTemplate(inf, cfg);
  }

  /**
   * Dynamic prompt-engineered message generator with strict length enforcement
   */
  generateDynamicTemplate(inf, cfg) {
    const firstName = (inf.name || 'there').split(' ')[0];
    const themeHighlight = (inf.contentThemes && inf.contentThemes[0]) || inf.niche;
    
    // Format recent content hook concisely
    let recentHook = inf.recentContent || `creative work around ${themeHighlight}`;
    if (recentHook.length > 55) {
      const trimmed = recentHook.slice(0, 52);
      const lastSpace = trimmed.lastIndexOf(' ');
      recentHook = (lastSpace > 30 ? trimmed.slice(0, lastSpace) : trimmed) + '...';
    }

    const collabType = cfg.collaborationType || 'UGC content creation';
    const angleCopy = this.getCollaborationAngleCopy(collabType, cfg, inf);

    // Subject lines tailored per angle
    let emailSubject = '';
    switch (collabType) {
      case 'UGC content creation':
        emailSubject = `Collab Inquiry: ${cfg.brandName} x ${firstName} (${themeHighlight})`;
        break;
      case 'Sponsorship':
        emailSubject = `Paid Sponsorship: ${cfg.brandName} x ${firstName}`;
        break;
      case 'Brand ambassador program':
        emailSubject = `Ambassador Invitation: ${cfg.brandName} x ${firstName}`;
        break;
      case 'Affiliate campaign':
        emailSubject = `Partnership Proposal: ${cfg.brandName} x ${firstName}`;
        break;
      case 'Paid product placement':
        emailSubject = `Feature Proposal: ${cfg.brandName} x ${firstName}`;
        break;
      case 'Barter collaboration':
        emailSubject = `Gifting & Collab: ${cfg.brandName} x ${firstName}`;
        break;
      default:
        emailSubject = `Collab Inquiry: ${cfg.brandName} x ${firstName}`;
    }

    // Assemble dynamic email body
    let emailBody = this.assembleCalibratedEmail({
      firstName,
      recentHook,
      themeHighlight,
      niche: inf.niche,
      brandName: cfg.brandName,
      productName: cfg.productName,
      angleDescription: angleCopy.description,
      valueProp: angleCopy.valueProp || cfg.valueProposition,
      cta: angleCopy.cta,
      senderName: cfg.senderName,
      contentStyle: inf.contentStyle
    });

    // Assemble dynamic Instagram DM (15 - 30 words)
    let dmText = this.assembleCalibratedDm({
      firstName,
      themeHighlight,
      niche: inf.niche,
      brandName: cfg.brandName,
      collabType,
      recentHook
    });

    const emailWordCount = this.countWords(emailBody);
    const dmWordCount = this.countWords(dmText);

    return {
      email: {
        subject: emailSubject,
        body: emailBody,
        wordCount: emailWordCount,
        isValidLength: emailWordCount >= 60 && emailWordCount <= 90,
        collaborationType: collabType,
        brandName: cfg.brandName
      },
      instagramDm: {
        text: dmText,
        wordCount: dmWordCount,
        isValidLength: dmWordCount >= 15 && dmWordCount <= 30
      },
      personalizationSignals: {
        influencerNiche: inf.niche,
        referencedRecentContent: inf.recentContent || 'Recent publications',
        contentStyle: inf.contentStyle || 'Relatable & Engaging',
        audienceContext: inf.audienceGeography || 'Target Demographics',
        collaborationAngle: collabType
      }
    };
  }

  /**
   * Angle-specific phrasing
   */
  getCollaborationAngleCopy(collabType, cfg, inf) {
    switch (collabType) {
      case 'UGC content creation':
        return {
          description: `launching a targeted UGC campaign for our ${cfg.productName}`,
          valueProp: `We offer a competitive creator rate plus our complete product range`,
          cta: `Would you be open to reviewing our brief and rates this week?`
        };
      case 'Brand ambassador program':
        return {
          description: `welcoming select long-term ambassadors for our ${cfg.productName}`,
          valueProp: `We provide monthly creator retainers and full product gifting`,
          cta: `Could we send over our ambassador terms to review together?`
        };
      case 'Affiliate campaign':
        return {
          description: `expanding our affiliate program for our ${cfg.productName}`,
          valueProp: `We provide high commission tiers and complimentary welcome packages`,
          cta: `Would you like to test the products and join our creator roster?`
        };
      case 'Paid product placement':
        return {
          description: `booking dedicated product placements featuring our ${cfg.productName}`,
          valueProp: `We offer flexible placement fees and priority product shipments`,
          cta: `Could we review your upcoming content calendar for possible integration?`
        };
      case 'Barter collaboration':
        return {
          description: `partnering on gifted collaborations showcasing our ${cfg.productName}`,
          valueProp: `We provide full complimentary product suites with zero posting pressure`,
          cta: `Would you like us to dispatch your personalized package this week?`
        };
      case 'Sponsorship':
      default:
        return {
          description: `securing an integrated sponsorship for our ${cfg.productName}`,
          valueProp: `We offer competitive upfront sponsorship compensation and sample kits`,
          cta: `Are you currently accepting sponsored collaborations for your upcoming schedule?`
        };
    }
  }

  /**
   * Assembles email pitch strictly calibrated to 60 - 90 words
   */
  assembleCalibratedEmail(data) {
    // Base composition
    const p1 = `Hi ${data.firstName},\n\nLoved your recent content on ${data.recentHook}. Your authentic focus on ${data.themeHighlight} genuinely stands out.`;
    const p2 = `At ${data.brandName}, we’re ${data.angleDescription}. Given your engaged ${data.niche} audience, you would be a wonderful fit.`;
    const p3 = `${data.valueProp}. ${data.cta}`;
    const signoff = `Best,\n${data.senderName}`;

    let email = `${p1}\n\n${p2}\n\n${p3}\n\n${signoff}`;
    let words = this.countWords(email);

    // If slightly under 60 words, append an audience appreciation phrase
    if (words < 60) {
      const extraSentence = `Your community's thoughtful engagement is inspiring.`;
      const p3Expanded = `${data.valueProp}. ${extraSentence} ${data.cta}`;
      email = `${p1}\n\n${p2}\n\n${p3Expanded}\n\n${signoff}`;
      words = this.countWords(email);
    }

    // If still under 60 words
    if (words < 60) {
      const extraP = `We really appreciate your unique creator perspective.`;
      email = `${p1}\n\n${p2} ${extraP}\n\n${p3}\n\n${signoff}`;
    }

    // If over 90 words (trim excess)
    if (words > 90) {
      const tightP1 = `Hi ${data.firstName},\n\nLoved your recent breakdown of ${data.recentHook}.`;
      email = `${tightP1}\n\n${p2}\n\n${p3}\n\n${signoff}`;
    }

    return email;
  }

  /**
   * Assembles Instagram DM strictly calibrated to 15 - 30 words
   */
  assembleCalibratedDm(data) {
    let hookSnippet = data.recentHook;
    if (hookSnippet.length > 28) {
      hookSnippet = hookSnippet.slice(0, 25) + '...';
    }

    let dm = '';
    if (data.collabType === 'UGC content creation') {
      dm = `Hi ${data.firstName}, loved your recent take on ${hookSnippet}! Your ${data.niche} audience looks like a great fit for our upcoming UGC campaign. Sent you an email!`;
    } else if (data.collabType === 'Brand ambassador program') {
      dm = `Hi ${data.firstName}, your recent post on ${hookSnippet} was fantastic. We’d love to invite you as a brand ambassador for ${data.brandName}. Check your inbox!`;
    } else {
      dm = `Hi ${data.firstName}, really enjoyed your recent content on ${hookSnippet}. Your style is perfect for a ${data.brandName} collaboration. Dropped details to your email!`;
    }

    let words = this.countWords(dm);

    // If over 30 words, tighten
    if (words > 30) {
      dm = `Hi ${data.firstName}, loved your recent work on ${data.themeHighlight}! Your ${data.niche} audience is a great fit for ${data.brandName}. Sent you an email collaboration pitch!`;
    }

    // If under 15 words, lengthen
    if (this.countWords(dm) < 15) {
      dm = `Hi ${data.firstName}, loved your recent post on ${hookSnippet}! Your engaged audience is an ideal fit for our ${data.brandName} campaign. Sent you an email!`;
    }

    return dm;
  }

  /**
   * Gemini API call (optional external LLM)
   */
  async callGeminiApi(inf, cfg, apiKey) {
    const prompt = this.buildLLMPrompt(inf, cfg);
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    
    const response = await axios.post(
      url,
      {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.7 }
      },
      { timeout: 10000 }
    );

    const raw = response.data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;
    return this.parseAndValidateLLMResponse(raw, inf, cfg);
  }

  /**
   * OpenAI API call (optional external LLM)
   */
  async callOpenAIApi(inf, cfg, apiKey) {
    const prompt = this.buildLLMPrompt(inf, cfg);
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.7
      },
      {
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        timeout: 10000
      }
    );

    const raw = response.data.choices?.[0]?.message?.content;
    if (!raw) return null;
    return this.parseAndValidateLLMResponse(raw, inf, cfg);
  }

  buildLLMPrompt(inf, cfg) {
    return `You are an elite influencer marketing specialist.
Write two personalized outreach messages for micro-influencer:
Name: ${inf.name}
Niche: ${inf.niche}
Recent Content: "${inf.recentContent || ''}"
Content Themes: ${(inf.contentThemes || []).join(', ')}
Campaign: ${cfg.brandName} (${cfg.productName})
Angle: ${cfg.collaborationType}
Value Prop: ${cfg.valueProposition}
Sender: ${cfg.senderName} (${cfg.senderRole})

CRITICAL CONSTRAINTS:
1. emailBody: MUST be strictly between 60 and 90 words.
2. instagramDm: MUST be strictly between 15 and 30 words.
Return JSON:
{
  "emailSubject": "string",
  "emailBody": "string",
  "instagramDm": "string"
}`;
  }

  parseAndValidateLLMResponse(rawText, inf, cfg) {
    const parsed = JSON.parse(rawText);
    const emailWords = this.countWords(parsed.emailBody);
    const dmWords = this.countWords(parsed.instagramDm);

    // If LLM violated length, fall back to calibrated dynamic template
    if (emailWords < 60 || emailWords > 90 || dmWords < 15 || dmWords > 30) {
      storageService.logActivity(
        `LLM response word count (${emailWords} email, ${dmWords} DM) outside target range. Applying calibrated template.`,
        'warn'
      );
      return this.generateDynamicTemplate(inf, cfg);
    }

    return {
      email: {
        subject: parsed.emailSubject,
        body: parsed.emailBody,
        wordCount: emailWords,
        isValidLength: true,
        collaborationType: cfg.collaborationType,
        brandName: cfg.brandName
      },
      instagramDm: {
        text: parsed.instagramDm,
        wordCount: dmWords,
        isValidLength: true
      },
      personalizationSignals: {
        influencerNiche: inf.niche,
        referencedRecentContent: inf.recentContent,
        contentStyle: inf.contentStyle,
        collaborationAngle: cfg.collaborationType
      }
    };
  }
}

module.exports = new AIService();
