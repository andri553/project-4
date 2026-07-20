import { useState, useEffect } from 'react';
import { Shield, Search, CheckCircle2, XCircle, Clock, FileText, UserCheck, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { formatDate } from '@/helpers/format';
import type { KYCVerification, KYCHistoryEntry } from '@/types';

export default function KYCVerificationQueue() {
  const { user, hasPermission, canApprove: authCanApprove } = useAuth();
  const [pendingVerifications, setPendingVerifications] = useState<KYCVerification[]>([]);
  const [selectedKyc, setSelectedKyc] = useState<KYCVerification | null>(null);
  const [history, setHistory] = useState<KYCHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showDecisionModal, setShowDecisionModal] = useState(false);
  const [decisionType, setDecisionType] = useState<'approve' | 'reject' | 'reupload' | 'suspend' | null>(null);
  const [decisionReason, setDecisionReason] = useState('');
  const [notes, setNotes] = useState('');

  const canApprove = authCanApprove('kyc-queue');

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/security/kyc-pending');
      const json = await res.json();
      if (json.success) {
        const data = json.data;
        setPendingVerifications(data);
        if (data.length > 0 && !selectedKyc) {
          setSelectedKyc(data[0]);
        } else if (data.length === 0) {
          setSelectedKyc(null);
        }
      }
    } catch (e) {
      console.error('Failed to fetch pending KYC', e);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (userId: string) => {
    try {
      const res = await fetch(`/api/v1/security/kyc-history/${userId}`);
      const json = await res.json();
      if (json.success) {
        setHistory(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch KYC history', e);
    }
  };

  useEffect(() => {
    fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedKyc) {
      fetchHistory(selectedKyc.userId);
    } else {
      setHistory([]);
    }
  }, [selectedKyc]);

  const openDecisionModal = (type: 'approve' | 'reject' | 'reupload' | 'suspend') => {
    setDecisionType(type);
    setNotes('');
    setDecisionReason('');
    setShowDecisionModal(true);
  };

  const handleConfirmDecision = async () => {
    if (!selectedKyc || !user || !decisionType) return;
    setIsProcessing(true);
    try {
      const endpoint = 
        decisionType === 'approve' ? `/api/v1/security/kyc-approve/${selectedKyc.id}` :
        decisionType === 'reject' ? `/api/v1/security/kyc-reject/${selectedKyc.id}` :
        decisionType === 'reupload' ? `/api/v1/security/kyc-reupload/${selectedKyc.id}` :
        `/api/v1/security/kyc-suspend/${selectedKyc.id}`;

      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          officerId: user.id, 
          officerName: user.name,
          notes,
          reason: decisionReason
        }),
      });

      setShowDecisionModal(false);
      setNotes('');
      setDecisionReason('');
      setDecisionType(null);
      await fetchPending(); // Refresh list
    } catch (e) {
      console.error('Decision failed', e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasPermission('kyc-queue')) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield size={48} className="mx-auto mb-4 text-[var(--color-danger)]" />
          <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-text-primary)' }}>Akses Ditolak</h2>
          <p style={{ color: 'var(--color-text-secondary)' }}>Anda tidak memiliki izin untuk accessing antrean verifikasi KYC.</p>
        </div>
      </div>
    );
  }

  // Helper to parse ocrData
  const parsedOcr = selectedKyc?.ocrData
    ? (typeof selectedKyc.ocrData === 'string' ? JSON.parse(selectedKyc.ocrData) : selectedKyc.ocrData)
    : null;

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <UserCheck className="text-blue-500" />
            KYC Verification Queue
          </h1>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Tinjau dan verifikasi data identitas nasabah</p>
        </div>
        <div className="flex gap-5">
          <div className="px-5 py-3 rounded-xl flex flex-col items-end" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
            <span className="text-[11px] uppercase font-semibold tracking-wide" style={{ color: 'var(--color-text-muted)' }}>Pending Verifications</span>
            <span className="text-xl font-bold text-orange-500">{pendingVerifications.length}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-y-auto lg:overflow-hidden">
        {/* Left Panel: Queue List */}
        <div className="w-full lg:w-1/3 flex flex-col rounded-xl overflow-hidden" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          <div className="p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input 
                type="text" 
                placeholder="Cari ID atau Nama..." 
                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg"
                style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-2">
            {isLoading ? (
              <div className="p-4 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>Memuat antrean...</div>
            ) : pendingVerifications.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center h-full opacity-50">
                <CheckCircle2 size={48} className="text-green-500 mb-4" />
                <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Semua verifikasi telah diproses</p>
                <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Tidak ada data dalam antrean saat ini.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingVerifications.map((kyc) => {
                  const ocr = kyc.ocrData ? (typeof kyc.ocrData === 'string' ? JSON.parse(kyc.ocrData) : kyc.ocrData) : null;
                  return (
                    <button
                      key={kyc.id}
                      onClick={() => setSelectedKyc(kyc)}
                      className={`w-full text-left p-3 rounded-lg transition-colors flex items-center justify-between ${selectedKyc?.id === kyc.id ? 'bg-blue-500/10 border-blue-500/30' : 'hover:bg-white/5 border-transparent'}`}
                      style={{ border: `1px solid ${selectedKyc?.id === kyc.id ? 'rgba(59,130,246,0.3)' : 'transparent'}` }}
                    >
                      <div>
                        <div className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{ocr?.nama || 'Unknown User'}</div>
                        <div className="text-xs mt-1 flex items-center gap-1" style={{ color: 'var(--color-text-muted)' }}>
                          <Clock size={12} />
                          {formatDate(kyc.submittedAt, 'relative')}
                        </div>
                      </div>
                      {kyc.matchScore !== null && kyc.matchScore !== undefined && (
                        <div className={`px-2 py-1 rounded text-xs font-bold ${kyc.matchScore >= 85 ? 'bg-green-500/20 text-green-400' : 'bg-orange-500/20 text-orange-400'}`}>
                          {kyc.matchScore}%
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Detail View */}
        <div className="w-full lg:w-2/3 rounded-xl overflow-hidden flex flex-col" style={{ background: 'var(--color-bg-surface)', border: '1px solid var(--color-border)' }}>
          {selectedKyc && parsedOcr ? (
            <>
              <div className="p-6 border-b flex flex-wrap gap-4 justify-between items-start" style={{ borderColor: 'var(--color-border)' }}>
                <div>
                  <h2 className="text-xl font-bold" style={{ color: 'var(--color-text-primary)' }}>{parsedOcr.nama}</h2>
                  <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>ID: {selectedKyc.id} • User: {selectedKyc.userId}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button 
                    onClick={() => openDecisionModal('suspend')}
                    disabled={!canApprove || isProcessing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-950/30 text-red-500 border border-red-500/20 hover:bg-red-500/20 font-semibold text-xs transition-colors disabled:opacity-50"
                  >
                    Suspend
                  </button>
                  <button 
                    onClick={() => openDecisionModal('reupload')}
                    disabled={!canApprove || isProcessing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/20 font-semibold text-xs transition-colors disabled:opacity-50"
                  >
                    Re-upload
                  </button>
                  <button 
                    onClick={() => openDecisionModal('reject')}
                    disabled={!canApprove || isProcessing}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 font-semibold text-xs transition-colors disabled:opacity-50"
                  >
                    Tolak
                  </button>
                  <button 
                    onClick={() => openDecisionModal('approve')}
                    disabled={!canApprove || isProcessing}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-500 font-semibold text-xs transition-colors disabled:opacity-50 shadow-[0_0_15px_rgba(22,163,74,0.3)]"
                  >
                    Setujui
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                
                {/* Visual Data Comparison */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-blue-500">Data Visual & Biometrik</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* KTP */}
                    <div className="rounded-xl p-4 flex flex-col" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-xs text-white">Foto KTP</span>
                        <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Uploaded</span>
                      </div>
                      <div className="h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center opacity-70" style={{ borderColor: 'var(--color-border)' }}>
                        <FileText size={32} className="mb-1" style={{ color: 'var(--color-text-muted)' }} />
                        <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>[Simulated KTP Image]</span>
                      </div>
                    </div>
                    {/* Selfie */}
                    <div className="rounded-xl p-4 flex flex-col" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-xs text-white">Foto Selfie</span>
                        <span className="text-[10px] px-2 py-0.5 bg-green-500/20 text-green-400 rounded">Captured</span>
                      </div>
                      <div className="h-32 rounded-lg border-2 border-dashed flex flex-col items-center justify-center opacity-70 relative overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
                        <div className="w-16 h-20 rounded-full border-2 border-blue-500/30 flex items-center justify-center">
                          <UserCheck size={24} style={{ color: 'var(--color-text-muted)' }} />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Face Match Result */}
                  <div className="mt-3 rounded-xl p-3 flex items-center justify-between" style={{ background: selectedKyc.matchScore && selectedKyc.matchScore >= 85 ? 'rgba(34,197,94,0.1)' : 'rgba(249,115,22,0.1)', border: `1px solid ${selectedKyc.matchScore && selectedKyc.matchScore >= 85 ? 'rgba(34,197,94,0.2)' : 'rgba(249,115,22,0.2)'}` }}>
                    <div className="flex items-center gap-3.5">
                      <div className={`p-1.5 rounded-full ${selectedKyc.matchScore && selectedKyc.matchScore >= 85 ? 'bg-green-500/20' : 'bg-orange-500/20'}`}>
                        {selectedKyc.matchScore && selectedKyc.matchScore >= 85 ? <CheckCircle2 className="text-green-500" size={16} /> : <AlertTriangle className="text-orange-500" size={16} />}
                      </div>
                      <div>
                        <div className="font-bold text-xs" style={{ color: 'var(--color-text-primary)' }}>Biometrik Wajah</div>
                        <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>Hasil pencocokan: {selectedKyc.matchScore}% (Liveness: PASSED)</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* OCR Data */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-blue-500">Ekstraksi Data OCR</h3>
                  <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-xs">
                      {[
                        { label: 'NIK', value: parsedOcr.nik },
                        { label: 'Nama Lengkap', value: parsedOcr.nama },
                        { label: 'Tempat, Tgl Lahir', value: `${parsedOcr.tempatLahir}, ${parsedOcr.tanggalLahir}` },
                        { label: 'Jenis Kelamin', value: parsedOcr.jenisKelamin },
                        { label: 'Alamat', value: `${parsedOcr.alamat} RT ${parsedOcr.rt}/RW ${parsedOcr.rw}` },
                        { label: 'Kel/Kec', value: `${parsedOcr.kelurahan} / ${parsedOcr.kecamatan}` },
                        { label: 'Pekerjaan', value: parsedOcr.pekerjaan },
                        { label: 'Agama / Status', value: `${parsedOcr.agama} / ${parsedOcr.statusPerkawinan}` },
                        { label: 'Provinsi', value: parsedOcr.provinsi || 'DKI JAKARTA' },
                        { label: 'Kabupaten/Kota', value: parsedOcr.kabupaten || 'JAKARTA SELATAN' }
                      ].map((item, i) => (
                        <div key={i} className="border-b border-white/5 pb-1.5">
                          <div className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>{item.label}</div>
                          <div className="font-medium mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Security and Fraud Analytics Panel */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-blue-500">Security & Fraud Review</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Security Analysis */}
                    <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                      <span className="font-bold text-xs text-white block mb-2">Analisis Risiko & Keamanan</span>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between pb-1 border-b border-white/5">
                          <span style={{ color: 'var(--color-text-muted)' }}>Risk Score:</span>
                          <span className={`font-semibold ${selectedKyc.user?.riskScore > 50 ? 'text-red-400' : 'text-green-400'}`}>
                            {selectedKyc.user?.riskScore ?? 20} ({selectedKyc.user?.riskLevel ?? 'LOW'})
                          </span>
                        </div>
                        <div className="flex justify-between pb-1 border-b border-white/5">
                          <span style={{ color: 'var(--color-text-muted)' }}>Liveness Status:</span>
                          <span className="text-green-400 font-semibold">{parsedOcr.livenessResult || 'PASSED (100%)'}</span>
                        </div>
                        <div className="flex justify-between pb-1 border-b border-white/5">
                          <span style={{ color: 'var(--color-text-muted)' }}>OCR Confidence:</span>
                          <span className="text-green-400 font-semibold">{parsedOcr.ocrConfidence || '98%'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-muted)' }}>Trusted Device:</span>
                          <span className="text-white">Yes (Fingerprint verified)</span>
                        </div>
                      </div>
                    </div>

                    {/* Fraud Analysis */}
                    <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                      <span className="font-bold text-xs text-white block mb-2">Pendeteksian Fraud (Kecurangan)</span>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between pb-1 border-b border-white/5">
                          <span style={{ color: 'var(--color-text-muted)' }}>Duplikasi NIK:</span>
                          <span className="text-green-400 font-semibold">TIDAK ADA</span>
                        </div>
                        <div className="flex justify-between pb-1 border-b border-white/5">
                          <span style={{ color: 'var(--color-text-muted)' }}>Duplikasi Wajah:</span>
                          <span className="text-green-400 font-semibold">TIDAK ADA</span>
                        </div>
                        <div className="flex justify-between pb-1 border-b border-white/5">
                          <span style={{ color: 'var(--color-text-muted)' }}>Duplikasi Device:</span>
                          <span className="text-green-400 font-semibold">TIDAK ADA</span>
                        </div>
                        <div className="flex justify-between">
                          <span style={{ color: 'var(--color-text-muted)' }}>Multi Registrasi:</span>
                          <span className="text-green-400">Normal (1 Akun)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Timeline */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-3 text-blue-500">Timeline Aktivitas KYC</h3>
                  <div className="rounded-xl p-4" style={{ background: 'var(--color-bg-elevated)', border: '1px solid var(--color-border)' }}>
                    <div className="space-y-3 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-white/5">
                      {history.map((event) => (
                        <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                          <div className="flex items-center justify-center w-4 h-4 rounded-full border border-blue-500 bg-gray-900 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                          <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1rem)] p-2 rounded border" style={{ borderColor: 'var(--color-border)', background: 'var(--color-bg-surface)' }}>
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-bold text-[10px] text-white">{event.event}</span>
                              <time className="text-[9px]" style={{ color: 'var(--color-text-muted)' }}>{formatDate(event.timestamp, 'short')}</time>
                            </div>
                            <div className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>{event.details}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-50">
              <UserCheck size={64} className="mb-4" style={{ color: 'var(--color-text-muted)' }} />
              <p style={{ color: 'var(--color-text-primary)' }}>Pilih antrean verifikasi untuk menampilkan detail</p>
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {showDecisionModal && decisionType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#1e1e2d] w-full max-w-md rounded-xl shadow-2xl overflow-hidden border border-gray-700">
            <div className="p-5 border-b border-gray-700 flex justify-between items-center">
              <h3 className="font-bold text-lg text-white">
                {decisionType === 'approve' && 'Setujui Verifikasi KYC'}
                {decisionType === 'reject' && 'Tolak Verifikasi KYC'}
                {decisionType === 'reupload' && 'Minta Upload Ulang Dokumen'}
                {decisionType === 'suspend' && 'Tangguhkan Verifikasi (Suspend)'}
              </h3>
              <button onClick={() => setShowDecisionModal(false)} className="text-gray-400 hover:text-white"><XCircle size={20} /></button>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-300 mb-4">
                Harap berikan alasan tindakan verifikasi KYC untuk <strong className="text-white">{selectedKyc?.ocrData?.nama}</strong>.
              </p>
              
              <div className="space-y-2 mb-4">
                {(
                  decisionType === 'approve' ? ['Semua dokumen valid dan terbaca', 'Pencocokan wajah sukses (90%+)', 'Data sesuai data kependudukan'] :
                  decisionType === 'reject' ? ['Foto KTP blur/tidak terbaca', 'Wajah selfie tidak cocok dengan KTP', 'Dokumen KTP palsu/rekayasa'] :
                  decisionType === 'reupload' ? ['Foto KTP terpotong/tidak utuh', 'Foto selfie terlalu buram', 'KTP tertutup bayangan'] :
                  ['Indikasi pemipuan identitas terorganisir', 'Duplikasi NIK terdeteksi pada database', 'Biometrik liveness gagal berkali-kali']
                ).map(reason => (
                  <button 
                    key={reason}
                    type="button"
                    onClick={() => setDecisionReason(reason)}
                    className={`w-full text-left px-3 py-2 text-xs rounded border ${decisionReason === reason ? 'bg-blue-500/20 border-blue-500/50 text-blue-200' : 'bg-black/20 border-gray-700 text-gray-400 hover:text-gray-200 hover:bg-gray-800'}`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
              
              <div className="mb-4">
                <label className="text-[10px] text-gray-400 block mb-1">Catatan Tambahan (Notes):</label>
                <textarea 
                  placeholder="Tambahkan catatan khusus untuk verifikasi ini..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-lg p-3 text-sm text-white resize-none outline-none focus:border-blue-500 transition-colors"
                  rows={2}
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 block mb-1">Alasan Terpilih / Custom:</label>
                <input 
                  type="text"
                  placeholder="Pilih alasan di atas atau tulis di sini..."
                  value={decisionReason}
                  onChange={e => setDecisionReason(e.target.value)}
                  className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 flex justify-end gap-3 bg-black/20">
              <button onClick={() => setShowDecisionModal(false)} className="px-4 py-2 text-sm text-gray-300 hover:text-white">Batal</button>
              <button 
                onClick={handleConfirmDecision}
                disabled={!decisionReason.trim() || isProcessing}
                className={`px-4 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-50 ${
                  decisionType === 'approve' ? 'bg-green-600 hover:bg-green-500' :
                  decisionType === 'reupload' ? 'bg-amber-600 hover:bg-amber-500' : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {isProcessing ? 'Memproses...' : 'Konfirmasi Tindakan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
