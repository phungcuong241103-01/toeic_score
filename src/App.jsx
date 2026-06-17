import { useState, useEffect, useCallback, useMemo } from 'react'
import './index.css'

// ─── LocalStorage helpers ───────────────────────────────────────────
const STORAGE_KEY = 'toeic_scores'

function loadScores() {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveScores(scores) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
}

// ─── TOEIC score mapping ────────────────────────────────────────────
function mapToScore(raw, totalItems) {
  if (raw <= 0) return 5
  const percentage = raw / totalItems
  let score = Math.floor((percentage * 495) / 5) * 5
  return Math.min(Math.max(score, 5), 495)
}

function calcScores(record) {
  const p1 = parseInt(record.p1) || 0
  const p2 = parseInt(record.p2) || 0
  const p3 = parseInt(record.p3) || 0
  const p4 = parseInt(record.p4) || 0
  const p5 = parseInt(record.p5) || 0
  const p6 = parseInt(record.p6) || 0
  const p7 = parseInt(record.p7) || 0

  const listenRaw = p1 + p2 + p3 + p4
  const readRaw = p5 + p6 + p7

  const listenScore = mapToScore(listenRaw, 100)
  const readScore = mapToScore(readRaw, 100)
  const totalScore = listenScore + readScore

  return { listenScore, readScore, totalScore }
}

// ─── Empty state defaults ───────────────────────────────────────────
const emptyForm = {
  testName: '',
  date: '',
  p1: '', p2: '', p3: '', p4: '',
  p5: '', p6: '', p7: '',
}

// ═══════════════════════════════════════════════════════════════════
// Score Modal Component
// ═══════════════════════════════════════════════════════════════════
function ScoreModal({ isOpen, onClose, onSave, initialData, isEditing }) {
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    if (isOpen) {
      setForm(initialData ? { ...initialData } : { ...emptyForm })
    }
  }, [isOpen, initialData])

  const { listenScore, readScore, totalScore } = useMemo(() => calcScores(form), [form])

  const handleChange = useCallback((field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave({
      ...form,
      listenScore,
      readScore,
      totalScore,
      id: initialData?.id || Date.now().toString(),
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" id="modal-container">
      <div className="modal-overlay absolute inset-0" onClick={onClose}></div>
      <div className="bg-surface-container-lowest w-full max-w-2xl rounded-xl shadow-2xl relative z-10 overflow-hidden animate-slide-in mx-4">
        {/* Header */}
        <div className="bg-primary px-6 py-4 flex justify-between items-center text-on-primary">
          <h3 className="font-title-md text-title-md">
            {isEditing ? 'Chỉnh Sửa Kết Quả' : 'Thêm Kết Quả Thi Mới'}
          </h3>
          <button
            className="hover:bg-on-primary/10 p-1 rounded-full transition-all"
            onClick={onClose}
            id="close-modal-btn"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form className="p-6" onSubmit={handleSubmit} id="score-form">
          {/* Test Name */}
          <div className="mb-4">
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase">
              Tên Bài Test
            </label>
            <input
              type="text"
              className="w-full border border-outline-variant rounded p-2.5 focus:border-primary focus:ring-1 focus:ring-primary font-data-tabular bg-white transition-all"
              placeholder="VD: ETS 2024 Test 1, Sách Luyện Đề Toeic..."
              value={form.testName}
              onChange={(e) => handleChange('testName', e.target.value)}
              id="modal-test-name"
            />
          </div>

          {/* Date */}
          <div className="mb-6">
            <label className="block font-label-sm text-label-sm text-on-surface-variant mb-2 uppercase">
              Ngày Làm
            </label>
            <input
              type="date"
              className="w-full border border-outline-variant rounded p-2.5 focus:border-primary focus:ring-1 focus:ring-primary font-data-tabular bg-white transition-all"
              value={form.date}
              onChange={(e) => handleChange('date', e.target.value)}
              required
              id="modal-date"
            />
          </div>

          {/* Listening & Reading sections */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
            {/* Listening */}
            <div className="space-y-4">
              <p className="font-title-md text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">headphones</span>
                Nghe (Listening)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <PartInput label="Part 1 (0-6)" id="m-p1" value={form.p1} max={6}
                  onChange={(v) => handleChange('p1', v)} />
                <PartInput label="Part 2 (0-25)" id="m-p2" value={form.p2} max={25}
                  onChange={(v) => handleChange('p2', v)} />
                <PartInput label="Part 3 (0-39)" id="m-p3" value={form.p3} max={39}
                  onChange={(v) => handleChange('p3', v)} />
                <PartInput label="Part 4 (0-30)" id="m-p4" value={form.p4} max={30}
                  onChange={(v) => handleChange('p4', v)} />
              </div>
              <ScoreSummaryBox label="Tổng Điểm Nghe:" score={listenScore} id="m-listen-score" />
            </div>

            {/* Reading */}
            <div className="space-y-4">
              <p className="font-title-md text-primary border-b border-outline-variant pb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px]">menu_book</span>
                Đọc (Reading)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <PartInput label="Part 5 (0-30)" id="m-p5" value={form.p5} max={30}
                  onChange={(v) => handleChange('p5', v)} />
                <PartInput label="Part 6 (0-16)" id="m-p6" value={form.p6} max={16}
                  onChange={(v) => handleChange('p6', v)} />
                <div className="col-span-2">
                  <PartInput label="Part 7 (0-54)" id="m-p7" value={form.p7} max={54}
                    onChange={(v) => handleChange('p7', v)} />
                </div>
              </div>
              <ScoreSummaryBox label="Tổng Điểm Đọc:" score={readScore} id="m-read-score" />
            </div>
          </div>

          {/* Total Score */}
          <div className="bg-primary-container p-4 rounded-lg flex justify-between items-center text-on-primary-container mb-6">
            <span className="font-title-md flex items-center gap-2">
              <span className="material-symbols-outlined">emoji_events</span>
              TỔNG ĐIỂM DỰ KIẾN:
            </span>
            <span className="font-display-score text-4xl" id="m-total-score">{totalScore}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <button
              className="px-6 py-2.5 rounded-lg font-label-sm text-label-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all"
              type="button"
              onClick={onClose}
              id="cancel-modal-btn"
            >
              Hủy bỏ
            </button>
            <button
              className="px-8 py-2.5 bg-primary text-on-primary rounded-lg font-label-sm text-label-sm hover:opacity-90 shadow-md hover:shadow-lg transition-all flex items-center gap-2"
              type="submit"
              id="save-modal-btn"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              {isEditing ? 'Cập nhật' : 'Lưu kết quả'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Part Input sub-component ───────────────────────────────────────
function PartInput({ label, id, value, max, onChange }) {
  return (
    <div>
      <label className="block text-[10px] text-outline mb-1 font-bold uppercase" htmlFor={id}>
        {label}
      </label>
      <input
        type="number"
        className="w-full border border-outline-variant rounded p-2 text-center font-data-tabular bg-white focus:border-primary focus:ring-1 focus:ring-primary transition-all hover:border-primary/50"
        id={id}
        min={0}
        max={max}
        placeholder={String(max)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  )
}

// ─── Score Summary Box ──────────────────────────────────────────────
function ScoreSummaryBox({ label, score, id }) {
  return (
    <div className="bg-secondary-container/20 p-3 rounded flex justify-between items-center mt-2 border border-secondary-container">
      <span className="font-label-sm text-label-sm text-on-secondary-container">{label}</span>
      <span className="font-display-score text-2xl text-primary" id={id}>{score}</span>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Delete Confirm Modal
// ═══════════════════════════════════════════════════════════════════
function DeleteModal({ isOpen, onClose, onConfirm, recordName }) {
  if (!isOpen) return null
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="modal-overlay absolute inset-0" onClick={onClose}></div>
      <div className="bg-surface-container-lowest w-full max-w-md rounded-xl shadow-2xl relative z-10 overflow-hidden animate-slide-in mx-4">
        <div className="bg-error px-6 py-4 flex justify-between items-center text-on-error">
          <h3 className="font-title-md text-title-md flex items-center gap-2">
            <span className="material-symbols-outlined">warning</span>
            Xác Nhận Xóa
          </h3>
          <button className="hover:bg-on-error/10 p-1 rounded-full transition-all" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-6">
          <p className="text-on-surface mb-2">Bạn có chắc chắn muốn xóa bản ghi này?</p>
          {recordName && (
            <p className="text-primary font-semibold mb-4 bg-surface-container p-2 rounded">
              "{recordName}"
            </p>
          )}
          <p className="text-on-surface-variant text-sm mb-6">
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3">
            <button
              className="px-6 py-2.5 rounded-lg font-label-sm text-label-sm border border-outline-variant text-on-surface-variant hover:bg-surface-container transition-all"
              onClick={onClose}
            >
              Hủy bỏ
            </button>
            <button
              className="px-6 py-2.5 bg-error text-on-error rounded-lg font-label-sm text-label-sm hover:opacity-90 shadow-md transition-all flex items-center gap-2"
              onClick={onConfirm}
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              Xóa
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Toast notification
// ═══════════════════════════════════════════════════════════════════
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  const bgColor = type === 'success' ? 'bg-tertiary-container' : type === 'error' ? 'bg-error-container' : 'bg-surface-container'
  const textColor = type === 'success' ? 'text-on-tertiary-fixed' : type === 'error' ? 'text-on-error-container' : 'text-on-surface'
  const icon = type === 'success' ? 'check_circle' : type === 'error' ? 'error' : 'info'

  return (
    <div className={`fixed bottom-6 right-6 z-[80] ${bgColor} ${textColor} px-5 py-3 rounded-lg shadow-2xl flex items-center gap-3 animate-slide-in font-label-sm`}>
      <span className="material-symbols-outlined">{icon}</span>
      {message}
      <button onClick={onClose} className="ml-2 hover:opacity-70 transition-all">
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Statistics Cards
// ═══════════════════════════════════════════════════════════════════
function StatsCards({ scores }) {
  const stats = useMemo(() => {
    if (scores.length === 0) return null
    const totals = scores.map(s => s.totalScore)
    const best = Math.max(...totals)
    const latest = totals[0]
    const avg = Math.round(totals.reduce((a, b) => a + b, 0) / totals.length)

    // Trend: compare latest two
    let trend = 0
    if (totals.length >= 2) {
      trend = totals[0] - totals[1]
    }
    return { best, latest, avg, count: scores.length, trend }
  }, [scores])

  if (!stats) return null

  const trendColor = stats.trend > 0 ? 'text-on-tertiary-container' : stats.trend < 0 ? 'text-error' : 'text-on-surface-variant'
  const trendIcon = stats.trend > 0 ? 'trending_up' : stats.trend < 0 ? 'trending_down' : 'trending_flat'

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <StatCard icon="military_tech" label="Điểm Cao Nhất" value={stats.best} color="text-primary" bgColor="bg-primary-fixed/20" />
      <StatCard icon="schedule" label="Điểm Gần Nhất" value={stats.latest} color="text-primary" bgColor="bg-surface-container"
        extra={
          <span className={`text-xs font-semibold flex items-center gap-0.5 ${trendColor}`}>
            <span className="material-symbols-outlined text-[14px]">{trendIcon}</span>
            {stats.trend > 0 ? '+' : ''}{stats.trend}
          </span>
        }
      />
      <StatCard icon="analytics" label="Điểm Trung Bình" value={stats.avg} color="text-secondary" bgColor="bg-secondary-container/30" />
      <StatCard icon="assignment" label="Tổng Bài Thi" value={stats.count} color="text-tertiary" bgColor="bg-tertiary-fixed/10" />
    </div>
  )
}

function StatCard({ icon, label, value, color, bgColor, extra }) {
  return (
    <div className={`${bgColor} border border-outline-variant rounded-xl p-4 transition-all hover:shadow-md hover:-translate-y-0.5`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`material-symbols-outlined text-[20px] ${color}`}>{icon}</span>
        <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
      </div>
      <div className="flex items-end justify-between">
        <span className={`font-display-score text-3xl ${color}`}>{value}</span>
        {extra}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════
// Main App Component
// ═══════════════════════════════════════════════════════════════════
function App() {
  const [scores, setScores] = useState(() => loadScores())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [toast, setToast] = useState(null)
  const [visibleCount, setVisibleCount] = useState(10)
  const [searchQuery, setSearchQuery] = useState('')

  // Persist to localStorage whenever scores change
  useEffect(() => {
    saveScores(scores)
  }, [scores])

  // Filtered scores
  const filteredScores = useMemo(() => {
    if (!searchQuery.trim()) return scores
    const q = searchQuery.toLowerCase()
    return scores.filter(s =>
      (s.testName && s.testName.toLowerCase().includes(q)) ||
      (s.date && s.date.includes(q))
    )
  }, [scores, searchQuery])

  const visibleScores = filteredScores.slice(0, visibleCount)
  const hasMore = filteredScores.length > visibleCount

  // ─── Handlers ──────────────────────────────────────────────────
  const handleSave = useCallback((record) => {
    setScores(prev => {
      const existingIndex = prev.findIndex(s => s.id === record.id)
      if (existingIndex >= 0) {
        // Update existing
        const updated = [...prev]
        updated[existingIndex] = record
        return updated
      } else {
        // Add new (prepend)
        return [record, ...prev]
      }
    })
    setIsModalOpen(false)
    setEditingRecord(null)
    setToast({
      message: editingRecord ? 'Đã cập nhật kết quả thành công!' : 'Đã lưu kết quả thành công!',
      type: 'success'
    })
  }, [editingRecord])

  const handleEdit = useCallback((record) => {
    setEditingRecord(record)
    setIsModalOpen(true)
  }, [])

  const handleDeleteConfirm = useCallback(() => {
    if (deleteTarget) {
      setScores(prev => prev.filter(s => s.id !== deleteTarget.id))
      setDeleteTarget(null)
      setToast({ message: 'Đã xóa bản ghi thành công!', type: 'success' })
    }
  }, [deleteTarget])

  const handleOpenNew = useCallback(() => {
    setEditingRecord(null)
    setIsModalOpen(true)
  }, [])

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('vi-VN')
    } catch {
      return dateStr
    }
  }

  const getScoreColor = (total) => {
    if (total >= 900) return 'text-on-tertiary-container'
    if (total >= 700) return 'text-primary'
    if (total >= 500) return 'text-secondary'
    return 'text-on-surface-variant'
  }

  return (
    <div className="bg-background font-body-md text-on-background min-h-screen flex flex-col">
      {/* ─── TopNavBar ─── */}
      <header className="bg-surface border-b border-outline-variant sticky top-0 z-50">
        <div className="flex justify-between items-center w-full px-edge-margin h-16 max-w-[1280px] mx-auto">
          <h1 className="font-headline-lg text-headline-lg font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px]">leaderboard</span>
            TOEIC Score Tracker
          </h1>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="flex max-w-[1280px] mx-auto w-full">
        <main className="flex-1 p-edge-margin">
          {/* Stats Cards */}
          <StatsCards scores={scores} />

          {/* Table Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h2 className="font-headline-lg text-headline-lg text-primary">Lịch Sử Điểm Thi</h2>
              <p className="text-on-surface-variant font-body-md">
                Theo dõi sự tiến bộ qua các bài thi thử
                {scores.length > 0 && <span className="ml-2 text-primary font-semibold">({scores.length} bản ghi)</span>}
              </p>
            </div>
            <button
              className="bg-primary text-on-primary font-label-sm text-label-sm py-2.5 px-6 rounded-full hover:shadow-lg hover:opacity-95 transition-all flex items-center justify-center gap-2"
              onClick={handleOpenNew}
              id="open-modal-btn"
            >
              <span className="material-symbols-outlined text-sm">add</span>
              Thêm mới kết quả
            </button>
          </div>

          {/* Score Table */}
          <section className="bg-surface-container-lowest border border-outline-variant rounded-xl shadow-sm overflow-hidden">
            {/* Table Title Bar */}
            <div className="px-6 py-4 border-b border-outline-variant flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h3 className="font-title-md text-title-md text-on-surface">Danh sách bản ghi</h3>
              <div className="flex gap-2 items-center">
                {/* Search */}
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
                  <input
                    type="text"
                    className="pl-9 pr-3 py-1.5 border border-outline-variant rounded-lg text-sm focus:border-primary focus:ring-1 focus:ring-primary w-48 bg-white transition-all"
                    placeholder="Tìm kiếm..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    id="search-input"
                  />
                </div>
                <button
                  className="p-2 text-on-surface-variant hover:bg-surface-container rounded-lg transition-all"
                  title="Xuất dữ liệu"
                >
                  <span className="material-symbols-outlined">download</span>
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse" id="score-table">
                <thead>
                  <tr className="bg-surface-container-low border-b border-outline-variant text-on-surface-variant">
                    <th className="text-left py-3 px-4 font-label-sm text-label-sm border-r border-outline-variant min-w-[120px]">Tên Bài Test</th>
                    <th className="text-left py-3 px-4 font-label-sm text-label-sm border-r border-outline-variant">Ngày làm</th>
                    <th className="text-center py-3 px-2 font-label-sm text-label-sm border-r border-outline-variant">P1</th>
                    <th className="text-center py-3 px-2 font-label-sm text-label-sm border-r border-outline-variant">P2</th>
                    <th className="text-center py-3 px-2 font-label-sm text-label-sm border-r border-outline-variant">P3</th>
                    <th className="text-center py-3 px-2 font-label-sm text-label-sm border-r border-outline-variant">P4</th>
                    <th className="text-center py-3 px-2 font-label-sm text-label-sm border-r border-outline-variant bg-secondary-container/30">Nghe</th>
                    <th className="text-center py-3 px-2 font-label-sm text-label-sm border-r border-outline-variant">P5</th>
                    <th className="text-center py-3 px-2 font-label-sm text-label-sm border-r border-outline-variant">P6</th>
                    <th className="text-center py-3 px-2 font-label-sm text-label-sm border-r border-outline-variant">P7</th>
                    <th className="text-center py-3 px-2 font-label-sm text-label-sm border-r border-outline-variant bg-secondary-container/30">Đọc</th>
                    <th className="text-center py-3 px-4 font-label-sm text-label-sm bg-primary-container text-white border-r border-primary">Tổng</th>
                    <th className="text-center py-3 px-4 font-label-sm text-label-sm">Hành động</th>
                  </tr>
                </thead>
                <tbody id="history-body">
                  {visibleScores.length === 0 ? (
                    <tr>
                      <td colSpan={13} className="py-16 text-center">
                        <div className="flex flex-col items-center gap-3">
                          <span className="material-symbols-outlined text-[48px] text-outline-variant">
                            {searchQuery ? 'search_off' : 'note_add'}
                          </span>
                          <p className="text-on-surface-variant font-title-md">
                            {searchQuery ? 'Không tìm thấy kết quả' : 'Chưa có bản ghi nào'}
                          </p>
                          <p className="text-outline text-sm">
                            {searchQuery
                              ? 'Thử tìm kiếm với từ khóa khác'
                              : 'Nhấn "Thêm mới kết quả" để bắt đầu theo dõi'
                            }
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    visibleScores.map((record, index) => (
                      <tr
                        key={record.id}
                        className="data-grid-row border-b border-outline-variant text-on-surface font-data-tabular animate-fade-in-up"
                        style={{ animationDelay: `${index * 30}ms` }}
                      >
                        <td className="py-3 px-4 border-r border-outline-variant font-semibold text-primary max-w-[200px] truncate" title={record.testName || '—'}>
                          {record.testName || '—'}
                        </td>
                        <td className="py-3 px-4 border-r border-outline-variant whitespace-nowrap">
                          {formatDate(record.date)}
                        </td>
                        <td className="text-center border-r border-outline-variant">{record.p1 || 0}</td>
                        <td className="text-center border-r border-outline-variant">{record.p2 || 0}</td>
                        <td className="text-center border-r border-outline-variant">{record.p3 || 0}</td>
                        <td className="text-center border-r border-outline-variant">{record.p4 || 0}</td>
                        <td className="text-center border-r border-outline-variant bg-secondary-container/20 font-bold text-primary">
                          {record.listenScore}
                        </td>
                        <td className="text-center border-r border-outline-variant">{record.p5 || 0}</td>
                        <td className="text-center border-r border-outline-variant">{record.p6 || 0}</td>
                        <td className="text-center border-r border-outline-variant">{record.p7 || 0}</td>
                        <td className="text-center border-r border-outline-variant bg-secondary-container/20 font-bold text-primary">
                          {record.readScore}
                        </td>
                        <td className={`text-center font-bold bg-surface-container-highest border-r border-outline-variant ${getScoreColor(record.totalScore)}`}>
                          {record.totalScore}
                        </td>
                        <td className="py-3 px-2 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-all"
                              title="Chỉnh sửa"
                              onClick={() => handleEdit(record)}
                            >
                              <span className="material-symbols-outlined text-[20px]">edit</span>
                            </button>
                            <button
                              className="p-1.5 text-error hover:bg-error/10 rounded-lg transition-all"
                              title="Xóa"
                              onClick={() => setDeleteTarget(record)}
                            >
                              <span className="material-symbols-outlined text-[20px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="px-6 py-4 bg-surface-container-low text-center border-t border-outline-variant">
                <button
                  className="text-primary font-label-sm text-label-sm flex items-center justify-center gap-2 mx-auto hover:bg-primary/5 px-4 py-2 rounded-lg transition-all"
                  onClick={() => setVisibleCount(prev => prev + 10)}
                  id="load-more-btn"
                >
                  Xem thêm {Math.min(10, filteredScores.length - visibleCount)} bản ghi
                  <span className="material-symbols-outlined">expand_more</span>
                </button>
              </div>
            )}
          </section>
        </main>
      </div>

      {/* ─── Footer ─── */}
      <footer className="w-full py-6 px-edge-margin flex flex-col md:flex-row justify-between items-center max-w-[1280px] mx-auto border-t border-outline-variant mt-auto">
        <p className="font-body-md text-body-md text-on-surface-variant">
          © 2024 TOEIC Performance Systems. Bảo lưu mọi quyền.
        </p>
        <div className="flex gap-6 mt-4 md:mt-0">
          <a className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-all" href="#">Chính sách bảo mật</a>
          <a className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-all" href="#">Điều khoản dịch vụ</a>
          <a className="text-on-surface-variant font-label-sm text-label-sm hover:text-primary transition-all" href="#">Trung tâm hỗ trợ</a>
        </div>
      </footer>

      {/* ─── Modals ─── */}
      <ScoreModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingRecord(null) }}
        onSave={handleSave}
        initialData={editingRecord}
        isEditing={!!editingRecord}
      />

      <DeleteModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteConfirm}
        recordName={deleteTarget?.testName || formatDate(deleteTarget?.date)}
      />

      {/* ─── Toast ─── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}

export default App
