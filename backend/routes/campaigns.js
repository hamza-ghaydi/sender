const express = require("express");
const router = express.Router();
const nodemailer = require("nodemailer");
const { 
  getAllCampaigns, 
  createCampaign, 
  updateCampaign, 
  deleteCampaign,
  getCampaign,
  startCampaign,
  completeCampaign,
  addCampaignEmails,
  getCampaignEmails,
  updateCampaignEmailStatus,
  getEmailListItems,
  getSmtpProfile,
  getSettings,
  getTodayEmailCount,
  getTodayCampaignEmailCount
} = require("../database/db");

// Get all campaigns
router.get("/", async (req, res) => {
  try {
    const campaigns = await getAllCampaigns();
    res.json({ success: true, campaigns });
  } catch (error) {
    console.error("Error getting campaigns:", error);
    res.status(500).json({ error: "Failed to get campaigns" });
  }
});

// Get single campaign
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const campaign = await getCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    res.json({ success: true, campaign });
  } catch (error) {
    console.error("Error getting campaign:", error);
    res.status(500).json({ error: "Failed to get campaign" });
  }
});

// Create new campaign
router.post("/", async (req, res) => {
  try {
    const { name, subject, template, list_id, smtp_profile_id } = req.body;
    
    if (!name || !subject || !template || !list_id || !smtp_profile_id) {
      return res.status(400).json({ error: "Missing required campaign fields" });
    }

    const campaign = {
      name: name.trim(),
      subject: subject.trim(),
      template: template.trim(),
      list_id: parseInt(list_id),
      smtp_profile_id: parseInt(smtp_profile_id)
    };

    const result = await createCampaign(campaign);
    res.json({ success: true, message: "Campaign created successfully", campaign: result });
  } catch (error) {
    console.error("Error creating campaign:", error);
    res.status(500).json({ error: "Failed to create campaign" });
  }
});

// Update campaign
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, subject, template, list_id, smtp_profile_id, status } = req.body;
    
    if (!name || !subject || !template || !list_id || !smtp_profile_id) {
      return res.status(400).json({ error: "Missing required campaign fields" });
    }

    const campaign = {
      name: name.trim(),
      subject: subject.trim(),
      template: template.trim(),
      list_id: parseInt(list_id),
      smtp_profile_id: parseInt(smtp_profile_id),
      status: status || "draft"
    };

    const result = await updateCampaign(id, campaign);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    res.json({ success: true, message: "Campaign updated successfully" });
  } catch (error) {
    console.error("Error updating campaign:", error);
    res.status(500).json({ error: "Failed to update campaign" });
  }
});

// Delete campaign
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteCampaign(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    res.json({ success: true, message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    res.status(500).json({ error: "Failed to delete campaign" });
  }
});

// Get campaign emails
router.get("/:id/emails", async (req, res) => {
  try {
    const { id } = req.params;
    const emails = await getCampaignEmails(id);
    res.json({ success: true, emails });
  } catch (error) {
    console.error("Error getting campaign emails:", error);
    res.status(500).json({ error: "Failed to get campaign emails" });
  }
});

// Start campaign
router.post("/:id/start", async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Starting campaign ${id}...`);
    
    // Get campaign details
    const campaign = await getCampaign(id);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }

    console.log(`Campaign found: ${campaign.name}, status: ${campaign.status}`);

    if (campaign.status === "in_progress") {
      return res.status(400).json({ error: "Campaign is already in progress" });
    }

    if (campaign.status === "completed") {
      return res.status(400).json({ error: "Campaign is already completed" });
    }

    // Get email list
    const emailList = await getEmailListItems(campaign.list_id);
    console.log(`Email list has ${emailList.length} emails`);
    if (emailList.length === 0) {
      return res.status(400).json({ error: "Email list is empty" });
    }

    // Get SMTP profile
    const smtpProfile = await getSmtpProfile(campaign.smtp_profile_id);
    if (!smtpProfile) {
      return res.status(400).json({ error: "SMTP profile not found" });
    }

    console.log(`SMTP profile found: ${smtpProfile.name}`);

    // Get settings
    const settings = await getSettings();
    console.log(`Settings: delay=${settings.delay_ms}ms, max_emails=${settings.max_emails_per_day}`);

    // Start campaign
    await startCampaign(id);
    console.log(`Campaign status updated to in_progress`);

    // Add emails to campaign_emails table
    const emails = emailList.map(item => item.email);
    console.log(`Adding ${emails.length} emails to campaign_emails table...`);
    await addCampaignEmails(id, emails);
    console.log(`Emails added to campaign_emails table`);

    // Start sending emails in background
    console.log(`Starting background email sending...`);
    sendCampaignEmails(id, campaign, smtpProfile, settings).catch(error => {
      console.error("Error sending campaign emails:", error);
    });

    res.json({ success: true, message: "Campaign started successfully" });
  } catch (error) {
    console.error("Error starting campaign:", error);
    res.status(500).json({ error: "Failed to start campaign: " + error.message });
  }
});

// Function to send campaign emails
async function sendCampaignEmails(campaignId, campaign, smtpProfile, settings) {
  try {
    console.log(`[Campaign ${campaignId}] Starting email sending process...`);
    
    // Fix SSL/TLS configuration based on port
    let transporterConfig = {
      host: smtpProfile.host,
      port: smtpProfile.port,
      auth: {
        user: smtpProfile.username,
        pass: smtpProfile.password
      },
      tls: {
        rejectUnauthorized: false
      }
    };
    
    // Fix the SSL/TLS configuration based on port
    if (smtpProfile.port === 587) {
      // Port 587 should use TLS (not SSL)
      transporterConfig.secure = false;
      transporterConfig.requireTLS = true;
    } else if (smtpProfile.port === 465) {
      // Port 465 should use SSL
      transporterConfig.secure = true;
    } else {
      // For other ports, use the encryption setting
      transporterConfig.secure = smtpProfile.encryption === "ssl";
    }
    
    console.log(`[Campaign ${campaignId}] Transporter config:`, transporterConfig);
    
    const transporter = nodemailer.createTransport(transporterConfig);

    console.log(`[Campaign ${campaignId}] SMTP transporter created`);

    // Test SMTP connection
    console.log(`[Campaign ${campaignId}] Testing SMTP connection...`);
    try {
      await transporter.verify();
      console.log(`[Campaign ${campaignId}] SMTP connection verified successfully`);
    } catch (error) {
      console.error(`[Campaign ${campaignId}] SMTP connection failed:`, error);
      throw new Error(`SMTP connection failed: ${error.message}`);
    }

    const campaignEmails = await getCampaignEmails(campaignId);
    const pendingEmails = campaignEmails.filter(email => email.status === "pending");

    console.log(`[Campaign ${campaignId}] Found ${campaignEmails.length} total emails, ${pendingEmails.length} pending`);

    let sentCount = 0;
    let todayCount = await getTodayCampaignEmailCount();
    
    console.log(`[Campaign ${campaignId}] Today's campaign email count: ${todayCount}/${settings.max_emails_per_day}`);

    for (const emailItem of pendingEmails) {
      try {
        // Check daily limit
        if (todayCount >= settings.max_emails_per_day) {
          console.log(`[Campaign ${campaignId}] Daily email limit reached (${todayCount}/${settings.max_emails_per_day})`);
          break;
        }

        console.log(`[Campaign ${campaignId}] Sending email to ${emailItem.email}...`);

        const mailOptions = {
          from: smtpProfile.username,
          to: emailItem.email,
          subject: campaign.subject,
          html: campaign.template
        };

        await transporter.sendMail(mailOptions);
        await updateCampaignEmailStatus(emailItem.id, "sent");
        sentCount++;
        todayCount++;

        console.log(`[Campaign ${campaignId}] Email sent successfully to ${emailItem.email}`);

        // Add delay between emails
        if (settings.delay_ms > 0) {
          console.log(`[Campaign ${campaignId}] Waiting ${settings.delay_ms}ms before next email...`);
          await new Promise(resolve => setTimeout(resolve, settings.delay_ms));
        }
      } catch (error) {
        console.error(`[Campaign ${campaignId}] Error sending email to ${emailItem.email}:`, error);
        await updateCampaignEmailStatus(emailItem.id, "failed", error.message);
      }
    }

    // Check if all emails are processed
    const remainingEmails = await getCampaignEmails(campaignId);
    const stillPending = remainingEmails.filter(email => email.status === "pending");
    
    console.log(`[Campaign ${campaignId}] Final status: ${sentCount} sent, ${stillPending.length} still pending`);
    
    if (stillPending.length === 0) {
      await completeCampaign(campaignId);
      console.log(`[Campaign ${campaignId}] Campaign marked as completed`);
    } else {
      console.log(`[Campaign ${campaignId}] Campaign paused - ${stillPending.length} emails still pending`);
    }

    console.log(`[Campaign ${campaignId}] Email sending process completed. Sent ${sentCount} emails.`);
  } catch (error) {
    console.error(`[Campaign ${campaignId}] Error in sendCampaignEmails:`, error);
  }
}

// Get campaign statistics
router.get("/:id/stats", async (req, res) => {
  try {
    const { id } = req.params;
    const emails = await getCampaignEmails(id);
    
    const stats = {
      total: emails.length,
      sent: emails.filter(e => e.status === "sent").length,
      failed: emails.filter(e => e.status === "failed").length,
      pending: emails.filter(e => e.status === "pending").length
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error("Error getting campaign stats:", error);
    res.status(500).json({ error: "Failed to get campaign statistics" });
  }
});

// Test endpoint to debug campaign issues
router.get("/:id/debug", async (req, res) => {
  try {
    const { id } = req.params;
    
    const campaign = await getCampaign(id);
    const emailList = campaign ? await getEmailListItems(campaign.list_id) : null;
    const smtpProfile = campaign ? await getSmtpProfile(campaign.smtp_profile_id) : null;
    const settings = await getSettings();
    const campaignEmails = await getCampaignEmails(id);
    
    res.json({
      success: true,
      debug: {
        campaign,
        emailList: emailList ? emailList.slice(0, 5) : null, // First 5 emails only
        emailListCount: emailList ? emailList.length : 0,
        smtpProfile: smtpProfile ? {
          id: smtpProfile.id,
          name: smtpProfile.name,
          host: smtpProfile.host,
          port: smtpProfile.port,
          username: smtpProfile.username,
          encryption: smtpProfile.encryption
        } : null,
        settings,
        campaignEmails: campaignEmails.slice(0, 10), // First 10 campaign emails
        campaignEmailsCount: campaignEmails.length
      }
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({ error: "Failed to get debug info: " + error.message });
  }
});

module.exports = router;
