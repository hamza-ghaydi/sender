const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "email_sender.db");
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error opening database:", err.message);
  } else {
    console.log("Connected to SQLite database");
    initializeTables();
  }
});

function initializeTables() {
  db.run(`CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT "pending",
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME NULL,
    error_message TEXT NULL
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS smtp_config (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    user TEXT NOT NULL,
    pass TEXT NOT NULL,
    secure BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  
  db.run(`CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    delay_ms INTEGER DEFAULT 1000,
    max_emails_per_day INTEGER DEFAULT 100,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // New tables for extended features
  db.run(`CREATE TABLE IF NOT EXISTS email_lists (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS email_list_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    list_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (list_id) REFERENCES email_lists (id) ON DELETE CASCADE,
    UNIQUE(list_id, email)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS smtp_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER NOT NULL,
    username TEXT NOT NULL,
    password TEXT NOT NULL,
    encryption TEXT DEFAULT "none",
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    template TEXT NOT NULL,
    list_id INTEGER NOT NULL,
    smtp_profile_id INTEGER NOT NULL,
    status TEXT DEFAULT "draft",
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at DATETIME NULL,
    completed_at DATETIME NULL,
    FOREIGN KEY (list_id) REFERENCES email_lists (id),
    FOREIGN KEY (smtp_profile_id) REFERENCES smtp_profiles (id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS campaign_emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    status TEXT DEFAULT "pending",
    sent_at DATETIME NULL,
    error_message TEXT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (campaign_id) REFERENCES campaigns (id) ON DELETE CASCADE
  )`);
}

const dbHelpers = {
  getAllEmails: () => new Promise((resolve, reject) => {
    db.all("SELECT * FROM emails ORDER BY created_at DESC", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  }),

  addEmail: (email) => new Promise((resolve, reject) => {
    db.run("INSERT INTO emails (email) VALUES (?)", [email], function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, email, status: "pending" });
    });
  }),

  updateEmailStatus: (id, status, errorMessage = null) => new Promise((resolve, reject) => {
    const sentAt = status === "sent" ? new Date().toISOString() : null;
    db.run("UPDATE emails SET status = ?, sent_at = ?, error_message = ? WHERE id = ?", 
      [status, sentAt, errorMessage, id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  }),

  getSmtpConfig: () => new Promise((resolve, reject) => {
    db.get("SELECT * FROM smtp_config ORDER BY created_at DESC LIMIT 1", (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }),

  saveSmtpConfig: (config) => new Promise((resolve, reject) => {
    const { host, port, user, pass, secure } = config;
    db.run("INSERT INTO smtp_config (host, port, user, pass, secure) VALUES (?, ?, ?, ?, ?)", 
      [host, port, user, pass, secure ? 1 : 0], function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, ...config });
    });
  }),

  getSettings: () => new Promise((resolve, reject) => {
    db.get("SELECT * FROM settings ORDER BY created_at DESC LIMIT 1", (err, row) => {
      if (err) reject(err);
      else resolve(row || { delay_ms: 1000, max_emails_per_day: 100 });
    });
  }),

  saveSettings: (settings) => new Promise((resolve, reject) => {
    const { delay_ms, max_emails_per_day } = settings;
    db.run("INSERT INTO settings (delay_ms, max_emails_per_day) VALUES (?, ?)", 
      [delay_ms, max_emails_per_day], function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, ...settings });
    });
  }),

  getTodayEmailCount: () => new Promise((resolve, reject) => {
    const today = new Date().toISOString().split("T")[0];
    db.get("SELECT COUNT(*) as count FROM emails WHERE DATE(sent_at) = ? AND status = \"sent\"", 
      [today], (err, row) => {
      if (err) reject(err);
      else resolve(row.count || 0);
    });
  }),

  getTodayCampaignEmailCount: () => new Promise((resolve, reject) => {
    const today = new Date().toISOString().split("T")[0];
    db.get("SELECT COUNT(*) as count FROM campaign_emails WHERE DATE(sent_at) = ? AND status = \"sent\"", 
      [today], (err, row) => {
      if (err) reject(err);
      else resolve(row.count || 0);
    });
  }),

  // Email Lists functions
  getAllEmailLists: () => new Promise((resolve, reject) => {
    db.all("SELECT * FROM email_lists ORDER BY created_at DESC", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  }),

  createEmailList: (name) => new Promise((resolve, reject) => {
    db.run("INSERT INTO email_lists (name) VALUES (?)", [name], function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, name, created_at: new Date().toISOString() });
    });
  }),

  updateEmailList: (id, name) => new Promise((resolve, reject) => {
    db.run("UPDATE email_lists SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", 
      [name, id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  }),

  deleteEmailList: (id) => new Promise((resolve, reject) => {
    db.run("DELETE FROM email_lists WHERE id = ?", [id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  }),

  getEmailListItems: (listId) => new Promise((resolve, reject) => {
    db.all("SELECT * FROM email_list_items WHERE list_id = ? ORDER BY created_at DESC", 
      [listId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  }),

  addEmailToList: (listId, email) => new Promise((resolve, reject) => {
    db.run("INSERT INTO email_list_items (list_id, email) VALUES (?, ?)", 
      [listId, email], function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, list_id: listId, email });
    });
  }),

  updateEmailInList: (id, email) => new Promise((resolve, reject) => {
    db.run("UPDATE email_list_items SET email = ? WHERE id = ?", [email, id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  }),

  deleteEmailFromList: (id) => new Promise((resolve, reject) => {
    db.run("DELETE FROM email_list_items WHERE id = ?", [id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  }),

  // SMTP Profiles functions
  getAllSmtpProfiles: () => new Promise((resolve, reject) => {
    db.all("SELECT * FROM smtp_profiles ORDER BY created_at DESC", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  }),

  createSmtpProfile: (profile) => new Promise((resolve, reject) => {
    const { name, host, port, username, password, encryption } = profile;
    db.run("INSERT INTO smtp_profiles (name, host, port, username, password, encryption) VALUES (?, ?, ?, ?, ?, ?)", 
      [name, host, port, username, password, encryption], function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, ...profile });
    });
  }),

  updateSmtpProfile: (id, profile) => new Promise((resolve, reject) => {
    const { name, host, port, username, password, encryption } = profile;
    db.run("UPDATE smtp_profiles SET name = ?, host = ?, port = ?, username = ?, password = ?, encryption = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", 
      [name, host, port, username, password, encryption, id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  }),

  deleteSmtpProfile: (id) => new Promise((resolve, reject) => {
    db.run("DELETE FROM smtp_profiles WHERE id = ?", [id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  }),

  getSmtpProfile: (id) => new Promise((resolve, reject) => {
    db.get("SELECT * FROM smtp_profiles WHERE id = ?", [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }),

  // Campaigns functions
  getAllCampaigns: () => new Promise((resolve, reject) => {
    db.all(`SELECT c.*, el.name as list_name, sp.name as smtp_profile_name 
            FROM campaigns c 
            LEFT JOIN email_lists el ON c.list_id = el.id 
            LEFT JOIN smtp_profiles sp ON c.smtp_profile_id = sp.id 
            ORDER BY c.created_at DESC`, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  }),

  createCampaign: (campaign) => new Promise((resolve, reject) => {
    const { name, subject, template, list_id, smtp_profile_id } = campaign;
    db.run("INSERT INTO campaigns (name, subject, template, list_id, smtp_profile_id) VALUES (?, ?, ?, ?, ?)", 
      [name, subject, template, list_id, smtp_profile_id], function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, ...campaign });
    });
  }),

  updateCampaign: (id, campaign) => new Promise((resolve, reject) => {
    const { name, subject, template, list_id, smtp_profile_id, status } = campaign;
    db.run("UPDATE campaigns SET name = ?, subject = ?, template = ?, list_id = ?, smtp_profile_id = ?, status = ? WHERE id = ?", 
      [name, subject, template, list_id, smtp_profile_id, status, id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  }),

  deleteCampaign: (id) => new Promise((resolve, reject) => {
    db.run("DELETE FROM campaigns WHERE id = ?", [id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  }),

  getCampaign: (id) => new Promise((resolve, reject) => {
    db.get(`SELECT c.*, el.name as list_name, sp.name as smtp_profile_name 
            FROM campaigns c 
            LEFT JOIN email_lists el ON c.list_id = el.id 
            LEFT JOIN smtp_profiles sp ON c.smtp_profile_id = sp.id 
            WHERE c.id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  }),

  startCampaign: (id) => new Promise((resolve, reject) => {
    db.run("UPDATE campaigns SET status = 'in_progress', started_at = CURRENT_TIMESTAMP WHERE id = ?", 
      [id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  }),

  completeCampaign: (id) => new Promise((resolve, reject) => {
    db.run("UPDATE campaigns SET status = 'completed', completed_at = CURRENT_TIMESTAMP WHERE id = ?", 
      [id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  }),

  // Campaign Emails functions
  addCampaignEmails: (campaignId, emails) => new Promise((resolve, reject) => {
    const stmt = db.prepare("INSERT INTO campaign_emails (campaign_id, email) VALUES (?, ?)");
    let errorOccurred = false;
    
    emails.forEach(email => {
      if (!errorOccurred) {
        const result = stmt.run([campaignId, email]);
        if (result.error) {
          errorOccurred = true;
          stmt.finalize();
          reject(result.error);
          return;
        }
      }
    });
    
    if (!errorOccurred) {
      stmt.finalize((err) => {
        if (err) reject(err);
        else resolve({ count: emails.length });
      });
    }
  }),

  getCampaignEmails: (campaignId) => new Promise((resolve, reject) => {
    db.all("SELECT * FROM campaign_emails WHERE campaign_id = ? ORDER BY created_at DESC", 
      [campaignId], (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  }),

  updateCampaignEmailStatus: (id, status, errorMessage = null) => new Promise((resolve, reject) => {
    const sentAt = status === "sent" ? new Date().toISOString() : null;
    db.run("UPDATE campaign_emails SET status = ?, sent_at = ?, error_message = ? WHERE id = ?", 
      [status, sentAt, errorMessage, id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  })
};

function updateEmail(id, email) {
  return new Promise((resolve, reject) => {
    db.run("UPDATE emails SET email = ? WHERE id = ?", [email, id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });
}

function deleteEmail(id) {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM emails WHERE id = ?", [id], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });
}

function clearEmails() {
  return new Promise((resolve, reject) => {
    db.run("DELETE FROM emails", [], function(err) {
      if (err) reject(err);
      else resolve({ changes: this.changes });
    });
  });
}

module.exports = { db, ...dbHelpers, updateEmail, deleteEmail, clearEmails };
