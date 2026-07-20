import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import jsQR from 'jsqr';
import { useNavigate } from 'react-router-dom';
import { 
  Globe, ArrowRightLeft, RefreshCw, QrCode, Scan, 
  ChevronRight, ArrowRight, ShieldCheck, CheckCircle2, 
  MapPin, Loader2, AlertCircle
} from 'lucide-react';
import { formatRupiah, formatDate, formatTime, getCountryFlag } from '@/helpers/format';
import { qrisTransactions as initialQrisTxs, exchangeRates } from '@/data/mockData';
import { useAuthStore } from '@/stores/authStore';
import { useSavingsStore } from '@/stores/savingsStore';
import { logAudit, logSecurityEvent } from '@/stores/auditStore';
import { useNotificationStore } from '@/stores/notificationStore';
import StatusBadge from '@/components/StatusBadge';
import PageHeader from '@/components/PageHeader';

export default function QRISPage() {
  const navigate = useNavigate();
  const user = useAuthStore(s => s.user)!;
  const accounts = useSavingsStore(s => s.accounts);
  
  // Tabs: 'scan' | 'my_qr' | 'history'
  const [activeTab, setActiveTab] = useState<'scan' | 'my_qr' | 'history'>('scan');
  const [selectedTx, setSelectedTx] = useState<string | null>(null);

  // Scan states
  const [scanStep, setScanStep] = useState<'camera' | 'amount' | 'confirm' | 'pin' | 'receipt'>('camera');
  const [scanError, setScanError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Camera real refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [scanDetected, setScanDetected] = useState(false);

  // Bersihkan kamera saat unmount atau pindah step
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) clearInterval(scanIntervalRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    setCameraReady(false);
  }, []);

  // Parser QRIS payload (format EMVCo TLV)
  const parseQrisPayload = useCallback((raw: string): { valid: boolean; merchantName: string; merchantCity: string; currency: string; country: string; amount: string } => {
    const result = { valid: false, merchantName: '', merchantCity: '', currency: '', country: '', amount: '' };
    if (!raw || raw.length < 10) return result;
    // Cek Payload Format Indicator (tag 00 = '01')
    const tag00 = raw.substring(0, 2) === '00' ? raw.substring(4, 6) : '';
    if (tag00 !== '01' && !raw.startsWith('00020101')) return result; // bukan QRIS
    let i = 0;
    while (i < raw.length - 4) {
      const tag = raw.substring(i, i + 2);
      const lenStr = raw.substring(i + 2, i + 4);
      const len = parseInt(lenStr, 10);
      if (isNaN(len)) break;
      const value = raw.substring(i + 4, i + 4 + len);
      if (tag === '53') result.currency = value; // 360 = IDR
      if (tag === '54') result.amount = value;
      if (tag === '58') result.country = value;
      if (tag === '59') result.merchantName = value;
      if (tag === '60') result.merchantCity = value;
      i += 4 + len;
    }
    result.valid = result.merchantName.length > 0 || result.country.length > 0;
    return result;
  }, []);

  // Mulai kamera
  const startCamera = useCallback(async () => {
    setCameraError('');
    setScanDetected(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraReady(true);
        // Mulai scan frame tiap 200ms
        scanIntervalRef.current = setInterval(() => {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
          if (code?.data) {
            const qris = parseQrisPayload(code.data);
            if (qris.valid) {
              setScanDetected(true);
              stopCamera();
              // Map ke merchant
              const currencyMap: Record<string, string> = { '360': 'IDR', '702': 'SGD', '458': 'MYR', '764': 'THB' };
              const currency = currencyMap[qris.currency] || 'IDR';
              const rateMap: Record<string, number> = { IDR: 1, SGD: 12200, MYR: 3600, THB: 450 };
              const feeMap: Record<string, number> = { IDR: 0, SGD: 2500, MYR: 2500, THB: 2500 };
              const countryMap: Record<string, string> = { ID: '🇮🇩', SG: '🇸🇬', MY: '🇲🇾', TH: '🇹🇭' };
              const countryCode = (qris.country || 'ID') as 'ID'|'SG'|'MY'|'TH';
              const flag = countryMap[countryCode] || '';
              setMerchant({
                name: `${qris.merchantName || 'Merchant'} ${flag}`,
                merchantId: `MID-${countryCode}-SCAN`,
                country: countryCode,
                currency,
                rate: rateMap[currency] || 1,
                fee: feeMap[currency] || 0
              });
              if (qris.amount) setForeignAmount(qris.amount);
              // Cross-border KYC check
              const kycLower = user.kycStatus?.toLowerCase();
              if (countryCode !== 'ID' && kycLower !== 'verified' && kycLower !== 'approved') {
                setShowKycModal(true);
                setScanStep('camera');
              } else {
                setScanStep(qris.amount ? 'confirm' : 'amount');
              }
            } else {
              // QR terdeteksi tapi bukan QRIS
              setScanError('QR Code ini bukan format QRIS yang valid. Coba scan ulang.');
            }
          }
        }, 200);
      }
    } catch (err: any) {
      if (err.name === 'NotAllowedError') {
        setCameraError('Akses kamera ditolak. Izinkan kamera di pengaturan browser Anda.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('Kamera tidak ditemukan di perangkat ini.');
      } else {
        setCameraError('Gagal membuka kamera: ' + err.message);
      }
    }
  }, [parseQrisPayload, stopCamera, user.kycStatus]);

  // Auto-start kamera saat tab scan aktif & step camera
  useEffect(() => {
    if (activeTab === 'scan' && scanStep === 'camera') {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [activeTab, scanStep]);

  // Selected merchant for fallback simulation
  const [merchant, setMerchant] = useState({
    name: 'Food Court Maxwell 🇸🇬',
    merchantId: 'MID-SG-998877',
    country: 'SG',
    currency: 'SGD',
    rate: 12100, // 1 SGD = 12.100 IDR
    fee: 2500
  });

  const [foreignAmount, setForeignAmount] = useState('');
  const [enteredPin, setEnteredPin] = useState('');
  
  // Receipt data
  const [receiptData, setReceiptData] = useState<any>(null);

  // Active savings account
  const activeAccount = useMemo(() => accounts.find(a => a.isActive) || accounts[0], [accounts]);

  // Conversion calculations
  const conversionDetails = useMemo(() => {
    const fAmt = Number(foreignAmount) || 0;
    const converted = Math.round(fAmt * merchant.rate);
    const total = converted + merchant.fee;
    return {
      converted,
      total
    };
  }, [foreignAmount, merchant]);

  // Local list of QRIS transactions
  const [localQrisTxs, setLocalQrisTxs] = useState(initialQrisTxs);

  const [showKycModal, setShowKycModal] = useState(false);

  const startSimulation = (countryCode: 'ID' | 'SG' | 'MY' | 'TH') => {
    setScanError('');
    setForeignAmount('');
    setEnteredPin('');
    setShowKycModal(false);
    
    // Cross-border KYC check — accept both 'verified' and 'approved' (case-insensitive)
    const kycLower = user.kycStatus?.toLowerCase();
    if (countryCode !== 'ID' && kycLower !== 'verified' && kycLower !== 'approved') {
      setShowKycModal(true);
      return;
    }
    
    if (countryCode === 'ID') {
      setMerchant({
        name: 'Kopi Kenangan Senayan 🇮🇩',
        merchantId: 'MID-ID-442211',
        country: 'ID',
        currency: 'IDR',
        rate: 1,
        fee: 0
      });
    } else if (countryCode === 'SG') {
      setMerchant({
        name: 'Maxwell Food Centre 🇸🇬',
        merchantId: 'MID-SG-889900',
        country: 'SG',
        currency: 'SGD',
        rate: 12200,
        fee: 2500
      });
    } else if (countryCode === 'MY') {
      setMerchant({
        name: 'Restoran Nasi Kandar KL 🇲🇾',
        merchantId: 'MID-MY-554433',
        country: 'MY',
        currency: 'MYR',
        rate: 3600,
        fee: 2500
      });
    } else {
      setMerchant({
        name: 'Chatuchak Weekend Market 🇹🇭',
        merchantId: 'MID-TH-112233',
        country: 'TH',
        currency: 'THB',
        rate: 450,
        fee: 2500
      });
    }
    setScanStep('amount');
  };

  const handleAmountSubmit = () => {
    const fAmt = Number(foreignAmount);
    if (!fAmt || fAmt <= 0) {
      setScanError('Masukkan nominal yang valid');
      return;
    }
    if (conversionDetails.total > activeAccount.balance) {
      setScanError('Saldo tabungan Anda tidak mencukupi');
      return;
    }
    setScanError('');
    setScanStep('confirm');
  };

  const handlePinInput = (num: string) => {
    if (enteredPin.length < 6) {
      const newVal = enteredPin + num;
      setEnteredPin(newVal);
      if (newVal.length === 6) {
        processPayment(newVal);
      }
    }
  };

  const processPayment = async (pin: string) => {
    setIsLoading(true);
    setScanError('');
    await new Promise(r => setTimeout(r, 1200)); // Simulate payment delay

    // Verify PIN using backend secure endpoint
    const isPinValid = await useAuthStore.getState().verifyPIN(pin);
    if (!isPinValid) {
      setIsLoading(false);
      setEnteredPin('');
      setScanError(useAuthStore.getState().error || 'PIN yang Anda masukkan salah');
      logSecurityEvent(user.id, user.fullName, 'QRIS_PAYMENT_PIN_FAILED', 'medium', `Failed QRIS payment PIN verification for ${merchant.name}`);
      return;
    }

    // Deduct savings balance and log transaction
    const totalDeducted = conversionDetails.total;
    
    useSavingsStore.setState((state) => {
      const updatedAccounts = state.accounts.map(acc => 
        acc.id === activeAccount.id ? { ...acc, balance: acc.balance - totalDeducted } : acc
      );
      
      const newSavingsTx = {
        id: `ST-${Date.now()}`,
        accountId: activeAccount.id,
        userId: user.id,
        type: 'qris_payment' as any,
        amount: totalDeducted,
        balanceAfter: activeAccount.balance - totalDeducted,
        description: `QRIS: ${merchant.name}`,
        status: 'completed' as any,
        createdAt: new Date().toISOString()
      };
      
      return {
        accounts: updatedAccounts,
        transactions: [newSavingsTx, ...state.transactions]
      };
    });

    // Create QRIS transaction history entry
    const newQrisTx = {
      id: `QRIS-${Date.now()}`,
      userId: user.id,
      merchantName: merchant.name,
      merchantId: merchant.merchantId,
      country: merchant.country as any,
      countryName: merchant.country === 'ID' ? 'Indonesia' : merchant.country === 'SG' ? 'Singapore' : merchant.country === 'MY' ? 'Malaysia' : 'Thailand',
      originalAmount: Number(foreignAmount),
      originalCurrency: merchant.currency,
      convertedAmount: conversionDetails.converted,
      convertedCurrency: 'IDR',
      exchangeRate: merchant.rate,
      fee: merchant.fee,
      totalAmount: totalDeducted,
      status: 'completed' as any,
      createdAt: new Date().toISOString()
    };

    setLocalQrisTxs([newQrisTx, ...localQrisTxs]);
    setReceiptData(newQrisTx);

    // Event Audit Logging
    const eventName = merchant.country === 'ID' ? 'QRIS_PAYMENT' : 'CROSS_BORDER_PAYMENT';
    logAudit(
      user.id,
      user.fullName,
      'QRIS',
      eventName,
      `QRIS payment of ${merchant.currency} ${foreignAmount} (Rp ${totalDeducted.toLocaleString('id-ID')}) to ${merchant.name} successful`,
      'success',
      {
        merchantId: merchant.merchantId,
        merchantName: merchant.name,
        country: merchant.country,
        amount: totalDeducted,
        originalAmount: Number(foreignAmount),
        originalCurrency: merchant.currency
      }
    );

    useNotificationStore.getState().addNotification({
      userId: user.id,
      title: 'Pembayaran QRIS Berhasil',
      message: `Pembayaran ke ${merchant.name} sebesar ${merchant.currency} ${foreignAmount} (Rp ${totalDeducted.toLocaleString('id-ID')}) berhasil.`,
      type: 'transaction',
    });

    setIsLoading(false);
    setScanStep('receipt');
  };

  return (
    <div style={{ paddingBottom: 80 }}>
      <PageHeader title="QRIS Internasional" onBack={() => navigate('/')} />

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', padding: '0 16px', background: 'var(--color-surface)' }}>
        {[
          { key: 'scan', label: 'Scan QRIS' },
          { key: 'my_qr', label: 'Tunjukkan QR' },
          { key: 'history', label: 'Riwayat' }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key as any);
              setScanStep('camera');
              setScanError('');
            }}
            className={activeTab === tab.key ? 'tab-active' : 'tab-inactive'}
            style={{ flex: 1, padding: '14px 0', fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-sans)', borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent' }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '16px' }}>

        {/* ==================================== */}
        {/* TABS 1: SCAN QRIS                    */}
        {/* ==================================== */}
        {activeTab === 'scan' && (
          <div>
            {/* STEP: CAMERA VIEW SIMULATION */}
            {scanStep === 'camera' && (
              <div className="animate-fade-in" style={{ textAlign: 'center' }}>

                {/* === KAMERA REAL === */}
                <div style={{
                  width: '100%', borderRadius: 'var(--radius-lg)',
                  background: '#0D0D1A', position: 'relative', overflow: 'hidden',
                  marginBottom: 16, border: '2px solid var(--color-border)',
                  aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  {/* Video kamera real */}
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraReady ? 'block' : 'none' }}
                  />
                  {/* Canvas tersembunyi untuk jsQR processing */}
                  <canvas ref={canvasRef} style={{ display: 'none' }} />

                  {/* Overlay frame pemandu saat kamera aktif */}
                  {cameraReady && (
                    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {/* Corner brackets */}
                      {[{ top: '20%', left: '20%', borderTop: '3px solid', borderLeft: '3px solid', borderTopLeftRadius: 8 },
                        { top: '20%', right: '20%', borderTop: '3px solid', borderRight: '3px solid', borderTopRightRadius: 8 },
                        { bottom: '20%', left: '20%', borderBottom: '3px solid', borderLeft: '3px solid', borderBottomLeftRadius: 8 },
                        { bottom: '20%', right: '20%', borderBottom: '3px solid', borderRight: '3px solid', borderBottomRightRadius: 8 }
                      ].map((s, i) => (
                        <div key={i} style={{ position: 'absolute', width: 32, height: 32, borderColor: scanDetected ? '#10B981' : 'var(--color-primary)', ...s }} />
                      ))}
                      {/* Laser scan line */}
                      <div style={{
                        position: 'absolute', left: '20%', right: '20%', height: 2,
                        background: scanDetected ? '#10B981' : 'var(--color-primary)',
                        boxShadow: `0 0 8px ${scanDetected ? '#10B981' : 'var(--color-primary)'}`,
                        animation: 'shimmer 2s infinite ease-in-out'
                      }} />
                    </div>
                  )}

                  {/* Loading kamera */}
                  {!cameraReady && !cameraError && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <Loader2 size={32} color="var(--color-primary)" style={{ animation: 'spin 1s linear infinite' }} />
                      <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>Membuka kamera...</p>
                    </div>
                  )}

                  {/* Error kamera */}
                  {cameraError && (
                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                      <AlertCircle size={32} color="#EF4444" />
                      <p style={{ color: '#EF4444', fontSize: 12, textAlign: 'center' }}>{cameraError}</p>
                      <button className="btn-outline" onClick={startCamera} style={{ fontSize: 12, padding: '8px 16px' }}>
                        Coba Lagi
                      </button>
                    </div>
                  )}
                </div>

                {/* Status scan */}
                {cameraReady && (
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                    Arahkan kamera ke QR Code QRIS
                  </p>
                )}

                {/* Error QR bukan QRIS */}
                {scanError && (
                  <div style={{ marginBottom: 12, padding: '10px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-md)', display: 'flex', gap: 8, alignItems: 'center' }}>
                    <AlertCircle size={14} color="#EF4444" />
                    <span style={{ fontSize: 12, color: '#EF4444' }}>{scanError}</span>
                    <button onClick={() => { setScanError(''); startCamera(); }} style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}>Scan Ulang</button>
                  </div>
                )}

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0' }}>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                  <span style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>atau pilih negara manual</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--color-border)' }} />
                </div>

                {/* Tombol pilih negara (fallback) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                  {[
                    { code: 'ID', label: 'Indo 🇮🇩' },
                    { code: 'SG', label: 'SGP 🇸🇬' },
                    { code: 'MY', label: 'MYS 🇲🇾' },
                    { code: 'TH', label: 'THA 🇹🇭' }
                  ].map(c => (
                    <button
                      key={c.code}
                      onClick={() => startSimulation(c.code as any)}
                      className="btn-outline animate-scale-in"
                      style={{ padding: '10px 4px', fontSize: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
                    >
                      <span>{getCountryFlag(c.code)}</span>
                      <span>{c.code}</span>
                    </button>
                  ))}
                </div>

                {/* KYC Modal */}
                {showKycModal && (
                  <div className="animate-fade-in-up" style={{ marginTop: 16, padding: 16, background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--color-border)', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ShieldCheck size={20} color="var(--color-danger)" />
                      </div>
                      <div>
                        <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-primary)' }}>Verifikasi Diperlukan</h4>
                        <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>Untuk Cross-Border QRIS</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 16 }}>
                      Fitur QRIS antar negara memerlukan verifikasi identitas (e-KYC) tambahan sesuai regulasi yang berlaku.
                    </p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn-outline" onClick={() => setShowKycModal(false)} style={{ flex: 1, padding: 10, fontSize: 12 }}>Nanti</button>
                      <button className="btn-primary" onClick={() => navigate('/kyc?redirect=/qris')} style={{ flex: 1, padding: 10, fontSize: 12 }}>Verifikasi Sekarang</button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP: AMOUNT INPUT */}
            {scanStep === 'amount' && (
              <div className="animate-fade-in-up">
                <div className="card" style={{ padding: 16, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--color-primary-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    {getCountryFlag(merchant.country)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: 14, fontWeight: 700 }}>{merchant.name}</h4>
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>ID: {merchant.merchantId}</p>
                  </div>
                </div>

                <div style={{ marginBottom: 20 }}>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, marginBottom: 8 }}>
                    Nominal Transaksi ({merchant.currency})
                  </label>
                  <div style={{ position: 'relative' }}>
                    <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontWeight: 800, fontSize: 20 }}>
                      {merchant.currency}
                    </span>
                    <input
                      type="text"
                      inputMode="numeric"
                      className="input-field"
                      placeholder="0"
                      value={foreignAmount ? Number(foreignAmount).toLocaleString('id-ID') : ''}
                      onChange={(e) => {
                        setScanError('');
                        const rawValue = e.target.value.replace(/\D/g, '');
                        setForeignAmount(rawValue);
                      }}
                      style={{ paddingLeft: 64, fontSize: 22, fontWeight: 800 }}
                      autoFocus
                    />
                  </div>
                  {merchant.rate > 1 && (
                    <p style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
                      Kurs Hari Ini: 1 {merchant.currency} = {formatRupiah(merchant.rate)}
                    </p>
                  )}
                </div>

                {/* Account Balance Info */}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 24 }}>
                  <span>Saldo Anda: <strong>{formatRupiah(activeAccount.balance)}</strong></span>
                </div>

                {scanError && (
                  <div className="card" style={{ background: 'var(--color-danger-light)', borderColor: '#FFCCCB', padding: 12, display: 'flex', gap: 8, marginBottom: 20 }}>
                    <AlertCircle size={16} color="var(--color-danger)" />
                    <span style={{ fontSize: 12, color: 'var(--color-danger)', fontWeight: 600 }}>{scanError}</span>
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-outline" onClick={() => setScanStep('camera')} style={{ flex: 1, padding: 12 }}>Batal</button>
                  <button className="btn-primary" onClick={handleAmountSubmit} style={{ flex: 2, padding: 12 }}>Lanjutkan</button>
                </div>
              </div>
            )}

            {/* STEP: CONFIRMATION DETAILS */}
            {scanStep === 'confirm' && (
              <div className="animate-fade-in-up">
                <h3 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16, textAlign: 'center' }}>Detail Konfirmasi QRIS</h3>
                
                <div className="card" style={{ padding: 16, marginBottom: 20 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Merchant</span>
                      <span style={{ fontWeight: 700 }}>{merchant.name}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Negara</span>
                      <span>{merchant.country === 'ID' ? 'Indonesia' : 'Cross Border QRIS'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Jumlah Asli</span>
                      <span style={{ fontWeight: 700 }}>{merchant.currency} {Number(foreignAmount).toLocaleString()}</span>
                    </div>
                    {merchant.rate > 1 && (
                      <>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Kurs Konversi</span>
                          <span>1 {merchant.currency} = {formatRupiah(merchant.rate)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Konversi Rupiah</span>
                          <span style={{ fontWeight: 700 }}>{formatRupiah(conversionDetails.converted)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Biaya Transaksi Cross-Border</span>
                          <span>{formatRupiah(merchant.fee)}</span>
                        </div>
                      </>
                    )}
                    <div style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700 }}>Total Pembayaran</span>
                      <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--color-primary)' }}>{formatRupiah(conversionDetails.total)}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn-outline" onClick={() => setScanStep('amount')} style={{ flex: 1, padding: 12 }}>Kembali</button>
                  <button className="btn-primary" onClick={() => setScanStep('pin')} style={{ flex: 2, padding: 12 }}>Bayar Sekarang</button>
                </div>
              </div>
            )}

            {/* STEP: PIN CONFIRMATION */}
            {scanStep === 'pin' && (
              <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', minHeight: 350 }}>
                <div style={{ textAlign: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: 8 }}>Masukkan PIN Transaksi</h3>
                  <p style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Konfirmasi PIN 6 digit untuk pembayaran sebesar {formatRupiah(conversionDetails.total)}</p>
                  
                  {/* Pin Dots */}
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 14, margin: '20px 0' }}>
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} style={{
                        width: 14, height: 14, borderRadius: '50%',
                        border: '2px solid var(--color-primary)',
                        background: i < enteredPin.length ? 'var(--color-primary)' : 'none',
                        transition: 'all 0.15s ease'
                      }} />
                    ))}
                  </div>

                  {scanError && (
                    <div style={{ color: 'var(--color-danger)', fontSize: 12, fontWeight: 600 }}>{scanError}</div>
                  )}
                  {isLoading && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                      <Loader2 className="animate-spin" size={14} /> Memproses Pembayaran...
                    </div>
                  )}
                </div>

                {/* Keypad */}
                {!isLoading && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 18px', justifyItems: 'center', maxWidth: 260, margin: '0 auto' }}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                      <button key={num} onClick={() => handlePinInput(num)} className="keypad-btn">{num}</button>
                    ))}
                    <button onClick={() => setScanStep('confirm')} style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-muted)', border: 'none', background: 'none', cursor: 'pointer' }}>Batal</button>
                    <button onClick={() => handlePinInput('0')} className="keypad-btn">0</button>
                    <button onClick={() => setEnteredPin(enteredPin.slice(0, -1))} style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-danger)', border: 'none', background: 'none', cursor: 'pointer' }}>Hapus</button>
                  </div>
                )}
              </div>
            )}

            {/* STEP: RECEIPT SUCCESS */}
            {scanStep === 'receipt' && receiptData && (
              <div className="animate-scale-in" style={{ textAlign: 'center', padding: '16px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--color-success-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle2 size={32} color="var(--color-success)" />
                </div>
                
                <h3 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>Pembayaran Sukses!</h3>
                <p style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-primary)', marginBottom: 20 }}>
                  {formatRupiah(receiptData.totalAmount)}
                </p>

                <div className="card" style={{ padding: 16, marginBottom: 24, textAlign: 'left', fontSize: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Merchant</span>
                    <span style={{ fontWeight: 700 }}>{receiptData.merchantName}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>ID Transaksi</span>
                    <span style={{ fontWeight: 500 }}>{receiptData.id}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ color: 'var(--color-text-secondary)' }}>Waktu Transaksi</span>
                    <span>{formatDate(receiptData.createdAt)}</span>
                  </div>
                  {receiptData.exchangeRate > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, borderTop: '1px solid var(--color-border-light)', paddingTop: 8 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Jumlah Asli</span>
                      <span>{receiptData.originalCurrency} {receiptData.originalAmount.toLocaleString()}</span>
                    </div>
                  )}
                  {receiptData.exchangeRate > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Kurs</span>
                      <span>1 {receiptData.originalCurrency} = {formatRupiah(receiptData.exchangeRate)}</span>
                    </div>
                  )}
                  {receiptData.fee > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Biaya</span>
                      <span>{formatRupiah(receiptData.fee)}</span>
                    </div>
                  )}
                </div>

                <button className="btn-primary" onClick={() => setScanStep('camera')} style={{ width: '100%', padding: '14px' }}>
                  Kembali ke Scanner
                </button>
              </div>
            )}
          </div>
        )}

        {/* ==================================== */}
        {/* TABS 2: SHOW MY QR CODE              */}
        {/* ==================================== */}
        {activeTab === 'my_qr' && (
          <div className="animate-scale-in" style={{ textAlign: 'center', padding: '24px 0' }}>
            <div className="card" style={{ padding: '24px', maxWidth: 300, margin: '0 auto 20px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <h3 style={{ fontSize: 15, fontWeight: 800, marginBottom: 4 }}>{user.fullName}</h3>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 20 }}>PinjamAJA QRIS Account</p>
              
              {/* Fake QR code SVG */}
              <div style={{ padding: 12, background: 'white', border: '1px solid var(--color-border)', borderRadius: 12, display: 'inline-block' }}>
                <QrCode size={180} color="var(--color-primary-dark)" />
              </div>
              <p style={{ fontSize: 10, color: 'var(--color-text-muted)', marginTop: 16 }}>Tunjukkan QR ini ke kasir untuk menerima pembayaran</p>
            </div>
            
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', alignItems: 'center', fontSize: 12, color: 'var(--color-text-secondary)' }}>
              <MapPin size={14} color="var(--color-primary)" />
              <span>Negara Asal: <strong>Indonesia 🇮🇩</strong></span>
            </div>
          </div>
        )}

        {/* ==================================== */}
        {/* TABS 3: HISTORY                      */}
        {/* ==================================== */}
        {activeTab === 'history' && (
          <div className="animate-fade-in">
            <div className="stagger-children">
              {localQrisTxs.map((tx) => (
                <div key={tx.id}>
                  <button
                    className="card card-hover"
                    onClick={() => setSelectedTx(selectedTx === tx.id ? null : tx.id)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      marginBottom: 8,
                      textAlign: 'left',
                      cursor: 'pointer',
                      fontFamily: 'var(--font-sans)',
                      border: '1px solid var(--color-border-light)',
                      background: 'var(--color-surface)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: 'var(--radius-md)',
                        background: 'var(--color-surface-secondary)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0
                      }}>
                        {getCountryFlag(tx.country)}
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tx.merchantName}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--color-text-muted)' }}>
                          {tx.countryName} · {formatDate(tx.createdAt, 'relative')}
                        </p>
                      </div>
                      
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: 13, fontWeight: 800 }}>-{formatRupiah(tx.totalAmount)}</p>
                        <p style={{ fontSize: 10, color: 'var(--color-text-muted)' }}>
                          {tx.originalCurrency} {tx.originalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </button>

                  {selectedTx === tx.id && (
                    <div className="card animate-scale-in" style={{ padding: '14px 16px', marginBottom: 8, marginTop: -4, background: 'var(--color-surface-secondary)', fontSize: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Merchant ID</span>
                        <span style={{ fontWeight: 600 }}>{tx.merchantId}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Jumlah Asli</span>
                        <span style={{ fontWeight: 600 }}>{tx.originalCurrency} {tx.originalAmount.toLocaleString()}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Kurs</span>
                        <span style={{ fontWeight: 600 }}>1 {tx.originalCurrency} = {formatRupiah(tx.exchangeRate)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Konversi</span>
                        <span style={{ fontWeight: 600 }}>{formatRupiah(tx.convertedAmount)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ color: 'var(--color-text-secondary)' }}>Biaya Admin</span>
                        <span style={{ fontWeight: 600 }}>{formatRupiah(tx.fee)}</span>
                      </div>
                      <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600 }}>Total</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontWeight: 800, fontSize: 14 }}>{formatRupiah(tx.totalAmount)}</span>
                          <StatusBadge status={tx.status} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
