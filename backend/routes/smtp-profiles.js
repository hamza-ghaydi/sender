const express = require("express");
const router = express.Router();
const { 
  getAllSmtpProfiles, 
  createSmtpProfile, 
  updateSmtpProfile, 
  deleteSmtpProfile,
  getSmtpProfile
} = require("../database/db");

// Get all SMTP profiles
router.get("/", async (req, res) => {
  try {
    const profiles = await getAllSmtpProfiles();
    // Remove passwords from response for security
    const safeProfiles = profiles.map(profile => {
      const { password, ...safeProfile } = profile;
      return safeProfile;
    });
    res.json({ success: true, profiles: safeProfiles });
  } catch (error) {
    console.error("Error getting SMTP profiles:", error);
    res.status(500).json({ error: "Failed to get SMTP profiles" });
  }
});

// Get single SMTP profile
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await getSmtpProfile(id);
    if (!profile) {
      return res.status(404).json({ error: "SMTP profile not found" });
    }
    // Remove password from response for security
    const { password, ...safeProfile } = profile;
    res.json({ success: true, profile: safeProfile });
  } catch (error) {
    console.error("Error getting SMTP profile:", error);
    res.status(500).json({ error: "Failed to get SMTP profile" });
  }
});

// Create new SMTP profile
router.post("/", async (req, res) => {
  try {
    const { name, host, port, username, password, encryption } = req.body;
    
    if (!name || !host || !port || !username || !password) {
      return res.status(400).json({ error: "Missing required SMTP profile fields" });
    }

    const profile = {
      name: name.trim(),
      host: host.trim(),
      port: parseInt(port),
      username: username.trim(),
      password: password.trim(),
      encryption: encryption || "none"
    };

    const result = await createSmtpProfile(profile);
    // Remove password from response
    const { password: _, ...safeResult } = result;
    res.json({ success: true, message: "SMTP profile created successfully", profile: safeResult });
  } catch (error) {
    console.error("Error creating SMTP profile:", error);
    res.status(500).json({ error: "Failed to create SMTP profile" });
  }
});

// Update SMTP profile
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, host, port, username, password, encryption } = req.body;
    
    if (!name || !host || !port || !username || !password) {
      return res.status(400).json({ error: "Missing required SMTP profile fields" });
    }

    const profile = {
      name: name.trim(),
      host: host.trim(),
      port: parseInt(port),
      username: username.trim(),
      password: password.trim(),
      encryption: encryption || "none"
    };

    const result = await updateSmtpProfile(id, profile);
    if (result.changes === 0) {
      return res.status(404).json({ error: "SMTP profile not found" });
    }
    res.json({ success: true, message: "SMTP profile updated successfully" });
  } catch (error) {
    console.error("Error updating SMTP profile:", error);
    res.status(500).json({ error: "Failed to update SMTP profile" });
  }
});

// Delete SMTP profile
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteSmtpProfile(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "SMTP profile not found" });
    }
    res.json({ success: true, message: "SMTP profile deleted successfully" });
  } catch (error) {
    console.error("Error deleting SMTP profile:", error);
    res.status(500).json({ error: "Failed to delete SMTP profile" });
  }
});

// Test SMTP connection
router.post("/:id/test", async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await getSmtpProfile(id);
    
    if (!profile) {
      return res.status(404).json({ error: "SMTP profile not found" });
    }

    const nodemailer = require("nodemailer");
    
    // Fix SSL/TLS configuration based on port
    let transporterConfig = {
      host: profile.host,
      port: profile.port,
      auth: {
        user: profile.username,
        pass: profile.password
      },
      tls: {
        rejectUnauthorized: false
      }
    };
    
    // Fix the SSL/TLS configuration based on port
    if (profile.port === 587) {
      // Port 587 should use TLS (not SSL)
      transporterConfig.secure = false;
      transporterConfig.requireTLS = true;
    } else if (profile.port === 465) {
      // Port 465 should use SSL
      transporterConfig.secure = true;
    } else {
      // For other ports, use the encryption setting
      transporterConfig.secure = profile.encryption === "ssl";
    }
    
    const transporter = nodemailer.createTransport(transporterConfig);

    // Test connection
    await transporter.verify();
    res.json({ success: true, message: "SMTP connection successful" });
  } catch (error) {
    console.error("Error testing SMTP connection:", error);
    res.status(500).json({ error: "SMTP connection failed: " + error.message });
  }
});

module.exports = router;
