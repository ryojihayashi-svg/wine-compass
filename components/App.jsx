"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { C, F, SR, EL, MCC, T, fmt, vintageLabel } from '../lib/constants';
import { parseInventoryExcel } from '../lib/excelParser';

// ===== Auth =====
const useAuth = () => {
  const [ok, setOk] = useState(false);
  useEffect(() => { setOk(sessionStorage.getItem('wc_auth') === 'ok'); }, []);
  const login = async (pin) => {
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
    if (r.ok) { sessionStorage.setItem('wc_auth', 'ok'); setOk(true); return true; }
    return false;
  };
  const logout = () => { sessionStorage.removeItem('wc_auth'); setOk(false); };
  return { ok, login, logout };
};

// ===== SVG Icons =====
const IcoHome = ({ active }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.acc : '#A09A8C'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12l9-8 9 8" /><path d="M5 10v10h14V10" />
  </svg>
);
const IcoSearch = ({ active }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.acc : '#A09A8C'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={11} cy={11} r={7} /><path d="M21 21l-4.35-4.35" />
  </svg>
);
const IcoCamera = ({ active }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.acc : '#A09A8C'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx={12} cy={13} r={4} />
  </svg>
);
const IcoList = ({ active }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.acc : '#A09A8C'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 6h13M8 12h13M8 18h13" /><path d="M3 6h.01M3 12h.01M3 18h.01" />
  </svg>
);
const IcoSetting = ({ active }) => (
  <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={active ? C.acc : '#A09A8C'} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
    <circle cx={12} cy={12} r={3} />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const IcoBack = () => (
  <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="#A09A8C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 18l-6-6 6-6" />
  </svg>
);
const Chev = ({ open }) => (
  <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="#A09A8C" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

// ===== LoginScreen =====
function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (pinOverride) => {
    const p = pinOverride || pin;
    if (!p || loading) return;
    setLoading(true); setErr(false);
    const ok = await onLogin(p);
    if (!ok) { setErr(true); setPin(''); }
    setLoading(false);
  };

  const pad = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

  return (
    <div style={{ minHeight:'100vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:C.bg, fontFamily:F }}>
      <div style={{ textAlign:'center', marginBottom:40 }}>
        <div style={{ fontSize:13, letterSpacing:4, color:C.sub, marginBottom:8, fontFamily:F }}>WINE COMPASS</div>
        <div style={{ width:48, height:1, background:C.acc, margin:'0 auto 16px' }} />
        <div style={{ fontSize:14, color:C.sub }}>PINを入力</div>
      </div>
      <div style={{ display:'flex', gap:12, marginBottom:24 }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{ width:14, height:14, borderRadius:'50%', border:`2px solid ${pin.length > i ? C.acc : C.bd}`, background: pin.length > i ? C.acc : 'transparent', transition:'all 0.2s' }} />
        ))}
      </div>
      {err && <div style={{ color:C.red, fontSize:13, marginBottom:16 }}>PINが正しくありません</div>}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,72px)', gap:12 }}>
        {pad.map((k, i) => (
          <button key={i} onClick={() => {
            if (k === '⌫') setPin(p => p.slice(0, -1));
            else if (k && pin.length < 4) {
              const next = pin + k;
              setPin(next);
              if (next.length === 4) setTimeout(() => { submit(next); }, 100);
            }
          }} disabled={!k} style={{
            width:72, height:72, borderRadius:'50%', border:`1px solid ${C.bd}`, background: k ? C.card : 'transparent',
            fontSize:24, fontFamily:F, color:C.tx, cursor: k ? 'pointer' : 'default',
            opacity: k ? 1 : 0, display:'flex', alignItems:'center', justifyContent:'center',
          }}>{k}</button>
        ))}
      </div>
    </div>
  );
}

// ===== Toast =====
function Toast({ msg, onClose }) {
  useEffect(() => { if (msg) { const t = setTimeout(onClose, 2500); return () => clearTimeout(t); } }, [msg, onClose]);
  if (!msg) return null;
  return <div style={{ position:'fixed', bottom:90, left:'50%', transform:'translateX(-50%)', background:C.tx, color:'#fff', padding:'10px 20px', borderRadius:20, fontSize:13, fontFamily:F, zIndex:9999, whiteSpace:'nowrap' }}>{msg}</div>;
}

// ===== QBadge =====
function QBadge({ q }) {
  const bg = q <= 1 ? 'rgba(181,61,31,0.08)' : q <= 3 ? 'rgba(200,122,26,0.08)' : 'rgba(42,94,63,0.08)';
  const fg = q <= 1 ? C.red : q <= 3 ? '#C87A1A' : C.green;
  return <span style={{ fontSize:11, fontWeight:600, color:fg, background:bg, padding:'3px 8px', borderRadius:6, fontFamily:F }}>{q}本</span>;
}

// ===== BottomNav =====
const TABS = [
  { id: 'home', label: 'ホーム', Icon: IcoHome },
  { id: 'search', label: '検索', Icon: IcoSearch },
  { id: 'stock', label: '入出庫', Icon: IcoCamera },
  { id: 'list', label: 'リスト', Icon: IcoList },
  { id: 'settings', label: '設定', Icon: IcoSetting },
];

function BottomNav({ tab, onTab }) {
  return (
    <div style={{
      position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
      width:'100%', maxWidth:430,
      background:'rgba(253,252,250,0.95)', backdropFilter:'blur(12px)', WebkitBackdropFilter:'blur(12px)',
      borderTop:`1px solid ${C.bd}`, display:'flex', justifyContent:'space-around',
      padding:'6px 0', paddingBottom:'calc(6px + env(safe-area-inset-bottom))',
      zIndex:100,
    }}>
      {TABS.map(t => (
        <button key={t.id} onClick={() => onTab(t.id)} style={{
          background:'none', border:'none', cursor:'pointer', display:'flex', flexDirection:'column',
          alignItems:'center', gap:2, padding:'4px 8px', opacity: tab === t.id ? 1 : 0.6,
        }}>
          <t.Icon active={tab === t.id} />
          <span style={{ fontSize:9, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? C.acc : '#A09A8C', fontFamily:F, letterSpacing:0.3 }}>{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ===== CatCard =====
function CatCard({ label, count, qty, onClick }) {
  const [fg, bg] = MCC[label] || ['#888', '#f5f5f5'];
  return (
    <div onClick={onClick} style={{ background:bg, borderRadius:2, padding:'10px 14px', cursor:'pointer', border:`1px solid ${C.bd}` }}>
      <div style={{ fontSize:12, fontWeight:700, color:fg, marginBottom:3 }}>{label}</div>
      <div style={{ fontSize:11, color:C.sub }}>{count}種 · {qty}本</div>
    </div>
  );
}

// ===== Bottom Sheet Modal =====
function BottomSheet({ open, onClose, children }) {
  const [closing, setClosing] = useState(false);
  const close = () => { setClosing(true); setTimeout(() => { setClosing(false); onClose(); }, 250); };
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:300 }}>
      <div onClick={close} style={{ position:'absolute', inset:0, background:'rgba(20,18,14,0.55)', backdropFilter:'blur(4px)', WebkitBackdropFilter:'blur(4px)' }} />
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, maxHeight:'85vh',
        background:C.card, borderRadius:'16px 16px 0 0', padding:'20px 20px 36px',
        overflowY:'auto', animation: closing ? 'slideDown 0.25s ease-in forwards' : 'slideUp 0.3s ease-out',
      }}>
        <div style={{ width:36, height:4, background:C.bd, borderRadius:2, margin:'0 auto 16px' }} />
        {children}
      </div>
    </div>
  );
}

// ===== HomeView =====
function HomeView({ stores, categories, onNavigate }) {
  const [expanded, setExpanded] = useState({});
  const [storeSummary, setStoreSummary] = useState({});
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    if (stores.length === 0) return;
    const fetchSummary = async () => {
      const summaries = {};
      for (const store of stores) {
        try {
          const r = await fetch(`/api/beverages?store=${store.id}&limit=1`);
          const data = await r.json();
          summaries[store.id] = { total: data.total || 0 };
        } catch(e) { summaries[store.id] = { total: 0 }; }
      }
      setStoreSummary(summaries);
      try {
        const r = await fetch('/api/beverages?limit=1');
        const data = await r.json();
        setTotalItems(data.total || 0);
      } catch(e) {}
    };
    fetchSummary();
  }, [stores]);

  const toggle = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));

  const storeGradients = {
    hakune: ['#EDE8DF', '#E4DED4'],
    ippei: ['#E8E2D6', '#DDD7CC'],
  };

  return (
    <div style={{ padding:'16px 16px 100px' }}>
      <div style={{ fontSize:18, fontWeight:400, letterSpacing:2, color:C.tx, fontFamily:EL, marginBottom:16 }}>Wine Compass</div>

      {/* All Inventory Summary */}
      <div style={{
        background:'linear-gradient(135deg, #E0DBCF 0%, #D5D0C6 100%)',
        padding:'16px 20px', borderRadius:2, border:`1px solid ${C.bd}`, marginBottom:12,
      }}>
        <div style={{ fontSize:12, fontWeight:500, color:'#3A3630', fontFamily:SR, marginBottom:8 }}>全在庫</div>
        <div style={{ display:'flex', justifyContent:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:20, fontWeight:600, color:'#3A3630', fontFamily:F }}>{totalItems}</div>
            <div style={{ fontSize:10, color:'#7A7568' }}>アイテム</div>
          </div>
        </div>
      </div>

      {/* Store Cards */}
      {stores.map(store => {
        const [g1, g2] = storeGradients[store.id] || ['#EDE8DF', '#E4DED4'];
        const isOpen = expanded[store.id];
        const summary = storeSummary[store.id] || { total: 0 };
        return (
          <div key={store.id} style={{ marginBottom:10 }}>
            <div onClick={() => toggle(store.id)} style={{
              background:`linear-gradient(135deg, ${g1} 0%, ${g2} 100%)`,
              padding:'14px 16px', borderRadius:2, border:`1px solid ${C.bd}`, cursor:'pointer',
            }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <div>
                  <div style={{ fontSize:16, fontWeight:400, letterSpacing:2, color:'#3A3630', fontFamily:SR }}>{store.name}</div>
                  <div style={{ fontSize:11, color:'#8A8478', marginTop:2 }}>{store.name_en || ''}</div>
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:12, color:'#8A8478' }}>{summary.total}種</span>
                  <Chev open={isOpen} />
                </div>
              </div>
            </div>
            {isOpen && (
              <div style={{ padding:'10px 8px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {categories.filter(c => !c.parent_id).map(cat => (
                  <CatCard key={cat.id} label={cat.name} count={0} qty={0}
                    onClick={() => onNavigate('list-items', { store: store.id, category: cat.id, title: `${store.name} · ${cat.name}` })} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ===== GlobalSearch =====
function GlobalSearch({ stores, onSelect }) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const debRef = useRef(null);

  useEffect(() => {
    if (q.length < 2) { setResults([]); return; }
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const r = await fetch(`/api/beverages?q=${encodeURIComponent(q)}&limit=30`);
        const data = await r.json();
        setResults(data.items || []);
      } catch(e) { setResults([]); }
      setSearching(false);
    }, 300);
  }, [q]);

  const storeColor = {};
  stores.forEach(s => { storeColor[s.id] = s.color || '#4A6352'; });

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <div style={{ padding:'12px 16px', display:'flex', gap:10 }}>
        <input autoFocus value={q} onChange={e => setQ(e.target.value)}
          placeholder="ワイン名・生産者・ヴィンテージ..."
          style={{ flex:1, padding:'10px 14px', border:`1px solid ${C.bd}`, borderRadius:10, fontSize:14, fontFamily:F, background:C.card, outline:'none', boxSizing:'border-box' }} />
      </div>
      <div style={{ padding:'0 16px', maxHeight:'calc(100vh - 70px)', overflowY:'auto' }}>
        {q.length < 2 ? (
          <div style={{ textAlign:'center', padding:40, color:C.sub, fontSize:13 }}>2文字以上で検索</div>
        ) : searching ? (
          <div style={{ textAlign:'center', padding:40, color:C.sub, fontSize:13 }}>検索中...</div>
        ) : results.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:C.sub, fontSize:13 }}>該当なし</div>
        ) : results.map(item => (
          <div key={item.id} onClick={() => onSelect(item)} style={{
            background:C.card, borderRadius:1, padding:'12px 14px 12px 20px', border:`1px solid ${C.bd}`,
            marginBottom:5, cursor:'pointer', position:'relative',
          }}>
            <div style={{ position:'absolute', left:0, top:4, bottom:4, width:3, background: storeColor[item.store_id] || C.acc, opacity:0.6, borderRadius:'0 2px 2px 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, fontFamily:EL, color:C.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>{item.producer || ''}{item.vintage ? ` · ${item.vintage}` : ''}</div>
              </div>
              <div style={{ flexShrink:0, marginLeft:8 }}><QBadge q={item.quantity} /></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== ExcelImport =====
function ExcelImport({ stores, categories, onClose, onImported }) {
  const [step, setStep] = useState('select'); // select | preview | importing | done
  const [groups, setGroups] = useState([]);
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [checked, setChecked] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    try {
      const xlsxModule = await import('xlsx');
      const XLSX = xlsxModule.default || xlsxModule;
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const parsed = parseInventoryExcel(wb, XLSX);
      if (parsed.length === 0) { setError('データが見つかりません'); return; }
      setGroups(parsed);
      // Default: all checked
      const c = {};
      parsed.forEach(g => { c[g.sheet] = true; });
      setChecked(c);
      setStep('preview');
    } catch (err) {
      setError('ファイル読取エラー: ' + err.message);
    }
  };

  const totalItems = groups.filter(g => checked[g.sheet]).reduce((s, g) => s + g.items.length, 0);

  const doImport = async () => {
    if (!storeId) { setError('店舗を選択してください'); return; }
    setStep('importing');
    const items = groups.filter(g => checked[g.sheet]).flatMap(g => g.items);
    try {
      const r = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, store_id: storeId }),
      });
      const data = await r.json();
      setResult(data);
      setStep('done');
      if (data.inserted > 0) onImported();
    } catch (err) {
      setError('インポートエラー: ' + err.message);
      setStep('preview');
    }
  };

  const catName = (id) => categories.find(c => c.id === id)?.name || '未分類';

  return (
    <BottomSheet open={true} onClose={onClose}>
      {step === 'select' && (
        <div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:16 }}>Excel取込</div>
          <div style={{ fontSize:12, color:C.sub, marginBottom:16 }}>明寂飲料在庫のExcelファイル (.xlsx) を選択してください</div>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display:'none' }} />
          <button onClick={() => fileRef.current?.click()} style={{
            width:'100%', padding:16, borderRadius:2, border:`2px dashed ${C.bd}`, background:'transparent',
            fontSize:14, fontFamily:F, color:C.acc, cursor:'pointer', textAlign:'center',
          }}>📁 ファイルを選択</button>
          {error && <div style={{ color:C.red, fontSize:12, marginTop:12 }}>{error}</div>}
        </div>
      )}

      {step === 'preview' && (
        <div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:4 }}>インポートプレビュー</div>
          <div style={{ fontSize:12, color:C.sub, marginBottom:16 }}>取り込むシートを選択 → {totalItems}件</div>

          {/* Store selector */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:10, color:C.sub, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>取込先店舗</div>
            <select value={storeId} onChange={e => setStoreId(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F }}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {/* Sheet checkboxes */}
          <div style={{ maxHeight:'40vh', overflowY:'auto', marginBottom:16 }}>
            {groups.map(g => (
              <div key={g.sheet} style={{
                padding:'10px 12px', marginBottom:6, background: checked[g.sheet] ? '#F5F3EE' : C.card,
                border:`1px solid ${checked[g.sheet] ? C.acc : C.bd}`, borderRadius:2, cursor:'pointer',
              }} onClick={() => setChecked(c => ({ ...c, [g.sheet]: !c[g.sheet] }))}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div>
                    <span style={{ fontSize:13, fontWeight:500, color:C.tx }}>{g.label}</span>
                    <span style={{ fontSize:11, color:C.sub, marginLeft:8 }}>{g.items.length}件</span>
                  </div>
                  <div style={{ width:18, height:18, borderRadius:2, border:`2px solid ${checked[g.sheet] ? C.acc : C.bd}`,
                    background: checked[g.sheet] ? C.acc : 'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {checked[g.sheet] && <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>✓</span>}
                  </div>
                </div>
                {/* Show first 3 items as preview */}
                {checked[g.sheet] && (
                  <div style={{ marginTop:6 }}>
                    {g.items.slice(0, 3).map((item, i) => (
                      <div key={i} style={{ fontSize:11, color:C.sub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {item.vintage || 'NV'} {item.name} ({item.quantity}本)
                      </div>
                    ))}
                    {g.items.length > 3 && <div style={{ fontSize:10, color:C.sub }}>...他 {g.items.length - 3}件</div>}
                  </div>
                )}
              </div>
            ))}
          </div>

          {error && <div style={{ color:C.red, fontSize:12, marginBottom:12 }}>{error}</div>}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.tx }}>キャンセル</button>
            <button onClick={doImport} disabled={totalItems === 0} style={{
              flex:1, padding:12, borderRadius:2, border:'none', background: totalItems > 0 ? C.acc : C.bd,
              color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer',
            }}>{totalItems}件を取込</button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:8 }}>取込中...</div>
          <div style={{ fontSize:13, color:C.sub }}>{totalItems}件をインポートしています</div>
        </div>
      )}

      {step === 'done' && result && (
        <div style={{ textAlign:'center', padding:20 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:8 }}>取込完了</div>
          <div style={{ fontSize:14, color:C.green, fontWeight:600, marginBottom:4 }}>{result.inserted}件 追加しました</div>
          {result.errors?.length > 0 && (
            <div style={{ fontSize:12, color:C.red, marginTop:8 }}>エラー: {result.errors.length}件</div>
          )}
          <button onClick={onClose} style={{
            marginTop:20, padding:'12px 32px', borderRadius:2, border:'none', background:C.acc,
            color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer',
          }}>閉じる</button>
        </div>
      )}
    </BottomSheet>
  );
}

// ===== PhotoImport =====
function PhotoImport({ stores, categories, onClose, onImported }) {
  const [step, setStep] = useState('capture'); // capture | loading | preview | importing | done
  const [items, setItems] = useState([]);
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [checked, setChecked] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const handleCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setStep('loading');

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Send to AI API
      const resp = await fetch('/api/ai/parse-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64 }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'AI解析エラー');
      if (!data.items || data.items.length === 0) throw new Error('アイテムが見つかりませんでした');

      setItems(data.items);
      const c = {};
      data.items.forEach((_, i) => { c[i] = true; });
      setChecked(c);
      setStep('preview');
    } catch (err) {
      setError(err.message);
      setStep('capture');
    }
  };

  const totalChecked = Object.values(checked).filter(Boolean).length;

  const doImport = async () => {
    if (!storeId) { setError('店舗を選択'); return; }
    setStep('importing');
    const selectedItems = items.filter((_, i) => checked[i]).map(item => ({
      name: item.name || item.name_ja,
      name_kana: item.name_ja || null,
      vintage: item.vintage || null,
      quantity: item.quantity || 1,
      cost_price: item.cost_price || null,
      producer: item.producer || null,
      region: item.region || null,
      notes: `AI入庫${item.name_ja ? ` / ${item.name_ja}` : ''}`,
    }));

    try {
      const resp = await fetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selectedItems, store_id: storeId }),
      });
      const data = await resp.json();
      setResult(data);
      setStep('done');
      if (data.inserted > 0) onImported();
    } catch (err) {
      setError('インポートエラー: ' + err.message);
      setStep('preview');
    }
  };

  return (
    <BottomSheet open={true} onClose={onClose}>
      {step === 'capture' && (
        <div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:4 }}>写真で入庫</div>
          <div style={{ fontSize:12, color:C.sub, marginBottom:16 }}>納品書・伝票を撮影するとAIがアイテムを読み取ります</div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display:'none' }} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => fileRef.current?.click()} style={{
              flex:1, padding:20, borderRadius:2, border:`2px dashed ${C.bd}`, background:'transparent',
              fontSize:14, fontFamily:F, color:C.acc, cursor:'pointer', textAlign:'center',
            }}>📷 撮影</button>
          </div>
          {error && <div style={{ color:C.red, fontSize:12, marginTop:12 }}>{error}</div>}
        </div>
      )}

      {step === 'loading' && (
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🔍</div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:8 }}>AI解析中...</div>
          <div style={{ fontSize:13, color:C.sub }}>納品書を読み取っています</div>
        </div>
      )}

      {step === 'preview' && (
        <div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:4 }}>読み取り結果</div>
          <div style={{ fontSize:12, color:C.sub, marginBottom:12 }}>{totalChecked}/{items.length}件 選択中</div>

          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.sub, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>取込先店舗</div>
            <select value={storeId} onChange={e => setStoreId(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F }}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ maxHeight:'45vh', overflowY:'auto', marginBottom:12 }}>
            {items.map((item, i) => (
              <div key={i} style={{
                padding:'10px 12px', marginBottom:4, background: checked[i] ? '#F5F3EE' : C.card,
                border:`1px solid ${checked[i] ? C.acc : C.bd}`, borderRadius:2, cursor:'pointer',
              }} onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:C.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.vintage || 'NV'} {item.name || item.name_ja}
                    </div>
                    {item.name_ja && item.name && <div style={{ fontSize:11, color:C.sub }}>{item.name_ja}</div>}
                    <div style={{ fontSize:10, color:C.sub, marginTop:2 }}>
                      {item.producer || ''}{item.quantity ? ` · ${item.quantity}本` : ''}{item.cost_price ? ` · ¥${item.cost_price.toLocaleString()}` : ''}
                    </div>
                  </div>
                  <div style={{ width:18, height:18, borderRadius:2, border:`2px solid ${checked[i] ? C.acc : C.bd}`,
                    background: checked[i] ? C.acc : 'transparent', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginLeft:8, marginTop:2 }}>
                    {checked[i] && <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>✓</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {error && <div style={{ color:C.red, fontSize:12, marginBottom:8 }}>{error}</div>}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setStep('capture'); setItems([]); setError(''); }} style={{ flex:1, padding:12, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.tx }}>撮り直し</button>
            <button onClick={doImport} disabled={totalChecked === 0} style={{
              flex:1, padding:12, borderRadius:2, border:'none', background: totalChecked > 0 ? C.acc : C.bd,
              color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer',
            }}>{totalChecked}件を入庫</button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx }}>入庫中...</div>
        </div>
      )}

      {step === 'done' && result && (
        <div style={{ textAlign:'center', padding:20 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:8 }}>入庫完了</div>
          <div style={{ fontSize:14, color:C.green, fontWeight:600 }}>{result.inserted}件 追加しました</div>
          <button onClick={onClose} style={{
            marginTop:20, padding:'12px 32px', borderRadius:2, border:'none', background:C.acc,
            color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer',
          }}>閉じる</button>
        </div>
      )}
    </BottomSheet>
  );
}

// ===== PhotoRemoval =====
function PhotoRemoval({ stores, onClose, onRemoved }) {
  const [step, setStep] = useState('capture'); // capture | loading | result
  const [identified, setIdentified] = useState(null);
  const [matches, setMatches] = useState([]);
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(null);
  const fileRef = useRef(null);

  const handleCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setStep('loading');

    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const resp = await fetch('/api/ai/identify-bottle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, store_id: storeId }),
      });

      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || 'AI識別エラー');

      setIdentified(data.identified);
      setMatches(data.matches || []);
      setStep('result');
    } catch (err) {
      setError(err.message);
      setStep('capture');
    }
  };

  const removeOne = async (item) => {
    if (item.quantity <= 0) return;
    setRemoving(item.id);
    try {
      await fetch(`/api/beverages/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Math.max(0, item.quantity - 1) }),
      });
      setMatches(prev => prev.map(m => m.id === item.id ? { ...m, quantity: m.quantity - 1 } : m));
      onRemoved();
    } catch (err) {
      setError(err.message);
    }
    setRemoving(null);
  };

  return (
    <BottomSheet open={true} onClose={onClose}>
      {step === 'capture' && (
        <div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:4 }}>写真で出庫</div>
          <div style={{ fontSize:12, color:C.sub, marginBottom:12 }}>ボトルのラベルを撮影するとAIが銘柄を特定します</div>

          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.sub, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>対象店舗</div>
            <select value={storeId} onChange={e => setStoreId(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F }}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <input ref={fileRef} type="file" accept="image/*" capture="environment" onChange={handleCapture} style={{ display:'none' }} />
          <button onClick={() => fileRef.current?.click()} style={{
            width:'100%', padding:20, borderRadius:2, border:`2px dashed ${C.bd}`, background:'transparent',
            fontSize:14, fontFamily:F, color:C.acc, cursor:'pointer', textAlign:'center',
          }}>📷 ラベルを撮影</button>
          {error && <div style={{ color:C.red, fontSize:12, marginTop:12 }}>{error}</div>}
        </div>
      )}

      {step === 'loading' && (
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🍷</div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:8 }}>ラベル解析中...</div>
          <div style={{ fontSize:13, color:C.sub }}>ワインを特定しています</div>
        </div>
      )}

      {step === 'result' && (
        <div>
          {identified && (
            <div style={{ padding:12, background:'#F5F3EE', borderRadius:2, marginBottom:12, border:`1px solid ${C.bd}` }}>
              <div style={{ fontSize:10, color:C.sub, marginBottom:4 }}>AI識別結果</div>
              <div style={{ fontSize:14, fontWeight:500, color:C.tx, fontFamily:EL }}>{identified.name}</div>
              {identified.name_ja && <div style={{ fontSize:12, color:C.sub }}>{identified.name_ja}</div>}
              <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>
                {identified.vintage || 'NV'} · {identified.producer || ''} · {identified.region || ''}
              </div>
            </div>
          )}

          <div style={{ fontSize:13, fontWeight:500, color:C.tx, marginBottom:8 }}>
            在庫マッチ ({matches.length}件)
          </div>

          {matches.length === 0 ? (
            <div style={{ textAlign:'center', padding:20, color:C.sub, fontSize:13 }}>該当する在庫が見つかりませんでした</div>
          ) : (
            <div style={{ maxHeight:'40vh', overflowY:'auto', marginBottom:12 }}>
              {matches.map(item => (
                <div key={item.id} style={{
                  padding:'10px 12px', marginBottom:4, background:C.card,
                  border:`1px solid ${C.bd}`, borderRadius:2,
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:C.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {item.vintage || 'NV'} {item.name}
                    </div>
                    <div style={{ marginTop:2 }}><QBadge q={item.quantity} /></div>
                  </div>
                  <button onClick={() => removeOne(item)} disabled={item.quantity <= 0 || removing === item.id}
                    style={{
                      padding:'8px 16px', borderRadius:2, border:'none',
                      background: item.quantity > 0 ? C.red : C.bd, color:'#fff',
                      fontSize:13, fontFamily:F, fontWeight:600, cursor: item.quantity > 0 ? 'pointer' : 'default',
                      opacity: removing === item.id ? 0.5 : 1, flexShrink:0, marginLeft:8,
                    }}>{removing === item.id ? '...' : '-1'}</button>
                </div>
              ))}
            </div>
          )}

          {error && <div style={{ color:C.red, fontSize:12, marginBottom:8 }}>{error}</div>}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setStep('capture'); setIdentified(null); setMatches([]); setError(''); }}
              style={{ flex:1, padding:12, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.tx }}>撮り直し</button>
            <button onClick={onClose} style={{
              flex:1, padding:12, borderRadius:2, border:'none', background:C.acc,
              color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer',
            }}>閉じる</button>
          </div>
        </div>
      )}
    </BottomSheet>
  );
}

// ===== StockManager =====
function StockManager({ onNavigate, onImport, onPhotoImport, onPhotoRemoval }) {
  const actions = [
    { icon: '📦', title: '在庫一覧', desc: '全アイテムを閲覧・管理', action: () => onNavigate('list-items', { title: '全在庫一覧' }) },
    { icon: '📷', title: '写真で入庫', desc: '納品書を撮影→AI読取→在庫追加', action: () => onPhotoImport() },
    { icon: '🍷', title: '写真で出庫', desc: 'ボトル撮影→AI識別→在庫-1', action: () => onPhotoRemoval() },
    { icon: '➕', title: '新規追加', desc: 'アイテムを手動で追加', action: () => onNavigate('add') },
    { icon: '📊', title: 'Excel取込', desc: 'Excelファイルから一括追加', action: () => onImport() },
    { icon: '📋', title: 'CSV出力', desc: '在庫データをCSVでエクスポート', action: () => {} },
  ];

  return (
    <div style={{ padding:'16px 16px 100px' }}>
      <div style={{ fontSize:18, fontWeight:400, letterSpacing:2, color:C.tx, fontFamily:EL, marginBottom:16 }}>入出庫管理</div>
      {actions.map((a, i) => (
        <div key={i} onClick={a.action} style={{
          padding:16, marginBottom:8, background:C.card, border:`1px solid ${C.bd}`,
          borderRadius:2, cursor:'pointer', display:'flex', gap:14, alignItems:'center',
        }}>
          <div style={{ fontSize:20, width:32, textAlign:'center' }}>{a.icon}</div>
          <div>
            <div style={{ fontSize:14, fontWeight:500, fontFamily:SR, color:C.tx }}>{a.title}</div>
            <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>{a.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===== ItemListPage =====
function ItemListPage({ title, storeId, categoryId, stores, categories, onBack, onSelect, onAdd }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const debRef = useRef(null);
  const PAGE_SIZE = 50;

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (storeId) p.set('store', storeId);
    if (categoryId) p.set('category', String(categoryId));
    if (q) p.set('q', q);
    p.set('page', String(page));
    p.set('limit', String(PAGE_SIZE));
    try {
      const r = await fetch('/api/beverages?' + p.toString());
      const data = await r.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch(e) { setItems([]); setTotal(0); }
    setLoading(false);
  }, [storeId, categoryId, q, page]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const onSearch = (val) => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setQ(val); setPage(1); }, 300);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const storeColor = {};
  stores.forEach(s => { storeColor[s.id] = s.color || '#4A6352'; });

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${C.bd}` }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><IcoBack /></button>
        <div style={{ flex:1, fontSize:15, fontWeight:500, fontFamily:SR, color:C.tx }}>{title || '在庫一覧'}</div>
        <span style={{ fontSize:12, color:C.sub }}>{total}件</span>
      </div>
      <div style={{ padding:'10px 16px' }}>
        <input onChange={e => onSearch(e.target.value)} placeholder="検索..."
          style={{ width:'100%', padding:'10px 14px', border:`1px solid ${C.bd}`, borderRadius:10, fontSize:14, fontFamily:F, background:C.card, boxSizing:'border-box', outline:'none' }} />
      </div>
      <div style={{ padding:'0 16px 100px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:C.sub, fontSize:13 }}>読み込み中...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:C.sub, fontSize:13 }}>該当なし</div>
        ) : items.map(item => (
          <div key={item.id} onClick={() => onSelect(item)} style={{
            background:C.card, borderRadius:1, padding:'12px 14px 12px 20px', border:`1px solid ${C.bd}`,
            marginBottom:5, cursor:'pointer', position:'relative',
          }}>
            <div style={{ position:'absolute', left:0, top:4, bottom:4, width:3, background: storeColor[item.store_id] || C.acc, opacity:0.6, borderRadius:'0 2px 2px 0' }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:14, fontWeight:600, fontFamily:EL, color:C.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>{item.producer || ''}{item.vintage ? ` · ${item.vintage}` : ''}</div>
                {item.region && <div style={{ fontSize:10, color:C.sub, marginTop:2 }}>{item.region}{item.appellation ? ` · ${item.appellation}` : ''}</div>}
              </div>
              <div style={{ flexShrink:0, marginLeft:8, textAlign:'right' }}>
                <QBadge q={item.quantity} />
                {item.price != null && <div style={{ fontSize:11, color:C.sub, marginTop:4 }}>{fmt(item.price)}</div>}
              </div>
            </div>
          </div>
        ))}
        {totalPages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:16, padding:'16px 0' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ padding:'8px 16px', borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:13, fontFamily:F, cursor: page > 1 ? 'pointer' : 'default', opacity: page > 1 ? 1 : 0.4 }}>前へ</button>
            <span style={{ fontSize:13, color:C.sub }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              style={{ padding:'8px 16px', borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:13, fontFamily:F, cursor: page < totalPages ? 'pointer' : 'default', opacity: page < totalPages ? 1 : 0.4 }}>次へ</button>
          </div>
        )}
      </div>
      <button onClick={onAdd} style={{
        position:'fixed', bottom:80, right:'calc(50% - 195px)', width:48, height:48, borderRadius:'50%',
        background:C.acc, color:'#fff', border:'none', fontSize:24, cursor:'pointer',
        boxShadow:'0 4px 12px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50,
      }}>+</button>
    </div>
  );
}

// ===== DetailModal =====
function DetailModal({ item, stores, categories, onClose, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (item) setForm({ ...item }); }, [item]);
  if (!item) return null;

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    setSaving(true);
    const updates = {};
    for (const k of ['name','producer','vintage','region','appellation','grape','price','cost_price','quantity','size_ml','notes','category_id','store_id']) {
      if (form[k] !== item[k]) updates[k] = form[k];
    }
    if (Object.keys(updates).length > 0) await onSave(item.id, updates);
    setEditing(false); setSaving(false);
  };

  const adjustQty = async (delta) => {
    await onSave(item.id, { quantity: Math.max(0, item.quantity + delta) });
  };

  const catName = categories.find(c => c.id === item.category_id)?.name || '-';
  const storeName = stores.find(s => s.id === item.store_id)?.name || item.store_id;
  const catOpts = categories.map(c => ({ value: c.id, label: (c.parent_id ? '  ' : '') + c.name }));
  const storeOpts = stores.map(s => ({ value: s.id, label: s.name }));

  const Field = ({ label, k, type, opts }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:10, color:C.sub, marginBottom:4, fontFamily:F, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
      {editing ? (
        opts ? (
          <select value={form[k] || ''} onChange={e => set(k, e.target.value === '' ? null : (type === 'number' ? Number(e.target.value) : e.target.value))}
            style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F, background:C.card, boxSizing:'border-box' }}>
            <option value="">-</option>
            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : type === 'textarea' ? (
          <textarea value={form[k] || ''} onChange={e => set(k, e.target.value)}
            style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F, minHeight:60, resize:'vertical', boxSizing:'border-box' }} />
        ) : (
          <input type={type || 'text'} value={form[k] ?? ''} onChange={e => set(k, type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
            style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F, boxSizing:'border-box' }} />
        )
      ) : (
        <div style={{ fontSize:14, color:C.tx, fontFamily: k === 'name' ? EL : F }}>{
          k === 'price' || k === 'cost_price' ? fmt(item[k]) :
          k === 'vintage' ? vintageLabel(item[k]) :
          k === 'size_ml' ? (item[k] ? `${item[k]}ml` : '-') :
          k === 'store_id' ? storeName :
          k === 'category_id' ? catName :
          item[k] || '-'
        }</div>
      )}
    </div>
  );

  return (
    <BottomSheet open={true} onClose={onClose}>
      <div style={{ fontSize:18, fontWeight:600, fontFamily:EL, color:C.tx, marginBottom:4 }}>{item.name}</div>
      <div style={{ fontSize:12, color:C.sub, marginBottom:16 }}>{item.producer || ''}{item.vintage ? ` · ${item.vintage}` : ''}</div>

      {!editing && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:20, padding:'16px 0', borderTop:`1px solid ${C.bd}`, borderBottom:`1px solid ${C.bd}`, marginBottom:16 }}>
          <button onClick={() => adjustQty(-1)} style={{ width:40, height:40, borderRadius:'50%', border:`1px solid ${C.bd}`, background:C.card, fontSize:18, cursor:'pointer', color:C.tx, display:'flex', alignItems:'center', justifyContent:'center' }}>−</button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:32, fontWeight:600, fontFamily:F, color:C.tx }}>{item.quantity}</div>
            <div style={{ fontSize:10, color:C.sub }}>在庫数</div>
          </div>
          <button onClick={() => adjustQty(1)} style={{ width:40, height:40, borderRadius:'50%', border:`1px solid ${C.bd}`, background:C.card, fontSize:18, cursor:'pointer', color:C.tx, display:'flex', alignItems:'center', justifyContent:'center' }}>+</button>
        </div>
      )}

      <Field label="ワイン名" k="name" />
      <Field label="生産者" k="producer" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="ヴィンテージ" k="vintage" type="number" />
        <Field label="サイズ" k="size_ml" type="number" />
      </div>
      <Field label="店舗" k="store_id" opts={storeOpts} />
      <Field label="カテゴリ" k="category_id" type="number" opts={catOpts} />
      <Field label="地域" k="region" />
      <Field label="アペラシオン" k="appellation" />
      <Field label="ブドウ品種" k="grape" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Field label="価格" k="price" type="number" />
        <Field label="仕入値" k="cost_price" type="number" />
      </div>
      {editing && <Field label="在庫数" k="quantity" type="number" />}
      <Field label="メモ" k="notes" type="textarea" />

      <div style={{ display:'flex', gap:10, marginTop:20 }}>
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} style={{ flex:1, padding:'12px', borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.tx }}>キャンセル</button>
            <button onClick={save} disabled={saving} style={{ flex:1, padding:'12px', borderRadius:2, border:'none', background:C.acc, color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer' }}>{saving ? '...' : '保存'}</button>
          </>
        ) : (
          <>
            <button onClick={() => { if (confirm(`「${item.name}」を削除しますか？`)) onDelete(item.id); }}
              style={{ flex:1, padding:'12px', borderRadius:2, border:`1px solid ${C.red}`, background:'transparent', color:C.red, fontSize:14, fontFamily:F, cursor:'pointer' }}>削除</button>
            <button onClick={() => setEditing(true)} style={{ flex:1, padding:'12px', borderRadius:2, border:'none', background:C.acc, color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer' }}>編集</button>
          </>
        )}
      </div>
    </BottomSheet>
  );
}

// ===== AddItemForm =====
function AddItemForm({ stores, categories, onClose, onAdd }) {
  const [form, setForm] = useState({ store_id: stores[0]?.id || '', quantity: 0, size_ml: 750 });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.store_id) return;
    setSaving(true); await onAdd(form); setSaving(false);
  };

  const Inp = ({ label, k, type, ph, opts }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:10, color:C.sub, marginBottom:4, fontFamily:F, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
      {opts ? (
        <select value={form[k] || ''} onChange={e => set(k, e.target.value === '' ? null : (type === 'number' ? Number(e.target.value) : e.target.value))}
          style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F, boxSizing:'border-box' }}>
          <option value="">-</option>
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type || 'text'} value={form[k] ?? ''} placeholder={ph} onChange={e => set(k, type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
          style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F, boxSizing:'border-box' }} />
      )}
    </div>
  );

  return (
    <BottomSheet open={true} onClose={onClose}>
      <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:16 }}>新規追加</div>
      <Inp label="ワイン名 *" k="name" ph="例: Meursault 1er Cru Les Perrières" />
      <Inp label="生産者" k="producer" ph="例: Domaine Roulot" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Inp label="ヴィンテージ" k="vintage" type="number" ph="2020" />
        <Inp label="サイズ (ml)" k="size_ml" type="number" />
      </div>
      <Inp label="店舗 *" k="store_id" opts={stores.map(s => ({ value: s.id, label: s.name }))} />
      <Inp label="カテゴリ" k="category_id" type="number" opts={categories.map(c => ({ value: c.id, label: (c.parent_id ? '  ' : '') + c.name }))} />
      <Inp label="地域" k="region" ph="Burgundy" />
      <Inp label="アペラシオン" k="appellation" />
      <Inp label="ブドウ品種" k="grape" ph="Chardonnay" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
        <Inp label="価格" k="price" type="number" />
        <Inp label="仕入値" k="cost_price" type="number" />
      </div>
      <Inp label="在庫数" k="quantity" type="number" />
      <div style={{ marginBottom:14 }}>
        <div style={{ fontSize:10, color:C.sub, marginBottom:4, fontFamily:F, textTransform:'uppercase', letterSpacing:0.5 }}>メモ</div>
        <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
          style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F, minHeight:60, resize:'vertical', boxSizing:'border-box' }} />
      </div>
      <button onClick={save} disabled={saving || !form.name || !form.store_id}
        style={{ width:'100%', padding:'14px', borderRadius:2, border:'none', background: (form.name && form.store_id) ? C.acc : C.bd, color:'#fff', fontSize:15, fontFamily:F, fontWeight:600, cursor:'pointer' }}>
        {saving ? '保存中...' : '追加'}
      </button>
    </BottomSheet>
  );
}

// ===== Main App =====
export default function App() {
  const { ok, login, logout } = useAuth();
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [tab, setTab] = useState('home');
  const [subView, setSubView] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPhotoImport, setShowPhotoImport] = useState(false);
  const [showPhotoRemoval, setShowPhotoRemoval] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!ok) return;
    fetch('/api/stores').then(r => r.json()).then(setStores).catch(() => {});
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {});
  }, [ok]);

  const navigate = (type, params = {}) => {
    if (type === 'add') { setShowAdd(true); return; }
    setSubView({ type, params });
  };
  const goBack = () => setSubView(null);

  const saveItem = async (id, updates) => {
    await fetch(`/api/beverages/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (selected?.id === id) {
      const r = await fetch(`/api/beverages/${id}`);
      setSelected(await r.json());
    }
    setToast('保存しました');
  };

  const deleteItem = async (id) => {
    await fetch(`/api/beverages/${id}`, { method: 'DELETE' });
    setSelected(null);
    setToast('削除しました');
  };

  const addItem = async (form) => {
    await fetch('/api/beverages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowAdd(false);
    setToast('追加しました');
  };

  if (!ok) return <LoginScreen onLogin={login} />;

  const renderView = () => {
    if (subView?.type === 'list-items') {
      return <ItemListPage title={subView.params.title} storeId={subView.params.store} categoryId={subView.params.category}
        stores={stores} categories={categories} onBack={goBack} onSelect={setSelected} onAdd={() => setShowAdd(true)} />;
    }
    switch (tab) {
      case 'home': return <HomeView stores={stores} categories={categories} onNavigate={navigate} />;
      case 'search': return <GlobalSearch stores={stores} onSelect={setSelected} />;
      case 'stock': return <StockManager onNavigate={navigate} onImport={() => setShowImport(true)} onPhotoImport={() => setShowPhotoImport(true)} onPhotoRemoval={() => setShowPhotoRemoval(true)} />;
      case 'list': return <ItemListPage title="全在庫一覧" stores={stores} categories={categories} onBack={() => setTab('home')} onSelect={setSelected} onAdd={() => setShowAdd(true)} />;
      case 'settings': return (
        <div style={{ padding:'16px 16px 100px' }}>
          <div style={{ fontSize:18, fontWeight:400, letterSpacing:2, color:C.tx, fontFamily:EL, marginBottom:16 }}>設定</div>
          <button onClick={logout} style={{ width:'100%', padding:14, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.red }}>ログアウト</button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{ maxWidth:430, margin:'0 auto', minHeight:'100vh', background:C.bg, fontFamily:F, position:'relative' }}>
      {renderView()}
      {!subView && <BottomNav tab={tab} onTab={(t) => { setTab(t); setSubView(null); }} />}
      {selected && <DetailModal item={selected} stores={stores} categories={categories} onClose={() => setSelected(null)} onSave={saveItem} onDelete={deleteItem} />}
      {showAdd && <AddItemForm stores={stores} categories={categories} onClose={() => setShowAdd(false)} onAdd={addItem} />}
      {showImport && <ExcelImport stores={stores} categories={categories} onClose={() => setShowImport(false)} onImported={() => setToast('インポート完了')} />}
      {showPhotoImport && <PhotoImport stores={stores} categories={categories} onClose={() => setShowPhotoImport(false)} onImported={() => setToast('写真入庫完了')} />}
      {showPhotoRemoval && <PhotoRemoval stores={stores} onClose={() => setShowPhotoRemoval(false)} onRemoved={() => setToast('出庫しました')} />}
      <Toast msg={toast} onClose={() => setToast('')} />
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        input:focus, select:focus, textarea:focus { border-color: ${C.acc} !important; outline: none; }
      `}</style>
    </div>
  );
}
