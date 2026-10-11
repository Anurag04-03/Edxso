const nodemailer = require('nodemailer');
const storageService = require('./storageService');

class SendingService {
  constructor() {
    this.etherealTransporter = null;
  }

  /**
   * Initializes or returns test Ethereal transporter
   */
  async getEtherealTransporter() {
    if (!this.etherealTransporter) {
      try {
        const testAccount = await nodemailer.createTestAccount();
        this.etherealTransporter = nodemailer.createTransport({
          host: 'smtp.ethereal.email',
          port: 587,
          secure: false,
          auth: {
            user: testAccount.user,
            pass: testAccount.pass
          }
        });
        storageService.logActivity(`Ethereal test mailbox provisioned: ${testAccount.user}`);
      } catch (err) {
        storageService.logActivity(`Could not create Ethereal account: ${err.message}. Falling back to simulation.`, 'warn');
        return null;
      }
    }
    return this.etherealTransporter;
  }

  /**
   * Returns live custom SMTP transporter if configured in env
   */
  getSmtpTransporter() {
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
      return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_PORT === '465',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });
    }
    return null;
  }

  /**
   * Execute email outreach for qualified influencers with valid email
   */
  async sendEmailBatch(influencers, options = {}) {
    const { mode = 'ethereal', senderEmail = 'partnerships@glowmatrix.com' } = options;
    storageService.logActivity(`Initiating Email Outreach Batch (Mode: ${mode})`);

    const tracker = storageService.getOutreachTracker();
    const results = [];

    // Filter to influencers who have passed and have valid email
    const eligibleInfluencers = influencers.filter(
      (inf) => inf.filterStatus === 'PASSED' && inf.contactEmail && inf.contactEmail !== 'Not Found'
    );

    if (eligibleInfluencers.length === 0) {
      storageService.logActivity('No eligible influencers with valid contact email to send.', 'warn');
      return { total: 0, sent: 0, skippedDuplicates: 0, results: [] };
    }

    let transporter = null;
    if (mode === 'smtp') {
      transporter = this.getSmtpTransporter();
      if (!transporter) {
        storageService.logActivity('SMTP settings not found in .env. Falling back to Ethereal mode.', 'warn');
        transporter = await this.getEtherealTransporter();
      }
    } else if (mode === 'ethereal') {
      transporter = await this.getEtherealTransporter();
    }

    let sentCount = 0;
    let duplicateCount = 0;

    for (const inf of eligibleInfluencers) {
      // 1. DUPLICATE CHECK
      const isDuplicate = tracker.some(
        (entry) =>
          (entry.influencerId === inf.id || (entry.email && entry.email.toLowerCase() === inf.contactEmail.toLowerCase())) &&
          (entry.status === 'SENT' || entry.status === 'SIMULATED')
      );

      if (isDuplicate) {
        duplicateCount++;
        storageService.logActivity(`Duplicate outreach prevented for ${inf.name} (${inf.contactEmail})`, 'warn');
        results.push({
          influencerId: inf.id,
          influencerName: inf.name,
          email: inf.contactEmail,
          status: 'DUPLICATE_PREVENTED',
          notes: 'Already contacted in existing outreach record'
        });
        continue;
      }

      // 2. RETRIEVE PERSONALIZED MESSAGE
      const outreachEmail = inf.outreach?.email || {
        subject: `Partnership Inquiry: GlowMatrix x ${inf.name.split(' ')[0]}`,
        body: `Hi ${inf.name.split(' ')[0]},\n\nLoved your recent content. We would love to collaborate with you.`
      };

      // 3. SEND OR SIMULATE
      let sendResult = null;
      const mailOptions = {
        from: `"Creator Partnerships" <${senderEmail}>`,
        to: inf.contactEmail,
        subject: outreachEmail.subject,
        text: outreachEmail.body,
        html: `<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 600px; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px;">
          ${outreachEmail.body.replace(/\n/g, '<br/>')}
        </div>`
      };

      try {
        if (transporter) {
          const info = await transporter.sendMail(mailOptions);
          const previewUrl = nodemailer.getTestMessageUrl(info) || null;
          sendResult = {
            messageId: info.messageId,
            previewUrl,
            status: 'SENT'
          };
        } else {
          // Simulation fallback
          sendResult = {
            messageId: `<sim-${Date.now()}-${Math.random().toString(36).substr(2, 6)}@glowmatrix.com>`,
            previewUrl: null,
            status: 'SIMULATED'
          };
        }

        sentCount++;
        const record = {
          influencerId: inf.id,
          influencerName: inf.name,
          platform: inf.platform,
          email: inf.contactEmail,
          emailSubject: outreachEmail.subject,
          emailWordCount: outreachEmail.wordCount || 0,
          collaborationType: outreachEmail.collaborationType || 'UGC content creation',
          messageGenerated: true,
          sent: true,
          sentDate: new Date().toISOString(),
          status: sendResult.status,
          messageId: sendResult.messageId,
          previewUrl: sendResult.previewUrl,
          notes: sendResult.previewUrl ? `Ethereal Web Preview: ${sendResult.previewUrl}` : 'Dispatched via simulated queue'
        };

        storageService.recordOutreachEntry(record);
        results.push(record);
      } catch (sendErr) {
        storageService.logActivity(`Failed to send to ${inf.contactEmail}: ${sendErr.message}`, 'error');
        const failedRecord = {
          influencerId: inf.id,
          influencerName: inf.name,
          platform: inf.platform,
          email: inf.contactEmail,
          sent: false,
          status: 'FAILED',
          notes: sendErr.message
        };
        storageService.recordOutreachEntry(failedRecord);
        results.push(failedRecord);
      }
    }

    storageService.logActivity(
      `Email outreach run complete: ${sentCount} sent, ${duplicateCount} duplicates prevented`
    );

    return {
      totalEligible: eligibleInfluencers.length,
      sentCount,
      duplicateCount,
      results
    };
  }

  /**
   * Process Instagram DM manual / simulated workflow
   */
  async processInstagramDmAction(influencerId, action = 'MARK_SENT') {
    const influencers = storageService.getInfluencers();
    const inf = influencers.find((i) => i.id === influencerId);
    if (!inf) {
      throw new Error('Influencer not found');
    }

    const tracker = storageService.getOutreachTracker();
    const existingIndex = tracker.findIndex((item) => item.influencerId === influencerId && item.channel === 'Instagram_DM');

    const entry = {
      influencerId: inf.id,
      influencerName: inf.name,
      platform: 'Instagram',
      channel: 'Instagram_DM',
      handle: inf.handle,
      profileUrl: inf.profileUrl,
      dmText: inf.outreach?.instagramDm?.text || 'Hi! Loved your recent content.',
      dmWordCount: inf.outreach?.instagramDm?.wordCount || 0,
      sent: action === 'MARK_SENT',
      status: action === 'MARK_SENT' ? 'MANUALLY_SENT' : 'PENDING',
      sentDate: action === 'MARK_SENT' ? new Date().toISOString() : null,
      notes: action === 'MARK_SENT' ? 'Outreach completed via Instagram Direct Message workflow' : 'Pending manual dispatch'
    };

    if (existingIndex >= 0) {
      tracker[existingIndex] = { ...tracker[existingIndex], ...entry };
    } else {
      tracker.unshift(entry);
    }

    storageService.saveOutreachTracker(tracker);
    storageService.logActivity(`Instagram DM updated for ${inf.name} (${entry.status})`);
    return entry;
  }
}

module.exports = new SendingService();
