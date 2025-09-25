const express = require("express");
const router = express.Router();
const multer = require("multer");
const csv = require("csv-parser");
const { Readable } = require("stream");
const { 
  getAllEmailLists, 
  createEmailList, 
  updateEmailList, 
  deleteEmailList,
  getEmailListItems,
  addEmailToList,
  updateEmailInList,
  deleteEmailFromList
} = require("../database/db");

const upload = multer({ storage: multer.memoryStorage() });

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Get all email lists
router.get("/", async (req, res) => {
  try {
    const lists = await getAllEmailLists();
    res.json({ success: true, lists });
  } catch (error) {
    console.error("Error getting email lists:", error);
    res.status(500).json({ error: "Failed to get email lists" });
  }
});

// Create new email list
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "List name is required" });
    }
    const result = await createEmailList(name.trim());
    res.json({ success: true, message: "Email list created successfully", list: result });
  } catch (error) {
    console.error("Error creating email list:", error);
    res.status(500).json({ error: "Failed to create email list" });
  }
});

// Update email list
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    if (!name || name.trim() === "") {
      return res.status(400).json({ error: "List name is required" });
    }
    const result = await updateEmailList(id, name.trim());
    if (result.changes === 0) {
      return res.status(404).json({ error: "Email list not found" });
    }
    res.json({ success: true, message: "Email list updated successfully" });
  } catch (error) {
    console.error("Error updating email list:", error);
    res.status(500).json({ error: "Failed to update email list" });
  }
});

// Delete email list
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteEmailList(id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Email list not found" });
    }
    res.json({ success: true, message: "Email list deleted successfully" });
  } catch (error) {
    console.error("Error deleting email list:", error);
    res.status(500).json({ error: "Failed to delete email list" });
  }
});

// Get emails in a list
router.get("/:id/emails", async (req, res) => {
  try {
    const { id } = req.params;
    const emails = await getEmailListItems(id);
    res.json({ success: true, emails });
  } catch (error) {
    console.error("Error getting list emails:", error);
    res.status(500).json({ error: "Failed to get list emails" });
  }
});

// Add emails to list (CSV upload or text input)
router.post("/:id/emails", upload.single("csvFile"), async (req, res) => {
  try {
    const { id } = req.params;
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
        await addEmailToList(id, email);
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
    console.error("Error adding emails to list:", error);
    res.status(500).json({ error: "Failed to add emails to list" });
  }
});

// Update email in list
router.put("/:id/emails/:emailId", async (req, res) => {
  try {
    const { emailId } = req.params;
    const { email } = req.body;
    if (!email || !validateEmail(email)) {
      return res.status(400).json({ error: "Valid email required" });
    }
    const result = await updateEmailInList(emailId, email.trim().toLowerCase());
    if (result.changes === 0) {
      return res.status(404).json({ error: "Email not found" });
    }
    res.json({ success: true, message: "Email updated successfully" });
  } catch (error) {
    console.error("Error updating email:", error);
    res.status(500).json({ error: "Failed to update email" });
  }
});

// Delete email from list
router.delete("/:id/emails/:emailId", async (req, res) => {
  try {
    const { emailId } = req.params;
    const result = await deleteEmailFromList(emailId);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Email not found" });
    }
    res.json({ success: true, message: "Email deleted successfully" });
  } catch (error) {
    console.error("Error deleting email:", error);
    res.status(500).json({ error: "Failed to delete email" });
  }
});

module.exports = router;
