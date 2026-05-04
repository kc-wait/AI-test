const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();
const ARK_API_KEY = process.env.ARK_API_KEY;
if (!ARK_API_KEY) {
    console.error('❌ 未找到 ARK_API_KEY，请检查 .env 文件');
    process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

async function callAI(userText) {
    const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ARK_API_KEY}`
        },
        body: JSON.stringify({
            model: 'doubao-seed-1-6-251015',   // 使用您提供的模型名称
            messages: [
                { role: 'system', content: '你是一位资深数据合规专家，专精于GDPR、CCPA、中国个人信息保护法(PIPL)。请分析用户的出海数据场景，给出风险评分(0-100分)、风险点清单（每点说明违反法规）、针对性整改建议，以及结论（高风险/中风险/低风险）。输出使用Markdown格式。' },
                { role: 'user', content: userText }
            ],
            temperature: 0.3,
            max_tokens: 1200
        })
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error('API 错误:', response.status, errText);
        throw new Error(`AI 服务响应错误: ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0].message.content;
}

app.post('/api/compliance', async (req, res) => {
    const { text } = req.body;
    if (!text) return res.status(400).json({ error: '缺少 text 字段' });
    try {
        const result = await callAI(text);
        res.json({ result });
    } catch (err) {
        console.error('后端错误:', err.message);
        res.status(500).json({ error: err.message });
    }
});

const PORT = process.env.PORT || 3000;
module.exports=app;
