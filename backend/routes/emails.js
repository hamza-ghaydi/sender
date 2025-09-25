const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const { Readable } = require("stream");
const { addEmail, getAllEmails, updateEmail, deleteEmail, clearEmails } = require("../database/db");

const upload = multer({ storage: multer.memoryStorage() });

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Upload CSV or list
router.post("/", upload.single("csvFile"), async (req, res) => {
  try {
    let emails = [];
    if (req.file) {
      const csvData = req.file.buffer.toString();
      const results = [];
      const stream = Readable.from([csvData]);
      await new Promise((resolve, reject) => {
        stream
          .pipe(csv())
          .on("data", (data) => {
            const email = data.email || Object.values(data)[0];
            if (email && validateEmail(email.trim())) {
              results.push(email.trim().toLowerCase());
            }
          })
          .on("end", resolve)
          .on("error", reject);
      });
      emails = [...new Set(results)];
    } else if (req.body.emails) {
      const emailList = Array.isArray(req.body.emails)
        ? req.body.emails
        : req.body.emails.split(/[\,\n\r]+/);
      emails = emailList
        .map((email) => email.trim().toLowerCase())
        .filter((email) => email && validateEmail(email));
      emails = [...new Set(emails)];
    } else {
      return res.status(400).json({ error: "No emails provided" });
    }

    if (emails.length === 0) {
      return res.status(400).json({ error: "No valid emails found" });
    }

    const results = { added: [], duplicates: [], errors: [] };
    for (const email of emails) {
      try {
        await addEmail(email);
        results.added.push(email);
      } catch (error) {
        if (error.message.includes("UNIQUE constraint failed")) {
          results.duplicates.push(email);
        } else {
          results.errors.push({ email, error: error.message });
        }
      }
    }
    res.json({ success: true, message: `Processed ${emails.length} emails`, results });
  } catch (error) {
    console.error("Error processing emails:", error);
    res.status(500).json({ error: "Failed to process emails" });
  }
});

// List emails
router.get("/", async (req, res) => {
  try {
    const emails = await getAllEmails();
    res.json({ success: true, emails });
  } catch (error) {
    console.error("Error getting emails:", error);
    res.status(500).json({ error: "Failed to get emails" });
  }
});

// Update email value
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }
    const result = await updateEmail(id, email.trim().toLowerCase());
    res.json({ success: true, result });
  } catch (error) {
    console.error("Error updating email:", error);
    res.status(500).json({ error: "Failed to update email" });
  }
});

// Delete one email
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteEmail(id);
    res.json({ success: true, result });
  } catch (error) {
    console.error("Error deleting email:", error);
    res.status(500).json({ error: "Failed to delete email" });
  }
});

// Clear all emails
router.delete("/", async (req, res) => {
  try {
    const result = await clearEmails();
    res.json({ success: true, result });
  } catch (error) {
    console.error("Error clearing emails:", error);
    res.status(500).json({ error: "Failed to clear emails" });
  }
});

module.exports = router;

 
