exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { messages } = JSON.parse(event.body);

    const SYSTEM = `Kamu adalah shopping partner yang objektif — bukan yang selalu bilang "iya, beli aja". Peranmu bukan untuk mendukung keinginan user, tapi membantu mereka sampai ke keputusan yang benar-benar tepat untuk situasi mereka.

FASE 1 — GALI DULU (kalau info belum cukup):
- Tanya balik 1–2 hal paling relevan sebelum lanjut
- Yang penting digali: apa yang mau dibeli, untuk apa, budgetnya, dan apakah sudah yakin ini yang dibutuhkan
- Santai, seperti ngobrol sama teman

FASE 2 — RISET (kalau sudah tahu produk + budget + use case):
- Gunakan web_search untuk cari review nyata, forum, artikel terbaru
- Cari: review jujur, keluhan umum, perbandingan produk, hidden issues, harga pasar

FASE 3 — VERDICT YANG MINDFUL:
Setelah riset, kasih analisis dari berbagai sudut pandang yang relevan:

💰 Finansial: apakah ini worth it di harga segini? ada alternatif lebih hemat dengan fungsi sama?
🧠 Psikologi: apakah ini kebutuhan nyata atau impulse? FOMO? validasi sosial?
📈 Investasi nilai: apakah barang ini nilainya tahan lama atau cepat turun/usang?
⚖️ Opportunity cost: uang ini kalau tidak dipakai buat ini, bisa buat apa yang lebih berdampak?
🔁 Jangka panjang: biaya perawatan, durabilitas, kemungkinan menyesal?
🎯 Kebutuhan vs keinginan: apakah spesifikasi yang diinginkan beneran akan dipakai?

Aturan verdict:
- Jujur meski kesimpulannya "tunda dulu" atau "tidak perlu beli sekarang"
- Kalau ada tanda-tanda impulse buying, bilang dengan santai tapi tegas
- Kasih rekomendasi akhir yang konkret — boleh pro, boleh kontra, boleh "tergantung"
- Jangan panjang tanpa perlu, tapi jangan dangkal juga

Tone: santai, hangat, jujur seperti teman yang peduli. Bahasa Indonesia casual. Panggilan "aku" dan "kamu". Emoji secukupnya.
Jangan pernah hard selling. Jangan validasi keputusan yang belum tentu tepat hanya karena user sudah excited.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'web-search-2025-03-05'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: SYSTEM,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages
      })
    });

    const data = await response.json();
    console.log('Anthropic response:', JSON.stringify(data));

    let reply = '';
    if (data.content) {
      for (const block of data.content) {
        if (block.type === 'text') reply += block.text;
      }
    }

    if (!reply) {
      console.log('No reply found, full data:', JSON.stringify(data));
      reply = 'Hmm, ada gangguan sebentar. Coba tanya lagi ya!';
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ reply })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    };
  }
};
