import { Request, Response, NextFunction } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

interface AuthenticatedRequest extends Request {
  user?: { id: string; email: string; fullName: string };
}

// FAQ Database (sama dengan frontend)
const FAQ_DATA = [
  { q: 'Bagaimana cara mendaftar akun PinjamAJA?', a: 'Unduh aplikasi PinjamAJA, klik "Daftar", masukkan nomor HP dan email, lalu ikuti langkah verifikasi identitas (e-KYC).' },
  { q: 'Lupa password, bagaimana cara reset?', a: 'Klik "Lupa Password" di halaman login, masukkan email terdaftar, lalu ikuti instruksi di email untuk membuat password baru.' },
  { q: 'Berapa lama proses pencairan pinjaman?', a: 'PinjamAJA Express dapat cair dalam 15 menit. Pinjaman lain membutuhkan 1-3 hari kerja setelah disetujui.' },
  { q: 'Apa saja syarat pengajuan pinjaman?', a: 'Syarat umum: KTP valid, usia 21-55 tahun, memiliki penghasilan tetap, dan sudah verifikasi KYC.' },
  { q: 'Negara mana saja yang mendukung QRIS lintas negara?', a: 'Saat ini PinjamAJA mendukung pembayaran QRIS di Singapore, Malaysia, dan Thailand.' },
  { q: 'Berapa biaya transaksi QRIS internasional?', a: 'Biaya bervariasi antara Rp 2.500 - Rp 10.000 tergantung nilai transaksi dan negara tujuan.' },
  { q: 'Bagaimana cara klaim asuransi?', a: 'Buka menu Asuransi > Polis Aktif > Ajukan Klaim. Unggah dokumen pendukung dan tunggu proses review 2-3 hari kerja.' },
  { q: 'Apakah data saya aman di PinjamAJA?', a: 'PinjamAJA menggunakan enkripsi end-to-end, MFA, dan mematuhi regulasi OJK serta UU Perlindungan Data Pribadi (UU PDP).' },
  { q: 'Berapa suku bunga tabungan PinjamAJA?', a: 'Tabungan reguler: 3.5% p.a., Premium: 4.5% p.a., Goal Savings: 4.0% p.a. Bunga dihitung harian dan dibayar bulanan.' },
  { q: 'Apakah bisa transfer ke bank lain?', a: 'Ya, PinjamAJA mendukung transfer ke semua bank di Indonesia via BI-FAST dengan biaya Rp 2.500 per transaksi.' },
];

export const chatController = {
  async chat(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const { message, history } = req.body;
      const userId = req.user?.id;

      if (!message || typeof message !== 'string') {
        return res.status(400).json({ success: false, message: 'Message is required' });
      }

      // ============================================
      // 1. Ambil data user dari database sebagai konteks
      // ============================================
      let userContext = '';
      try {
        if (userId) {
          // User profile
          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
              fullName: true, email: true, phoneNumber: true,
              kycStatus: true, accountStatus: true, mfaEnabled: true,
              createdAt: true
            }
          });

          if (user) {
            userContext += `\n[DATA USER DARI DATABASE]\n`;
            userContext += `Nama: ${user.fullName}\n`;
            userContext += `Email: ${user.email}\n`;
            userContext += `No HP: ${user.phoneNumber}\n`;
            userContext += `Status KYC: ${user.kycStatus}\n`;
            userContext += `Status Akun: ${user.accountStatus}\n`;
            userContext += `MFA Aktif: ${user.mfaEnabled ? 'Ya' : 'Tidak'}\n`;
            userContext += `Terdaftar Sejak: ${new Date(user.createdAt).toLocaleDateString('id-ID')}\n`;
          }

          // Savings accounts
          const savings = await (prisma as any).savingsAccount?.findMany?.({
            where: { userId },
            select: { productName: true, balance: true, isActive: true }
          }).catch(() => null);

          if (savings && savings.length > 0) {
            userContext += `\n[REKENING TABUNGAN]\n`;
            savings.forEach((s: any, i: number) => {
              userContext += `${i + 1}. ${s.productName}: Rp ${Number(s.balance).toLocaleString('id-ID')} ${s.isActive ? '(Aktif)' : ''}\n`;
            });
          }

          // Loans
          const loans = await prisma.loan.findMany({
            where: { userId },
            select: {
              productName: true, amount: true, tenor: true,
              monthlyInstallment: true, status: true
            }
          });

          if (loans.length > 0) {
            userContext += `\n[PINJAMAN]\n`;
            loans.forEach((l, i) => {
              userContext += `${i + 1}. ${l.productName}: Rp ${Number(l.amount).toLocaleString('id-ID')}, Cicilan: Rp ${Number(l.monthlyInstallment).toLocaleString('id-ID')}/bln, Tenor: ${l.tenor} bln, Status: ${l.status}\n`;
            });
          }

          // Recent transactions (last 5)
          const transactions = await prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
              type: true, amount: true, description: true,
              status: true, createdAt: true
            }
          });

          if (transactions.length > 0) {
            userContext += `\n[5 TRANSAKSI TERAKHIR]\n`;
            transactions.forEach((t, i) => {
              const dateStr = new Date(t.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
              userContext += `${i + 1}. ${t.type}: Rp ${Number(t.amount).toLocaleString('id-ID')} - ${t.description || ''} (${dateStr})\n`;
            });
          }
        }
      } catch (dbErr) {
        console.warn('Failed to fetch user context from DB:', dbErr);
      }

      // ============================================
      // 2. Bangun system prompt dengan filter ketat
      // ============================================
      const faqText = FAQ_DATA.map(f => `Q: ${f.q}\nA: ${f.a}`).join('\n\n');

      const systemPrompt = `Kamu adalah teman ngobrol pintar berbasis AI. Posisikan dirimu layaknya AI canggih seperti ChatGPT atau Gemini yang sangat ramah, asyik diajak ngobrol, dan berwawasan luas.

ATURAN UTAMA:
1. Bersikaplah santai, interaktif, dan luwes. Kamu boleh pakai bahasa sehari-hari yang enak dibaca (santai tapi sopan). Jangan kaku seperti robot bank.
2. Kamu BEBAS menjawab pertanyaan apa saja dari user (dari ngoding, sains, curhat, sampai resep masakan). Jika ditanya tentang layanan PinjamAJA (pinjaman, saldo, dll), kamu bisa menjawabnya menggunakan data user di bawah ini. JANGAN mengarang data finansial.
3. Jika user melaporkan masalah keamanan serius (akun di-hack, penipuan), beri tahu mereka untuk segera email ke andri@student.president.ac.id.
4. Buat jawaban yang seru, engaging, dan mengalir seperti sedang chat dengan teman AI yang cerdas!

${userContext}

[FAQ DATABASE RESMI]
${faqText}
`;

      // ============================================
      // 3. Panggil Gemini API
      // ============================================
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'PASTE_YOUR_KEY_HERE') {
        return res.status(503).json({
          success: false,
          message: 'AI service belum dikonfigurasi. Silakan set GEMINI_API_KEY di file .env backend.'
        });
      }

      // Switching to gemini-1.5-flash-latest to bypass the gemini-2.0-flash rate limits
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash-latest' });

      // Build conversation history for context
      const chatHistory: { role: 'user' | 'model'; parts: { text: string }[] }[] = [];
      
      if (history && Array.isArray(history)) {
        for (const h of history.slice(-10)) { // Last 10 messages for context
          chatHistory.push({
            role: h.sender === 'user' ? 'user' : 'model',
            parts: [{ text: h.text }]
          });
        }
      }

      const chat = model.startChat({
        history: [
          { role: 'user', parts: [{ text: 'System instruction: ' + systemPrompt }] },
          { role: 'model', parts: [{ text: 'Baik, saya mengerti. Saya adalah PinjamAJA AI Assistant dan akan mematuhi semua aturan yang diberikan.' }] },
          ...chatHistory
        ],
      });

      const result = await chat.sendMessage(message);
      const responseText = result.response.text();

      // Check if response contains security escalation
      const isSecurityAlert = responseText.includes('---ESKALASI KEAMANAN---') || 
                              responseText.includes('andri@student.president.ac.id');

      // Clean up the escalation markers for frontend display
      const cleanedResponse = responseText
        .replace('---ESKALASI KEAMANAN---', '')
        .replace('---END ESKALASI---', '')
        .trim();

      return res.json({
        success: true,
        data: {
          response: cleanedResponse,
          isSecurityAlert
        }
      });

    } catch (error: any) {
      console.error('Chat AI Error:', error);
      
      // Handle specific API KEY missing/invalid error
      if (error.message?.includes('API_KEY_INVALID') || error.message?.includes('API key not valid')) {
        return res.status(503).json({
          success: false,
          message: 'API Key Gemini tidak valid. Periksa GEMINI_API_KEY di file .env.'
        });
      }

      console.warn('Gemini API failed (Quota/NotFound/Error). Using fallback offline FAQ matcher.');
      
      // Simple offline fallback matching using req.body.message
      const msgLower = (req.body.message || '').toLowerCase();
      let fallbackResponse = 'Maaf, layanan AI saat ini sedang mengalami batas limit (Quota Exceeded) atau gangguan koneksi. Namun, jika Anda memiliki keluhan keamanan silakan hubungi andri@student.president.ac.id';
      
      for (const faq of FAQ_DATA) {
        // Check if any word in the question matches the user's message
        if (msgLower.includes('password') || msgLower.includes('sandi')) {
          fallbackResponse = FAQ_DATA.find(f => f.q.toLowerCase().includes('password'))?.a || fallbackResponse;
          break;
        }
        if (msgLower.includes('qris')) {
          fallbackResponse = FAQ_DATA.find(f => f.q.toLowerCase().includes('qris'))?.a || fallbackResponse;
          break;
        }
        if (msgLower.includes('pinjam') || msgLower.includes('syarat')) {
          fallbackResponse = FAQ_DATA.find(f => f.q.toLowerCase().includes('syarat'))?.a || fallbackResponse;
          break;
        }
      }
      
      return res.json({
        success: true,
        data: {
          response: fallbackResponse,
          isSecurityAlert: false
        }
      });
    }
  }
};
