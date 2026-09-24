const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_DIR = path.join(__dirname, 'data');
const QUESTIONS_FILE = path.join(DATA_DIR, 'questions.json');
const SUBMISSIONS_FILE = path.join(DATA_DIR, 'submissions.json');
const CONFIG_FILE = path.join(DATA_DIR, 'config.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

try {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify([], null, 2));
  }
} catch (e) {
  // Read-only filesystem in serverless environments (e.g. Vercel) is normal
}

function loadConfig() {
  let fileConfig = {};
  if (fs.existsSync(CONFIG_FILE)) {
    try {
      fileConfig = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    } catch (e) {
      console.error('Error reading config.json:', e);
    }
  }
  return {
    discordWebhookUrl: fileConfig.discordWebhookUrl || process.env.DISCORD_WEBHOOK_URL || '',
    adminPassword: fileConfig.adminPassword || process.env.ADMIN_PASSWORD || 'admin123',
    throneUrl: fileConfig.throneUrl || 'https://throne.me/'
  };
}

function saveConfig(newConfig) {
  const current = loadConfig();
  const updated = { ...current, ...newConfig };
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

// Support large image uploads up to 15MB
app.use(cors());
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Prevent stale caching of profile.jpg and scripts
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, 'public')));

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  const config = loadConfig();
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization required' });
  }
  const token = authHeader.split(' ')[1];
  if (token !== config.adminPassword) {
    return res.status(403).json({ error: 'Invalid password' });
  }
  next();
}

function isValidCoherentText(text, minLength = 20, minWords = 4) {
  if (!text || typeof text !== 'string') return false;
  const trimmed = text.trim();
  if (trimmed.length < minLength) return false;

  const words = trimmed.split(/\s+/).filter(w => w.length > 1);
  if (words.length < minWords) return false;

  if (/(.)\1{4,}/.test(trimmed)) return false;

  const letters = trimmed.replace(/[^a-zA-Z]/g, '');
  if (letters.length >= 15) {
    const vowels = trimmed.replace(/[^aeiouAEIOU]/g, '');
    const ratio = vowels.length / letters.length;
    if (ratio < 0.15 || ratio > 0.85) return false;
  }

  return true;
}

app.get('/api/questions', (req, res) => {
  try {
    if (fs.existsSync(QUESTIONS_FILE)) {
      const data = fs.readFileSync(QUESTIONS_FILE, 'utf8');
      return res.json(JSON.parse(data));
    }
    res.status(404).json({ error: 'Questions file not found' });
  } catch (err) {
    console.error('Error loading questions:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper: send Discord embed, optionally with image attachment
async function sendToDiscord(submission, webhookUrl, proofFilePath = null, directBuffer = null) {
  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return { sent: false, reason: 'Discord Webhook URL not configured' };
  }

  const d = submission.data || {};
  const throneLink = loadConfig().throneUrl;

  const payChannels = Array.isArray(d.paymentMethods) ? d.paymentMethods.join(', ') : (d.paymentMethods || '_None_');

  const fields = [
    {
      name: '👑 Devotee Identity',
      value: `• **Slave Nick:** **${d.slaveName || 'Anonymous'}**\n• **Discord:** \`${d.discordTag || 'Not provided'}\`\n• **Phone / WhatsApp:** \`${d.phoneWhatsapp || 'None'}\`\n• **Telegram:** \`${d.telegramHandle || 'None'}\`\n• **Age / Country:** ${d.age || '18+'} yrs • ${d.country || 'Unknown'}\n• **Occupation:** ${d.occupation || 'Unspecified'}`,
      inline: false
    },
    {
      name: '💰 Financial Surrender Profile',
      value: `• **Monthly Budget:** 💎 **${d.monthlyBudget || 'Not specified'}**\n• **Disposable Income Tier:** ${d.savingsSacrifice || 'Standard'}\n• **Net Monthly Income:** ${d.netMonthlyIncome || 'Undisclosed'}\n• **Lifetime Sent (All Goddesses):** ${d.totalSentPast || 'First time'}\n• **Payment Channels:** ${payChannels}`,
      inline: false
    },
    {
      name: '⚡ Obsession & Submission Dynamic',
      value: `• **Dynamic:** ⚡ **${d.devotionType || 'Not specified'}**\n• **Obsession Intensity:** 🔥 **${d.obsessionLevel || '?'}/10**\n• **Findom Experience:** ${d.findomExperience || 'Unspecified'}`,
      inline: true
    },
    {
      name: '🎯 Milestone & Schedule',
      value: `• **Lifetime Throne Goal:** 🎯 **${d.tributeMilestone || 'Not declared'}**\n• **Worship Ritual:** ${d.worshipRitual || 'Standard'}\n• **Tribute Frequency:** ${d.tributeFrequency || 'Flexible'}\n• **Check-in Frequency:** ${d.checkInFrequency || 'On demand'}`,
      inline: true
    },
    {
      name: '⚖️ Discipline, Vows & Penalties',
      value: `• **Spending Oversight:** ${d.spendingApproval || 'Standard'}\n• **Late Penalty Fee:** ⚡ **${d.delayPenalty || 'Standard'}**\n• **Doubt Protocol:** ${d.relapseProtocol || 'Standard'}\n• **Submission Aspiration:** ${d.financialControlDepth || 'Standard'}\n• **Code of Devotion:** \`${d.silenceRule || 'Yes'}\`\n• **Blacklist Clause:** \`${d.blacklistConsent || 'Agreed'}\``,
      inline: false
    },
    {
      name: '🧾 Initial Tribute Status',
      value: `${d.initialTributeStatus || 'Pending verification'}${d.tributeTxId ? ` • Ref: \`${d.tributeTxId}\`` : ''}`,
      inline: false
    }
  ];

  if (d.goddessEffect) {
    const effects = Array.isArray(d.goddessEffect) ? d.goddessEffect : [d.goddessEffect];
    fields.push({
      name: '💓 Effect Goddess Has On Devotee',
      value: effects.join(' | '),
      inline: false
    });
  }

  if (d.humiliationTasks) {
    const tasks = Array.isArray(d.humiliationTasks) ? d.humiliationTasks : [d.humiliationTasks];
    fields.push({
      name: '🔗 Humiliation Tasks Accepted',
      value: tasks.join('\n• '),
      inline: false
    });
  }

  if (d.weaknesses) {
    fields.push({
      name: '🎯 Psychological Triggers & Cravings',
      value: `*${d.weaknesses.slice(0, 500)}*`,
      inline: false
    });
  }

  if (d.financialConfession) {
    fields.push({
      name: '🕯️ Financial Confession',
      value: `>>> *"${d.financialConfession.slice(0, 700)}"*`,
      inline: false
    });
  }

  if (d.dreamRitual) {
    fields.push({
      name: '💭 Dream Worship Session',
      value: `*${d.dreamRitual.slice(0, 400)}*`,
      inline: false
    });
  }

  if (d.letter) {
    fields.push({
      name: '📜 Devotion Letter to the Throne',
      value: `>>> *"${d.letter.slice(0, 950)}"*`,
      inline: false
    });
  }

  if (d.boundaries) {
    fields.push({
      name: '⛔ Boundaries / Limits',
      value: `\`\`\`\n${d.boundaries.slice(0, 500)}\n\`\`\``,
      inline: false
    });
  }

  const embed = {
    title: '👑 NEW DEVOTEE APPLICATION RECEIVED 💸',
    description: `A new submissive has completed the formal 9-stage submission protocol for Goddess Dahlia's Throne.\n[👉 **Direct Throne Wishlist**](${throneLink})`,
    color: 0xD4AF37,
    fields: fields,
    thumbnail: {
      url: 'https://cdn-icons-png.flaticon.com/512/2618/2618245.png'
    },
    footer: {
      text: `Protocol ID: ${submission.id} • Goddess Dahlia Sanctuary`
    },
    timestamp: new Date().toISOString()
  };

  const hasImage = Boolean(directBuffer || (proofFilePath && fs.existsSync(proofFilePath)));
  if (hasImage) {
    embed.image = { url: 'attachment://proof.jpg' };
  }

  try {
    let response;

    if (hasImage) {
      const fileBuffer = directBuffer || fs.readFileSync(proofFilePath);
      const formData = new FormData();
      formData.append('payload_json', JSON.stringify({
        username: 'Goddess Dahlia Bot',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/2618/2618245.png',
        embeds: [embed]
      }));
      formData.append('files[0]', new Blob([fileBuffer], { type: 'image/jpeg' }), 'proof.jpg');

      response = await fetch(webhookUrl, {
        method: 'POST',
        body: formData
      });
    } else {
      response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'Goddess Dahlia Bot',
          avatar_url: 'https://cdn-icons-png.flaticon.com/512/2618/2618245.png',
          embeds: [embed]
        })
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('Discord API response error:', response.status, errText);
      return { sent: false, reason: `Discord status ${response.status}: ${errText}` };
    }
    return { sent: true };
  } catch (err) {
    console.error('Error sending Discord webhook:', err);
    return { sent: false, reason: err.message };
  }
}

app.post('/api/submit', async (req, res) => {
  try {
    const formData = req.body;

    if (!formData.slaveName || formData.slaveName.trim().length < 3) {
      return res.status(400).json({ error: 'Please provide a valid devotee name (minimum 3 characters).' });
    }

    if (!formData.discordTag || formData.discordTag.trim().length < 3) {
      return res.status(400).json({ error: 'A valid Discord username/handle is required.' });
    }

    const ageNum = parseInt(formData.age, 10);
    if (isNaN(ageNum) || ageNum < 18 || ageNum > 99) {
      return res.status(400).json({ error: 'You must be at least 18 years of age to submit.' });
    }

    if (!formData.occupation || formData.occupation.trim().length < 3) {
      return res.status(400).json({ error: 'Please enter a genuine occupation or source of income.' });
    }

    if (!formData.monthlyBudget) {
      return res.status(400).json({ error: 'Please select your monthly tribute tier.' });
    }

    if (!formData.phoneWhatsapp || formData.phoneWhatsapp.trim().length < 7) {
      return res.status(400).json({ error: 'A valid phone/WhatsApp contact is required.' });
    }

    if (!formData.proofImage) {
      return res.status(400).json({ error: 'Selfie verification photo is strictly required.' });
    }

    if (!isValidCoherentText(formData.letter, 30, 5)) {
      return res.status(400).json({
        error: 'Your letter of devotion must be a coherent, meaningful statement (minimum 30 characters and complete words). Random keystrokes or spam will not be received by the Throne.'
      });
    }

    const submissionId = 'SUB-' + Date.now().toString(36).toUpperCase() + Math.random().toString(36).substring(2, 5).toUpperCase();

    // Check if proof image was uploaded in base64
    let proofFilePath = null;
    let proofFileUrl = null;
    let imageBuffer = null;
    if (formData.proofImage && formData.proofImage.startsWith('data:image/')) {
      try {
        const matches = formData.proofImage.match(/^data:image\/([a-zA-Z0-9]+);base64,(.+)$/);
        if (matches) {
          const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          imageBuffer = Buffer.from(matches[2], 'base64');
          const fileName = `proof-${submissionId}.${ext}`;
          proofFilePath = path.join(UPLOADS_DIR, fileName);
          try {
            fs.writeFileSync(proofFilePath, imageBuffer);
            proofFileUrl = `/uploads/${fileName}`;
          } catch (e) {
            // Read-only filesystem in serverless environments (Vercel) is normal
          }
        }
      } catch (err) {
        console.error('Error saving proof image:', err);
      }
    }

    // Strip raw base64 from stored json to save memory, save file url instead
    const cleanedData = { ...formData };
    delete cleanedData.proofImage;
    if (proofFileUrl) {
      cleanedData.proofImageUrl = proofFileUrl;
    }

    const submission = {
      id: submissionId,
      createdAt: new Date().toISOString(),
      data: cleanedData
    };

    let submissions = [];
    try {
      if (fs.existsSync(SUBMISSIONS_FILE)) {
        submissions = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
      }
      submissions.unshift(submission);
      fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
    } catch (e) {
      // Local disk writing is skipped gracefully on serverless environments
    }

    const config = loadConfig();
    const discordResult = await sendToDiscord(submission, config.discordWebhookUrl, proofFilePath, imageBuffer);

    res.json({
      success: true,
      message: 'Your submission protocol has been formally delivered to the Throne.',
      id: submission.id,
      discordNotification: discordResult,
      throneUrl: config.throneUrl
    });
  } catch (err) {
    console.error('Error saving submission:', err);
    res.status(500).json({ error: 'Server error while delivering the protocol.' });
  }
});

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const config = loadConfig();
  if (password === config.adminPassword) {
    return res.json({ success: true, token: config.adminPassword });
  }
  return res.status(401).json({ error: 'Invalid master key' });
});

app.get('/api/admin/submissions', requireAdmin, (req, res) => {
  try {
    const submissions = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
    res.json(submissions);
  } catch (e) {
    res.status(500).json({ error: 'Error reading submissions' });
  }
});

app.delete('/api/admin/submissions/:id', requireAdmin, (req, res) => {
  try {
    const id = req.params.id;
    let submissions = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
    submissions = submissions.filter(s => s.id !== id);
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2));
    res.json({ success: true, message: 'Submission deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Error deleting submission' });
  }
});

app.get('/api/admin/export-csv', (req, res) => {
  const token = req.query.token;
  const config = loadConfig();
  if (token !== config.adminPassword) {
    return res.status(403).send('Unauthorized');
  }

  try {
    const submissions = JSON.parse(fs.readFileSync(SUBMISSIONS_FILE, 'utf8'));
    if (submissions.length === 0) {
      return res.status(400).send('No submissions available for export.');
    }

    const headers = [
      'Protocol ID',
      'Timestamp',
      'Slave Nickname',
      'Discord Tag',
      'Alt Contact',
      'Age',
      'Occupation',
      'Monthly Budget',
      'Payment Methods',
      'Income Surrender',
      'Lifetime Goal',
      'Occasion Tributes',
      'Spending Control',
      'Worship Ritual',
      'Check-in Frequency',
      'Initial Tribute Status',
      'Transaction Ref',
      'Proof Image URL',
      'Weaknesses',
      'Devotion Letter',
      'Boundaries'
    ];
    
    const rows = submissions.map(s => {
      const d = s.data || {};
      const escape = (str) => {
        if (!str) return '""';
        return `"${String(str).replace(/"/g, '""')}"`;
      };

      const payMethods = Array.isArray(d.paymentMethods) ? d.paymentMethods.join(', ') : (d.paymentMethods || '');

      return [
        escape(s.id),
        escape(new Date(s.createdAt).toISOString()),
        escape(d.slaveName),
        escape(d.discordTag),
        escape(d.altContact),
        escape(d.age),
        escape(d.occupation),
        escape(d.monthlyBudget),
        escape(payMethods),
        escape(d.savingsSacrifice),
        escape(d.tributeMilestone),
        escape(d.specialOccasions),
        escape(d.spendingApproval),
        escape(d.worshipRitual),
        escape(d.checkInFrequency),
        escape(d.initialTributeStatus),
        escape(d.tributeTxId),
        escape(d.proofImageUrl),
        escape(d.weaknesses),
        escape(d.letter),
        escape(d.boundaries)
      ].join(';');
    });

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename=goddess-dahlia-submissions.csv');
    return res.send(csvContent);
  } catch (e) {
    console.error('Error exporting CSV:', e);
    res.status(500).send('Error exporting CSV');
  }
});

app.get('/api/admin/config', requireAdmin, (req, res) => {
  const config = loadConfig();
  res.json({
    webhookConfigured: Boolean(config.discordWebhookUrl && config.discordWebhookUrl.trim()),
    discordWebhookUrl: config.discordWebhookUrl || '',
    throneUrl: config.throneUrl || 'https://throne.me/'
  });
});

app.post('/api/admin/config', requireAdmin, (req, res) => {
  const { discordWebhookUrl, newPassword, throneUrl } = req.body;
  const updates = {};
  if (discordWebhookUrl !== undefined) {
    updates.discordWebhookUrl = discordWebhookUrl.trim();
  }
  if (newPassword && newPassword.trim().length >= 4) {
    updates.adminPassword = newPassword.trim();
  }
  if (throneUrl !== undefined) {
    updates.throneUrl = throneUrl.trim();
  }
  const updated = saveConfig(updates);
  res.json({
    success: true,
    message: 'Configuration updated successfully',
    webhookConfigured: Boolean(updated.discordWebhookUrl)
  });
});

app.post('/api/admin/test-discord', requireAdmin, async (req, res) => {
  const { webhookUrl } = req.body;
  const targetUrl = webhookUrl || loadConfig().discordWebhookUrl;

  if (!targetUrl || !targetUrl.startsWith('http')) {
    return res.status(400).json({ error: 'Missing or invalid Webhook URL.' });
  }

  const testSubmission = {
    id: 'TEST-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
    createdAt: new Date().toISOString(),
    data: {
      slaveName: 'Devotee #01 (Test)',
      discordTag: '@devotee_test#1234',
      altContact: '@telegram_paypig',
      age: '28',
      occupation: 'Software Engineer',
      monthlyBudget: '500€ - 1.000€ / month (Personal Servant)',
      paymentMethods: ['Revolut', 'PayPal', 'Throne'],
      savingsSacrifice: '50% - 75% of discretionary income',
      tributeFrequency: 'Weekly scheduled tributes',
      devotionType: 'Drain Sessions & Financial Worship',
      tributeMilestone: '5,000€ Gold Slave Milestone',
      specialOccasions: 'Goddess Birthday & Payday Surrender',
      spendingApproval: 'Full Financial Accountability',
      worshipRitual: 'Morning Wake-Up Tribute & Paycheck Drain',
      checkInFrequency: 'Daily Morning & Evening check-ins',
      initialTributeStatus: 'Tribute Sent on Throne (Verified)',
      tributeTxId: 'THRONE-REF-884920',
      weaknesses: 'Impulsive spending, craving strict financial boundaries and discipline',
      letter: 'My Goddess Dahlia, I surrender my resources to your absolute sovereignty. I exist to honor your Throne.',
      boundaries: 'Standard roleplay boundaries respect.'
    }
  };

  const result = await sendToDiscord(testSubmission, targetUrl);
  if (result.sent) {
    return res.json({ success: true, message: 'Test embed dispatched to Discord successfully! Check your channel.' });
  } else {
    return res.status(500).json({ error: `Delivery failed: ${result.reason}` });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`👑 Goddess Dahlia Submission Protocol Online!`);
    console.log(`💸 Form URL:   http://localhost:${PORT}`);
    console.log(`⚙️  Throne Admin: http://localhost:${PORT}/admin.html`);
    console.log(`===============================================`);
  });
}

module.exports = app;
