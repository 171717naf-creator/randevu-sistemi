const express = require('express');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000; 

// --- VERİ TABANI SİSTEMİ (JSON) ---
const RANDEVU_FILE = path.join(__dirname, 'randevular.json');
const USER_FILE = path.join(__dirname, 'kullanicilar.json');

function veriOku(dosya) {
    if (!fs.existsSync(dosya)) { fs.writeFileSync(dosya, JSON.stringify([], null, 2)); return []; }
    try { return JSON.parse(fs.readFileSync(dosya, 'utf8')); } catch (e) { return []; }
}
function veriYaz(dosya, veri) { fs.writeFileSync(dosya, JSON.stringify(veri, null, 2)); }

// --- AYARLAR ---
const ADMIN_EMAIL = "171717Naf@gmail.com";
const ADMIN_PASS = "12345";
const CALISMA_SAATLERI = ["12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
    secret: 'ultra_premium_secret_key_2026',
    resave: false,
    saveUninitialized: true
}));

const fTarih = (d) => d ? d.split('-').reverse().join('.') : '';

// --- ORTAK PREMIUM HTML TASARIM PARÇASI (Cam Efektli & Animasyonlu) ---
const HEAD = (title) => `
    <head>
        <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
        <script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Comfortaa:wght@500;700&family=Plus+Jakarta+Sans:wght@400;600;700&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #f8fafc; min-height: screen; }
            h1, h2, h3 { font-family: 'Comfortaa', cursive; }
            .premium-card { background: rgba(255, 255, 255, 0.06); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.08); box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5); }
        </style>
    </head>`;

// --- GİRİŞ SAYFASI ---
app.get('/login', (req, res) => {
    const msg = req.query.msg ? decodeURIComponent(req.query.msg) : '';
    res.send(`<!DOCTYPE html><html lang="tr">${HEAD('Psk. Nurdan | Giriş Yap')}
    <body class="flex items-center justify-center min-h-screen p-4">
        <div class="premium-card p-10 rounded-[32px] w-full max-w-md text-center animate__animated animate__fadeInUp">
            <div class="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-lg">
                <i class="fa-solid fa-heart-pulse text-3xl animate__animated animate__pulse animate__infinite"></i>
            </div>
            <h2 class="text-3xl font-bold text-white mb-2">Psk. Nurdan</h2>
            <p class="text-slate-400 mb-8 text-sm">Online Premium Randevu Sistemi</p>
            ${msg ? `<div class="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-2xl mb-6 text-xs font-semibold animate__animated animate__shakeX">${msg}</div>` : ''}
            <form action="/login" method="POST" class="space-y-4 text-left">
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">E-POSTA</label>
                    <input type="email" name="email" required class="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-emerald-500 transition mt-1">
                </div>
                <div>
                    <label class="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-2">ŞİFRE</label>
                    <input type="password" name="password" required class="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-emerald-500 transition mt-1">
                </div>
                <button class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-lg transition transform hover:scale-102 cursor-pointer mt-4">Giriş Yap</button>
            </form>
            <p class="mt-8 text-sm text-slate-400">Hesabınız yok mu? <a href="/register" class="text-emerald-400 font-bold hover:underline">Hemen Kayıt Olun</a></p>
        </div>
    </body></html>`);
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const users = veriOku(USER_FILE);
    const user = users.find(u => u.email === email && u.password === password);
    if (user) { req.session.user = user; res.redirect('/'); }
    else { res.redirect('/login?msg=' + encodeURIComponent('E-posta veya şifre hatalı!')); }
});

// --- KAYIT SAYFASI ---
app.get('/register', (req, res) => {
    res.send(`<!DOCTYPE html><html lang="tr">${HEAD('Psk. Nurdan | Kayıt Ol')}
    <body class="flex items-center justify-center min-h-screen p-4">
        <div class="premium-card p-10 rounded-[32px] w-full max-w-md animate__animated animate__fadeInUp">
            <h2 class="text-3xl font-bold text-white text-center mb-1">Yeni Hesap</h2>
            <p class="text-slate-400 text-center mb-8 text-sm">Psk. Nurdan Danışan Portalı</p>
            <form action="/register" method="POST" class="space-y-4">
                <input type="text" name="ad_soyad" placeholder="Adınız Soyadınız" required class="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none">
                <input type="tel" name="telefon" placeholder="Telefon Numaranız (05xx)" required class="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none">
                <input type="email" name="email" placeholder="E-posta Adresiniz" required class="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none">
                <input type="password" name="password" placeholder="Şifreniz" required class="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none">
                <button class="w-full bg-indigo-500 hover:bg-indigo-600 text-white font-bold py-5 rounded-2xl shadow-lg transition cursor-pointer mt-4">Kayıt Ol ve Başla</button>
            </form>
            <p class="mt-6 text-center text-sm text-slate-400">Zaten üye misiniz? <a href="/login" class="text-indigo-400 font-bold hover:underline">Giriş Yap</a></p>
        </div>
    </body></html>`);
});

app.post('/register', (req, res) => {
    const { ad_soyad, telefon, email, password } = req.body;
    const users = veriOku(USER_FILE);
    if (users.some(u => u.email === email)) return res.redirect('/register?msg=E-posta%20alınmış');
    users.push({ id: Date.now(), ad_soyad, telefon, email, password });
    veriYaz(USER_FILE, users);
    res.redirect('/login?msg=' + encodeURIComponent('Kayıt başarılı, giriş yapabilirsiniz.'));
});

// --- ANA PANEL (DANIŞAN PORTALI) ---
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    const bugun = new Date().toISOString().split('T')[0];
    const secilenTarih = req.query.tarih || bugun;
    const randevular = veriOku(RANDEVU_FILE);
    const alertMsg = req.query.msg ? decodeURIComponent(req.query.msg) : '';
    
    const doluSaatler = randevular.filter(r => r.tarih === secilenTarih && r.durum === 'Onaylandı').map(r => r.saat);
    const benimRandevularim = randevular.filter(r => r.email === req.session.user.email).sort((a,b) => b.id - a.id);

    let saatOptions = CALISMA_SAATLERI.map(s => {
        const isDolu = doluSaatler.includes(s);
        return `<option value="${s}" ${isDolu ? 'disabled' : ''} class="${isDolu ? 'bg-slate-800 text-slate-600' : 'bg-slate-900'}">${s} ${isDolu ? '─ [DOLU]' : '─ Müsait'}</option>`;
    }).join('');

    let listeHtml = benimRandevularim.map(r => `
        <div class="bg-white/5 border border-white/5 p-5 rounded-2xl flex justify-between items-center hover:border-white/10 transition">
            <div>
                <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">${fTarih(r.tarih)} ─ ${r.saat}</p>
                <p class="text-sm font-semibold mt-1 ${r.durum === 'Onaylandı' ? 'text-emerald-400' : (r.durum === 'Reddedildi' ? 'text-red-400' : 'text-amber-400')}">
                    <i class="fa-solid ${r.durum === 'Onaylandı' ? 'fa-circle-check' : (r.durum === 'Reddedildi' ? 'fa-circle-xmark' : 'fa-circle-dot')} text-xs mr-1"></i> ${r.durum}
                </p>
            </div>
            ${r.durum === 'Bekliyor' ? `<button onclick="confirmCancel('${r.id}')" class="text-[10px] font-bold bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white px-3 py-2 rounded-xl border border-red-500/20 transition cursor-pointer">İPTAL</button>` : ''}
        </div>
    `).join('') || '<div class="text-center py-12 text-slate-500 text-sm italic">Henüz bir randevu kaydınız bulunmuyor.</div>';

    res.send(`<!DOCTYPE html><html lang="tr">${HEAD('Psk. Nurdan | Online Randevu Al')}
    <body class="pb-20">
        <nav class="border-b border-white/5 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
            <div class="max-w-6xl mx-auto px-6 py-5 flex justify-between items-center">
                <h1 class="text-xl font-bold tracking-wider text-white"><span class="text-emerald-400">PSK. NURDAN</span> | ONLINE RANDEVU</h1>
                <div class="flex items-center gap-6">
                    <div class="text-right">
                        <p class="text-xs text-slate-400 font-medium">Hoş Geldiniz</p>
                        <p class="text-sm font-bold text-white">Sn. ${req.session.user.ad_soyad}</p>
                    </div>
                    <button onclick="confirmLogout()" class="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-red-500/20 hover:text-red-400 rounded-xl text-slate-400 transition cursor-pointer"><i class="fa-solid fa-power-off"></i></button>
                </div>
            </div>
        </nav>

        <main class="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div class="lg:col-span-2">
                <div class="premium-card p-8 rounded-[32px] animate__animated animate__fadeInLeft">
                    <h3 class="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                        <i class="fa-regular fa-calendar-check text-emerald-400 animate__animated animate__pulse animate__infinite"></i> Yeni Seans Rezervasyonu
                    </h3>
                    <form action="/randevu-al" method="POST" class="space-y-6">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">RANDEVU TARİHİ</label>
                                <input type="date" name="tarih" value="${secilenTarih}" min="${bugun}" onchange="location.href='/?tarih='+this.value" class="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-emerald-500 outline-none">
                            </div>
                            <div>
                                <label class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">MÜSAİT SAATLER (12:00 - 19:00)</label>
                                <select name="saat" required class="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-emerald-500 outline-none">
                                    <option value="">Saat Seçiniz...</option>
                                    ${saatOptions}
                                </select>
                            </div>
                        </div>
                        <div>
                            <label class="block text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">İletmek İstediğiniz Not</label>
                            <textarea name="notlar" rows="4" class="w-full px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:border-emerald-500 outline-none resize-none" placeholder="Eklemek istediğiniz özel bir durum varsa buraya yazabilirsiniz..."></textarea>
                        </div>
                        <button class="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-5 rounded-2xl shadow-xl transition cursor-pointer">SEANS TALEBİNİ GÖNDER</button>
                    </form>
                </div>
            </div>
            <div>
                <div class="premium-card p-8 rounded-[32px] h-full animate__animated animate__fadeInRight flex flex-col">
                    <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-3">
                        <i class="fa-solid fa-clock-rotate-left text-indigo-400"></i> Seans Geçmişim
                    </h3>
                    <div class="overflow-y-auto flex-1 space-y-3 max-h-[480px] pr-2">
                        ${listeHtml}
                    </div>
                </div>
            </div>
        </main>

        <script>
            function confirmCancel(id) {
                Swal.fire({
                    title: 'Emin misiniz?', text: "Randevu talebiniz silinecektir.", icon: 'warning',
                    showCancelButton: true, confirmButtonColor: '#ef4444', cancelButtonColor: '#334155',
                    confirmButtonText: 'Evet, İptal Et', cancelButtonText: 'Vazgeç'
                }).then((result) => { if (result.isConfirmed) { location.href = '/iptal/' + id; } })
            }
            function confirmLogout() {
                Swal.fire({
                    title: 'Çıkış Yapılıyor', text: "Oturumunuz kapatılacaktır.", icon: 'question',
                    showCancelButton: true, confirmButtonColor: '#10b981', cancelButtonColor: '#334155',
                    confirmButtonText: 'Güvenli Çıkış', cancelButtonText: 'Kalan'
                }).then((result) => { if (result.isConfirmed) { location.href = '/logout'; } })
            }
            ${alertMsg ? `Swal.fire({ title: 'Sistem Mesajı', text: '${alertMsg}', icon: 'success', confirmButtonColor: '#10b981' });` : ''}
        </script>
    </body></html>`);
});

app.post('/randevu-al', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const { tarih, saat, notlar } = req.body;
    const randevular = veriOku(RANDEVU_FILE);
    
    if (randevular.some(r => r.tarih === tarih && r.saat === saat && r.durum === 'Onaylandı')) {
        return res.redirect('/?msg=' + encodeURIComponent('Seçilen seans saati az önce doldu!'));
    }

    randevular.push({
        id: Date.now(), ad_soyad: req.session.user.ad_soyad, telefon: req.session.user.telefon, email: req.session.user.email, tarih, saat, notlar, durum: 'Bekliyor'
    });
    veriYaz(RANDEVU_FILE, randevular);
    res.redirect('/?msg=' + encodeURIComponent('Seans talebiniz başarıyla kuyruğa alındı.'));
});

app.get('/iptal/:id', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    let randevular = veriOku(RANDEVU_FILE);
    randevular = randevular.filter(r => !(r.id == req.params.id && r.email === req.session.user.email));
    veriYaz(RANDEVU_FILE, randevular);
    res.redirect('/?msg=' + encodeURIComponent('Randevu talebiniz başarıyla iptal edildi.'));
});

// --- YÖNETİCİ (ADMIN) PANELİ ---
app.get('/admin', (req, res) => {
    if (!req.session.is_admin) {
        return res.send(`<!DOCTYPE html><html>${HEAD('Psk. Nurdan | Yönetici Girişi')}
        <body class="flex items-center justify-center min-h-screen p-4">
            <div class="premium-card p-10 rounded-3xl w-full max-w-sm text-center">
                <h2 class="text-2xl font-bold mb-6 text-white">Yönetici Girişi</h2>
                <form action="/admin/login" method="POST" class="space-y-4 text-left">
                    <input type="text" name="user" placeholder="Kullanıcı Adı" required class="w-full p-4 bg-white/5 border border-white/10 text-white rounded-2xl outline-none">
                    <input type="password" name="pass" placeholder="Şifre" required class="w-full p-4 bg-white/5 border border-white/10 text-white rounded-2xl outline-none">
                    <button class="w-full bg-slate-100 text-slate-900 py-4 rounded-2xl font-bold cursor-pointer">Giriş Yap</button>
                </form>
            </div>
        </body></html>`);
    }

    const randevular = veriOku(RANDEVU_FILE).sort((a,b) => b.id - a.id);
    const stats = {
        bekleyen: randevular.filter(r => r.durum === 'Bekliyor').length,
        onayli: randevular.filter(r => r.durum === 'Onaylandı').length,
        toplam: randevular.length
    };

    let tabloRows = randevular.map(r => `
        <tr class="hover:bg-white/[0.02] transition border-b border-white/5">
            <td class="p-5"><p class="font-bold text-white">${r.ad_soyad}</p><p class="text-xs text-slate-400">${r.telefon}</p></td>
            <td class="p-5 text-sm"><p class="font-medium text-white">${fTarih(r.tarih)}</p><p class="text-xs text-emerald-400 font-semibold mt-0.5">${r.saat}</p></td>
            <td class="p-5 text-xs text-slate-400 max-w-[200px] truncate">${r.notlar || '─'}</td>
            <td class="p-5"><span class="text-[10px] font-bold px-2.5 py-1 rounded-full ${r.durum === 'Onaylandı' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : (r.durum === 'Reddedildi' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20')}">${r.durum}</span></td>
            <td class="p-5 text-right space-x-1">
                ${r.durum === 'Bekliyor' ? `
                    <a href="/admin/islem/onayla/${r.id}" class="inline-block w-9 h-9 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl leading-9 text-center text-sm shadow-lg transition"><i class="fa-solid fa-check"></i></a>
                    <a href="/admin/islem/reddet/${r.id}" class="inline-block w-9 h-9 bg-red-500 hover:bg-red-600 text-white rounded-xl leading-9 text-center text-sm shadow-lg transition"><i class="fa-solid fa-xmark"></i></a>
                ` : `<a href="/admin/islem/beklet/${r.id}" class="text-xs text-slate-500 hover:text-slate-300 underline">Geri Al</a>`}
            </td>
        </tr>
    `).join('') || '<tr><td colspan="5" class="p-10 text-center text-slate-500 italic text-sm">Sistemde henüz talep yok.</td></tr>';

    res.send(`<!DOCTYPE html><html>${HEAD('Psk. Nurdan | Yönetim Paneli')}
    <body class="bg-slate-950 text-slate-100 min-h-screen pb-20">
        <div class="border-b border-white/5 bg-slate-900/60 backdrop-blur-md p-5 px-8 flex justify-between items-center shadow-2xl">
            <p class="font-bold tracking-widest text-sm text-emerald-400">PSK. NURDAN YÖNETİM MERKEZİ v3.0</p>
            <a href="/admin/logout" class="text-xs bg-white/5 border border-white/10 px-4 py-2 rounded-xl hover:bg-red-500 hover:text-white transition">Güvenli Çıkış</a>
        </div>
        <div class="max-w-6xl mx-auto p-8">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div class="premium-card p-6 rounded-2xl"><p class="text-xs font-bold text-slate-400 mb-1 tracking-wider">BEKLEYEN BAŞVURU</p><p class="text-4xl font-black text-amber-400">${stats.bekleyen}</p></div>
                <div class="premium-card p-6 rounded-2xl"><p class="text-xs font-bold text-slate-400 mb-1 tracking-wider">ONAYLANAN SEANS</p><p class="text-4xl font-black text-emerald-400">${stats.onayli}</p></div>
                <div class="premium-card p-6 rounded-2xl"><p class="text-xs font-bold text-slate-400 mb-1 tracking-wider">TOPLAM SEANS</p><p class="text-4xl font-black text-indigo-400">${stats.toplam}</p></div>
            </div>
            <div class="mb-6">
                <input type="text" id="adminSearch" onkeyup="searchTable()" placeholder="Danışan adı veya telefon numarası ara..." class="w-full max-w-md px-5 py-4 rounded-2xl bg-white/5 border border-white/10 text-white outline-none focus:border-emerald-500 transition">
            </div>
            <div class="premium-card rounded-[24px] overflow-hidden">
                <table class="w-full text-left" id="randevuTablosu">
                    <thead class="bg-white/5 border-b border-white/5">
                        <tr class="text-[10px] font-black text-slate-400 uppercase tracking-widest"><th class="p-5">Danışan</th><th class="p-5">Seans Zamanı</th><th class="p-5">Notlar</th><th class="p-5">Durum</th><th class="p-5 text-right">Müdahale</th></tr>
                    </thead>
                    <tbody>${tabloRows}</tbody>
                </table>
            </div>
        </div>
        <script>
            function searchTable() {
                let input = document.getElementById("adminSearch").value.toUpperCase();
                let rows = document.getElementById("randevuTablosu").getElementsByTagName("tr");
                for (let i = 1; i < rows.length; i++) {
                    let text = rows[i].innerText.toUpperCase();
                    rows[i].style.display = text.indexOf(input) > -1 ? "" : "none";
                }
            }
        </script>
    </body></html>`);
});

app.post('/admin/login', (req, res) => {
    const { user, pass } = req.body;
    if ((user === ADMIN_EMAIL || user === "admin") && pass === ADMIN_PASS) { req.session.is_admin = true; res.redirect('/admin'); }
    else { res.redirect('/admin'); }
});

app.get('/admin/islem/:tip/:id', (req, res) => {
    if (!req.session.is_admin) return res.redirect('/admin');
    let randevular = veriOku(RANDEVU_FILE);
    randevular = randevular.map(r => {
        if (r.id == req.params.id) {
            if (req.params.tip === 'onayla') r.durum = 'Onaylandı';
            else if (req.params.tip === 'reddet') r.durum = 'Reddedildi';
            else r.durum = 'Bekliyor';
        }
        return r;
    });
    veriYaz(RANDEVU_FILE, randevular);
    res.redirect('/admin');
});

app.get('/admin/logout', (req, res) => { req.session.is_admin = false; res.redirect('/admin'); });
app.get('/logout', (req, res) => { req.session.user = null; res.redirect('/login'); });

app.listen(PORT, () => console.log(`Sistem Aktif: http://localhost:${PORT}`));