const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(express.json());
app.use(express.static('public'));

// 接收前端表單
app.post('/api/submit', async (req, res) => {
  try {
    const d = req.body;
    const query = `
      INSERT INTO rituals (user_name, user_age, user_email, user_job, user_edu, gentle_item, gentle_reason, sharp_item, sharp_reason, farewell_item, item_detail, duration, memory, hesitate)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `;
    const values = [d.userName, d.userAge, d.userEmail, d.userJob, d.userEdu, d.gentleItem, d.gentleReason, d.sharpItem, d.sharpReason, d.farewellItem, d.itemDetail, d.duration, d.memory, d.hesitate];
    await pool.query(query, values);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

// 專供喵喵機列印的私密長條網址
app.get('/admin-print-secret', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rituals ORDER BY created_at DESC');
    let html = `<html><head><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>
      body { width: 350px; margin: 0 auto; font-family: sans-serif; padding: 10px; }
      .item { border-bottom: 2px dashed #000; padding: 15px 0; word-wrap: break-word; }
      .label { font-weight: bold; font-size: 14px; display: block; margin-top: 5px; }
      .val { font-size: 16px; margin-bottom: 5px; }
    </style></head><body><h3 style="text-align:center;">告別儀式清單</h3>`;
    
    result.rows.forEach(row => {
      html += `<div class="item">
        <span class="label">告別物件:</span><div class="val">${row.farewell_item}</div>
        <span class="label">主人:</span><div class="val">${row.user_name}</div>
        <span class="label">情感連結:</span><div class="val">${row.memory}</div>
        <span class="label">猶豫原因:</span><div class="val">${row.hesitate}</div>
        <div style="text-align:center; margin-top:10px;">✂---------</div>
      </div>`;
    });
    res.send(html + `</body></html>`);
  } catch (err) { res.status(500).send("Error"); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
