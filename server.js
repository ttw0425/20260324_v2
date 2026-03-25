const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const app = express();

// 設定資料庫連線
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// ✨ 自動初始化資料庫：如果表不存在就建立它
async function initDB() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rituals (
        id SERIAL PRIMARY KEY,
        user_name TEXT, 
        user_age INT, 
        user_email TEXT, 
        user_job TEXT, 
        user_edu TEXT,
        gentle_item TEXT, 
        gentle_reason TEXT, 
        sharp_item TEXT, 
        sharp_reason TEXT,
        farewell_item TEXT, 
        item_detail TEXT, 
        duration TEXT, 
        memory TEXT, 
        hesitate TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ 資料庫表已準備就緒 (rituals table is ready)");
  } catch (err) {
    console.error("❌ 資料庫初始化失敗:", err);
  }
}

// 啟動伺服器前先執行初始化
initDB();

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
    console.error("儲存失敗:", err);
    res.status(500).json({ error: "儲存失敗" });
  }
});

// 專供喵喵機列印的私密長條網址
app.get('/admin-print-secret', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM rituals ORDER BY created_at DESC');
    let html = `
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { width: 350px; margin: 0 auto; font-family: sans-serif; padding: 20px; background: #fff; color: #333; }
          .card { border-bottom: 2px dashed #000; padding: 20px 0; }
          .title { font-weight: bold; font-size: 18px; margin-bottom: 10px; border-left: 5px solid #000; padding-left: 10px; }
          .content { font-size: 14px; line-height: 1.6; margin-bottom: 5px; }
          .label { color: #888; font-size: 12px; font-weight: bold; }
          .divider { text-align: center; margin: 15px 0; color: #ccc; }
        </style>
      </head>
      <body>
        <h2 style="text-align:center;">✨ 告別清單 (喵喵機專用)</h2>
    `;

    result.rows.forEach(row => {
      html += `
        <div class="card">
          <div class="title">${row.farewell_item}</div>
          <div class="content"><span class="label">主人：</span>${row.user_name}</div>
          <div class="content"><span class="label">基本功能：</span>${row.item_detail}</div>
          <div class="content"><span class="label">使用時長：</span>${row.duration}</div>
          <div class="content"><span class="label">情感連結：</span>${row.memory}</div>
          <div class="content"><span class="label">猶豫原因：</span>${row.hesitate}</div>
          <div class="divider">✂----------------------</div>
        </div>
      `;
    });

    html += `</body></html>`;
    res.send(html);
  } catch (err) {
    res.status(500).send("資料讀取失敗");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 伺服器運行中: port ${PORT}`));
