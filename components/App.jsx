"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { C, F, SR, EL, MCC, T, fmt, vintageLabel, CATEGORY_GROUPS } from '../lib/constants';
import { parseInventoryExcel, isMultiStoreFormat, getStoresFromResults, parseWineListExcel } from '../lib/excelParser';

// ===== Auth =====
const useAuth = () => {
  const [ok, setOk] = useState(false);
  useEffect(() => { setOk(sessionStorage.getItem('wc_auth') === 'ok'); }, []);
  const login = async (pin) => {
    const r = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pin }) });
    if (r.ok) { sessionStorage.setItem('wc_auth', 'ok'); setOk(true); return true; }
    return false;
  };
  const logout = () => { fetch('/api/auth', { method: 'DELETE' }).catch(() => {}); sessionStorage.removeItem('wc_auth'); setOk(false); };
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

// ===== AISommelier =====
function AISommelier({ onClose }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('You are a sommelier AI assistant. Answer in Japanese.');
  const bottomRef = useRef(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(stats => {
      const summary = `在庫概要: ${stats.total || 0}種, ${stats.totalQty || 0}本, 総額${Math.round((stats.totalValue || 0) / 10000)}万円, ${stats.storeCount || 0}店舗`;
      setSystemPrompt(`You are a sommelier AI assistant for Wine Compass. ${summary}. Answer in Japanese. Be concise.`);
    }).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput('');
    setLoading(true);
    try {
      const r = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: next.map(m => ({ role: m.role, content: m.content })), system: systemPrompt }),
      });
      const data = await r.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.text || data.error || 'エラーが発生しました' }]);
    } catch(e) {
      setMessages(prev => [...prev, { role: 'assistant', content: '通信エラーが発生しました' }]);
    }
    setLoading(false);
  };

  return (
    <div style={{ position:'fixed', inset:0, zIndex:10000, background:C.bg, display:'flex', flexDirection:'column' }}>
      <div style={{ padding:'14px 16px', borderBottom:`1px solid ${C.bd}`, display:'flex', alignItems:'center', justifyContent:'space-between', background:C.card }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:18 }}>🍷</span>
          <span style={{ fontSize:15, fontWeight:600, fontFamily:EL, color:C.tx }}>AI Sommelier</span>
        </div>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20, color:C.sub, padding:4 }}>✕</button>
      </div>
      <div style={{ flex:1, overflowY:'auto', padding:16 }}>
        {messages.length === 0 && (
          <div style={{ textAlign:'center', padding:'40px 20px', color:C.sub }}>
            <div style={{ fontSize:36, marginBottom:12 }}>🍷</div>
            <div style={{ fontSize:14, fontFamily:F, marginBottom:4 }}>AI Sommelier</div>
            <div style={{ fontSize:12, fontFamily:F }}>ワインに関する質問をどうぞ</div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', marginBottom:10 }}>
            <div style={{
              maxWidth:'80%', padding:'10px 14px', borderRadius:14,
              background: m.role === 'user' ? C.tx : C.card,
              color: m.role === 'user' ? '#fff' : C.tx,
              border: m.role === 'user' ? 'none' : `1px solid ${C.bd}`,
              fontSize:13, fontFamily:F, lineHeight:1.6, whiteSpace:'pre-wrap',
            }}>{m.content}</div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', justifyContent:'flex-start', marginBottom:10 }}>
            <div style={{ padding:'10px 14px', borderRadius:14, background:C.card, border:`1px solid ${C.bd}` }}>
              <div style={{ display:'flex', gap:4 }}>
                {[0,1,2].map(i => <div key={i} style={{ width:6, height:6, borderRadius:'50%', background:C.sub, animation:`pulse 1s ${i*0.2}s infinite` }} />)}
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>
      <div style={{ padding:'12px 16px', borderTop:`1px solid ${C.bd}`, background:C.card, display:'flex', gap:8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="質問を入力..."
          style={{ flex:1, padding:'10px 14px', border:`1px solid ${C.bd}`, borderRadius:20, fontSize:14, fontFamily:F, background:C.bg, outline:'none', boxSizing:'border-box' }} />
        <button onClick={send} disabled={!input.trim() || loading}
          style={{ padding:'10px 16px', borderRadius:20, border:'none', background: input.trim() ? C.acc : C.bd, color:'#fff', fontSize:13, fontWeight:600, fontFamily:F, cursor:'pointer', whiteSpace:'nowrap' }}>送信</button>
      </div>
    </div>
  );
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

// ===== fmtY — format yen values (万/億) =====
const fmtY = (n) => {
  if (!n && n !== 0) return '-';
  if (n >= 1e4) return Math.round(n / 1e4).toLocaleString() + '万';
  return Math.round(n).toLocaleString();
};

// ===== HomeView — matches Beverage Compass UI =====
function HomeView({ stores, categories, onNavigate, onWineList, onWineListPrint, onShowAI, onAIDiagnosis }) {
  const [stats, setStats] = useState(null);
  const [wlStats, setWlStats] = useState(null);

  const fetchAllStats = useCallback(async () => {
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/stats'),
        fetch('/api/wine-list/stats'),
      ]);
      const d1 = await r1.json();
      setStats(d1);
      try { const d2 = await r2.json(); setWlStats(d2); } catch(e) { setWlStats({ stores: {}, total: 0 }); }
    } catch(e) {
      setStats({ total: 0, totalQty: 0, totalValue: 0, stores: {}, storeCount: 0, categories: {} });
      setWlStats({ stores: {}, total: 0 });
    }
  }, []);

  useEffect(() => { fetchAllStats(); }, [fetchAllStats]);

  const storeCount = stats ? Object.keys(stats.stores || {}).filter(k => (stats.stores[k]?.total || 0) > 0).length : 0;

  // Store display names: special handling for Burgundy, C&H, umé
  const getStoreName = (store) => {
    if (store.id === 'burgundy') return 'Burgundy';
    if (store.id === 'ume') return 'umé';
    if (store.id === 'ch') return 'C&H';
    return store.name;
  };
  const getStoreSubName = (store) => {
    if (store.id === 'burgundy') return 'Warehouse';
    if (store.id === 'ch') return 'シェ・カルベール / Chez Calvert';
    if (store.id === 'ume') return 'umé';
    return store.name_en || '';
  };
  const getStoreFont = (store) => {
    if (store.id === 'burgundy' || store.id === 'ume' || store.id === 'ch') return EL;
    return SR;
  };

  return (
    <div style={{ padding:'16px 16px 100px' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
        <div style={{ fontSize:18, fontWeight:400, letterSpacing:1, color:C.tx, fontFamily:EL }}>Wine Compass</div>
        <button onClick={onShowAI} style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 12px', background:C.card, border:`1px solid ${C.bd}`, borderRadius:20, cursor:'pointer' }}>
          <span style={{ fontSize:14 }}>🍷</span>
          <span style={{ fontSize:11, fontWeight:600, color:C.acc, fontFamily:F }}>AI Sommelier</span>
        </button>
      </div>

      {/* All Inventory Summary */}
      <div style={{
        marginBottom:12, borderRadius:2, overflow:'hidden',
        background:'linear-gradient(135deg, #E0DBCF 0%, #D5D0C6 100%)',
        padding:'16px 20px', color:'#3A3630', border:`1px solid ${C.bd}`,
      }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <div style={{ fontSize:16, fontWeight:600, letterSpacing:1, fontFamily:EL }}>All Inventory</div>
          <div style={{ fontSize:10, color:'rgba(74,68,64,0.45)', fontFamily:F }}>{storeCount} stores</div>
        </div>
        <div style={{ display:'flex', gap:0 }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, color:'rgba(74,68,64,0.45)', textTransform:'uppercase', letterSpacing:1, fontFamily:F }}>在庫</div>
            <div style={{ fontSize:18, fontWeight:700, fontFamily:F, marginTop:2 }}>{(stats?.total || 0).toLocaleString()}種</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, color:'rgba(74,68,64,0.45)', textTransform:'uppercase', letterSpacing:1, fontFamily:F }}>本数</div>
            <div style={{ fontSize:18, fontWeight:700, fontFamily:F, marginTop:2 }}>{Math.round(stats?.totalQty || 0).toLocaleString()}本</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, color:'rgba(74,68,64,0.45)', textTransform:'uppercase', letterSpacing:1, fontFamily:F }}>在庫総額</div>
            <div style={{ fontSize:18, fontWeight:700, color:'#8B6914', fontFamily:F, marginTop:2 }}>{fmtY(Math.round(stats?.totalValue || 0))}円</div>
          </div>
        </div>
      </div>

      {/* Store Cards */}
      {stores.map(store => {
        const storeStats = stats?.stores?.[store.id] || null;
        const storeWlStats = wlStats?.stores?.[store.id] || null;
        const hasData = (storeStats && storeStats.total > 0) || (storeWlStats && storeWlStats.total > 0);

        return (
          <div key={store.id} style={{ marginBottom:8, borderRadius:2, overflow:'hidden', border:`1px solid ${C.bd}` }}>
            {/* Store Header */}
            <div style={{
              background:'linear-gradient(135deg, #EDE8DF 0%, #E4DED4 100%)',
              padding:'14px 16px', color:'#4A4440',
            }}>
              <div style={{ fontSize:20, fontWeight:400, fontFamily:getStoreFont(store), letterSpacing:'3px' }}>
                {getStoreName(store)}
              </div>
              <div style={{ fontSize:10, fontWeight:400, color:'rgba(74,68,64,0.5)', fontFamily:EL, letterSpacing:'1.5px', marginTop:3 }}>
                {getStoreSubName(store)}
              </div>
            </div>

            {/* Stock List & Wine List sections */}
            {hasData && (
              <div style={{ background:C.card }}>
                {/* Stock List */}
                <div style={{ display:'flex', alignItems:'center', borderBottom:`1px solid ${C.bd}` }}>
                  <div onClick={() => onNavigate('stock-categories', { store: store.id })} style={{
                    padding:'11px 16px', cursor:'pointer', display:'flex', alignItems:'center', flex:1,
                  }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.tx, flex:1, fontFamily:F }}>Stock List</div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      {storeStats && storeStats.total > 0 && (
                        <>
                          <span style={{ fontSize:11, color:C.sub, fontFamily:F }}>{storeStats.total}種</span>
                          <span style={{ fontSize:11, color:C.sub, fontFamily:F }}>{Math.round(storeStats.totalQty).toLocaleString()}本</span>
                          <span style={{ fontSize:11, color:C.acc, fontWeight:600, fontFamily:F }}>{fmtY(Math.round(storeStats.totalValue))}円</span>
                        </>
                      )}
                      <Chev open={false} />
                    </div>
                  </div>
                  {storeStats && storeStats.total > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); onAIDiagnosis(store.id, 'stock'); }} style={{
                      padding:'6px 10px', marginRight:12, borderRadius:14,
                      border:`1px solid ${C.bd}`, background:C.bg,
                      fontSize:9, fontWeight:600, color:C.acc, fontFamily:F,
                      cursor:'pointer', display:'flex', alignItems:'center', gap:3, whiteSpace:'nowrap',
                    }}>
                      <span style={{ fontSize:11 }}>🔬</span>AI
                    </button>
                  )}
                </div>

                {/* Wine List */}
                <div style={{ display:'flex', alignItems:'center' }}>
                  <div onClick={() => onWineListPrint(store.id)} style={{
                    padding:'11px 16px', cursor:'pointer', display:'flex', alignItems:'center', flex:1,
                  }}>
                    <div style={{ fontSize:12, fontWeight:600, color:C.tx, flex:1, fontFamily:F }}>Wine List</div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      {storeWlStats && storeWlStats.total > 0 && (
                        <>
                          <span style={{ fontSize:11, color:C.sub, fontFamily:F }}>{storeWlStats.total}種</span>
                          {storeWlStats.totalValue > 0 && <span style={{ fontSize:11, color:C.acc, fontWeight:600, fontFamily:F }}>{fmtY(Math.round(storeWlStats.totalValue))}円</span>}
                        </>
                      )}
                      <Chev open={false} />
                    </div>
                  </div>
                  {storeWlStats && storeWlStats.total > 0 && (
                    <button onClick={(e) => { e.stopPropagation(); onAIDiagnosis(store.id, 'winelist'); }} style={{
                      padding:'6px 10px', marginRight:12, borderRadius:14,
                      border:`1px solid ${C.bd}`, background:C.bg,
                      fontSize:9, fontWeight:600, color:C.acc, fontFamily:F,
                      cursor:'pointer', display:'flex', alignItems:'center', gap:3, whiteSpace:'nowrap',
                    }}>
                      <span style={{ fontSize:11 }}>🔬</span>AI
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ===== StockCategoryView — grouped category accordion =====
function StockCategoryView({ storeId, stores, categories, onBack, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [openGroup, setOpenGroup] = useState(null);

  const store = stores.find(s => s.id === storeId);
  const getStoreName = (s) => {
    if (s?.id === 'burgundy') return 'Burgundy';
    if (s?.id === 'ume') return 'umé';
    if (s?.id === 'ch') return 'C&H';
    return s?.name || '';
  };
  const getStoreFont = (s) => (s?.id === 'burgundy' || s?.id === 'ume' || s?.id === 'ch') ? EL : SR;

  useEffect(() => {
    fetch(`/api/stats?store=${storeId}`)
      .then(r => r.json())
      .then(d => setStats(d))
      .catch(() => setStats(null));
  }, [storeId]);

  // Compute grouped stats from allCategories
  const getGroupStats = (group) => {
    if (!stats) return { count: 0, qty: 0, value: 0 };
    if (group.categoryIds === null) {
      return { count: stats.total || 0, qty: stats.totalQty || 0, value: stats.totalValue || 0 };
    }
    let count = 0, qty = 0, value = 0;
    for (const catId of group.categoryIds) {
      const s = stats.allCategories?.[catId];
      if (s) {
        count += s.count || 0;
        qty += s.qty || 0;
        value += s.value || 0;
      }
    }
    return { count, qty, value };
  };

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${C.bd}` }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><IcoBack /></button>
        <div style={{ flex:1, fontSize:15, fontWeight:500, fontFamily:getStoreFont(store), color:C.tx }}>
          {getStoreName(store)} Stock
        </div>
      </div>

      <div style={{ padding:'12px 16px 100px' }}>
        {!stats ? (
          <div style={{ textAlign:'center', padding:40, color:C.sub, fontSize:13 }}>読み込み中...</div>
        ) : CATEGORY_GROUPS.map(group => {
          const gs = getGroupStats(group);
          if (group.key !== 'all' && gs.count === 0) return null;
          const isOpen = openGroup === group.key;
          const mccColors = MCC[group.label] || ['#6A6258', '#F0EDE8'];

          return (
            <div key={group.key} style={{ marginBottom:4, border:`1px solid ${C.bd}`, borderRadius:2, overflow:'hidden' }}>
              {/* Group header */}
              <div onClick={() => {
                if (group.key === 'all') {
                  onNavigate('list-items', { store: storeId, title: `${getStoreName(store)} - All Stock` });
                } else {
                  setOpenGroup(isOpen ? null : group.key);
                }
              }} style={{
                padding:'12px 16px', background:C.card, cursor:'pointer',
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:4, height:24, borderRadius:2, background:mccColors[0], opacity:0.6 }} />
                  <div style={{ fontSize:13, fontWeight:600, color:C.tx, fontFamily:F }}>{group.label}</div>
                </div>
                <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                  <span style={{ fontSize:11, color:C.sub }}>{gs.count}種</span>
                  <span style={{ fontSize:11, color:C.sub }}>{Math.round(gs.qty).toLocaleString()}本</span>
                  <span style={{ fontSize:11, color:C.acc, fontWeight:600 }}>{fmtY(Math.round(gs.value))}円</span>
                  {group.key !== 'all' && <Chev open={isOpen} />}
                </div>
              </div>

              {/* Expanded sub-categories */}
              {isOpen && group.categoryIds && (
                <div style={{ background:C.bg, borderTop:`1px solid ${C.bd}` }}>
                  {group.categoryIds.map(catId => {
                    const cat = categories.find(c => c.id === catId);
                    if (!cat) return null;
                    const cs = stats.allCategories?.[catId];
                    if (!cs || cs.count === 0) return null;
                    return (
                      <div key={catId} onClick={() => {
                        onNavigate('list-items', {
                          store: storeId,
                          category: catId,
                          title: `${getStoreName(store)} · ${cat.name}`,
                        });
                      }} style={{
                        padding:'10px 16px 10px 36px', cursor:'pointer',
                        borderBottom:`1px solid ${C.bd}`,
                        display:'flex', justifyContent:'space-between', alignItems:'center',
                      }}>
                        <span style={{ fontSize:12, color:C.tx, fontFamily:F }}>{cat.name}</span>
                        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                          <span style={{ fontSize:10, color:C.sub }}>{cs.count}種</span>
                          <span style={{ fontSize:10, color:C.sub }}>{Math.round(cs.qty).toLocaleString()}本</span>
                          <span style={{ fontSize:10, color:C.acc }}>{fmtY(Math.round(cs.value))}円</span>
                        </div>
                      </div>
                    );
                  })}
                  {/* Navigate to grouped list */}
                  <div onClick={() => {
                    onNavigate('list-items', {
                      store: storeId,
                      categories: group.categoryIds.join(','),
                      title: `${getStoreName(store)} · ${group.label}`,
                    });
                  }} style={{
                    padding:'8px 16px 8px 36px', cursor:'pointer',
                    display:'flex', justifyContent:'center', alignItems:'center',
                  }}>
                    <span style={{ fontSize:11, color:C.acc, fontWeight:600 }}>全て表示 →</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ===== AIDiagnosisView — store AI analysis (stock or winelist mode) =====
function AIDiagnosisView({ storeId, stores, mode, onBack }) {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const store = stores.find(s => s.id === storeId);
  const storeName = store?.name || storeId;
  const isWineList = mode === 'winelist';
  const title = isWineList ? `${storeName} ワインリストAI診断` : `${storeName} 在庫AI診断`;

  useEffect(() => {
    (async () => {
      try {
        if (isWineList) {
          // Fetch wine list items for this store
          const wlR = await fetch(`/api/wine-list?store=${storeId}`);
          if (!wlR.ok) throw new Error('Wine list fetch failed');
          const wlData = await wlR.json();
          const items = wlData.items || wlData || [];

          const catBreakdown = {};
          let totalItems = 0, totalValue = 0, minPrice = Infinity, maxPrice = 0;
          for (const item of items) {
            const catName = item.beverage?.category_name || item.category?.name || '不明';
            if (!catBreakdown[catName]) catBreakdown[catName] = { count: 0, prices: [] };
            catBreakdown[catName].count++;
            const p = item.beverage?.price || 0;
            if (p > 0) { catBreakdown[catName].prices.push(p); totalValue += p; if (p < minPrice) minPrice = p; if (p > maxPrice) maxPrice = p; }
            totalItems++;
          }
          const catSummary = Object.entries(catBreakdown)
            .map(([name, d]) => {
              const avgP = d.prices.length > 0 ? Math.round(d.prices.reduce((a,b)=>a+b,0) / d.prices.length) : 0;
              return `${name}: ${d.count}種 (平均${Math.round(avgP/1000)}千円)`;
            }).join(', ');

          const prompt = `店舗「${storeName}」のワインリストを分析してください。\n\n概要: ${totalItems}種掲載, 価格帯 ¥${minPrice === Infinity ? 0 : minPrice.toLocaleString()}〜¥${maxPrice.toLocaleString()}\n\nカテゴリ内訳: ${catSummary}\n\n以下を簡潔にまとめてください:\n1. ワインリスト全体のバランス評価（シャンパーニュ、白、赤、その他の比率）\n2. 価格帯のバランス（エントリー/ミドル/ハイエンド）\n3. 強みと弱み\n4. 補充すべきカテゴリ・価格帯の提案`;

          const r = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: prompt }],
              system: 'You are a sommelier and wine list consultant. Provide concise, actionable wine list analysis in Japanese. Use bullet points. Consider balance of regions, price tiers, and guest experience.',
            }),
          });
          if (!r.ok) throw new Error('AI analysis failed');
          const data = await r.json();
          setResult(data.text || data.content || JSON.stringify(data));
        } else {
          // Stock analysis (existing logic)
          const statsR = await fetch(`/api/stats?store=${storeId}`);
          if (!statsR.ok) throw new Error('Stats fetch failed');
          const stats = await statsR.json();

          const catSummary = Object.entries(stats.categories || {})
            .map(([, s]) => `${s.name}: ${s.count}種/${s.qty}本/${Math.round(s.value / 10000)}万円`)
            .join(', ');

          const prompt = `店舗「${storeName}」の在庫を分析してください。\n\n概要: ${stats.total}種, ${stats.totalQty}本, 総額${Math.round(stats.totalValue / 10000)}万円\n\nカテゴリ内訳: ${catSummary}\n\n以下を簡潔にまとめてください:\n1. 在庫構成のバランス評価\n2. 過剰在庫・不足の傾向\n3. 価格帯分析と改善提案`;

          const r = await fetch('/api/ai/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [{ role: 'user', content: prompt }],
              system: 'You are a wine inventory analyst. Provide concise, actionable analysis in Japanese. Use bullet points.',
            }),
          });
          if (!r.ok) throw new Error('AI analysis failed');
          const data = await r.json();
          setResult(data.text || data.content || JSON.stringify(data));
        }
      } catch (e) {
        setError(e.message);
      }
      setLoading(false);
    })();
  }, [storeId, storeName, isWineList]);

  return (
    <div style={{ minHeight: '100vh', background: C.bg }}>
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.bd}` }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><IcoBack /></button>
        <div style={{ flex: 1, fontSize: 15, fontWeight: 500, fontFamily: SR, color: C.tx }}>
          🔬 {title}
        </div>
      </div>

      <div style={{ padding: '16px 16px 100px' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <div style={{ width: 24, height: 24, border: `2px solid ${C.bd}`, borderTopColor: C.acc, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
            <div style={{ fontSize: 13, color: C.sub }}>{isWineList ? 'ワインリストを分析中...' : '在庫データを分析中...'}</div>
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <div style={{ fontSize: 13, color: C.red, marginBottom: 8 }}>分析エラー</div>
            <div style={{ fontSize: 11, color: C.sub }}>{error}</div>
          </div>
        ) : (
          <div style={{
            background: C.card, border: `1px solid ${C.bd}`, borderRadius: 2,
            padding: '16px 20px', fontSize: 13, lineHeight: 1.8, color: C.tx, fontFamily: F,
            whiteSpace: 'pre-wrap',
          }}>
            {result}
          </div>
        )}
      </div>
    </div>
  );
}

// ===== ReplenishAlert — shown when stock hits 0 for a wine-listed item =====
function ReplenishAlert({ data, stores, onClose, onReplenish }) {
  const [replenishing, setReplenishing] = useState(false);
  if (!data || !data.needsAction) return null;

  const { beverage, onWineList, burgundyMatch, aiSuggestions } = data;

  const doReplenish = async (burgundyItem) => {
    setReplenishing(true);
    try {
      // Transfer: decrease Burgundy stock, increase store stock
      await fetch(`/api/beverages/${burgundyItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Math.max(0, burgundyItem.quantity - 1) }),
      });
      await fetch(`/api/beverages/${beverage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 1 }),
      });
      if (onReplenish) onReplenish();
      onClose();
    } catch (e) {}
    setReplenishing(false);
  };

  return (
    <BottomSheet open={true} onClose={onClose}>
      <div>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <span style={{ fontSize:20 }}>⚠️</span>
          <div>
            <div style={{ fontSize:15, fontWeight:600, color:C.tx, fontFamily:F }}>在庫切れ</div>
            <div style={{ fontSize:11, color:C.sub }}>
              {onWineList ? 'ワインリスト掲載中のワインです' : '在庫が0になりました'}
            </div>
          </div>
        </div>

        {/* Wine info */}
        <div style={{ padding:12, background:'#F5F3EE', borderRadius:2, marginBottom:16, border:`1px solid ${C.bd}` }}>
          <div style={{ fontSize:14, fontWeight:600, fontFamily:EL, color:C.tx }}>
            {beverage.name}
          </div>
          <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>
            {beverage.vintage || 'NV'} · {beverage.producer || ''}
          </div>
        </div>

        {/* Burgundy exact match */}
        {burgundyMatch?.type === 'exact' && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.green, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <span>✅</span> バーガンディ倉庫に在庫あり
            </div>
            <div style={{ padding:12, background:C.card, border:`1px solid ${C.bd}`, borderRadius:2,
              display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontSize:13, fontWeight:500, color:C.tx }}>{burgundyMatch.item.name}</div>
                <div style={{ fontSize:11, color:C.sub }}>{burgundyMatch.item.vintage || 'NV'} · 在庫{burgundyMatch.item.quantity}本</div>
              </div>
              <button onClick={() => doReplenish(burgundyMatch.item)} disabled={replenishing}
                style={{ padding:'8px 16px', borderRadius:2, border:'none', background:C.green, color:'#fff',
                  fontSize:12, fontFamily:F, fontWeight:600, cursor:'pointer', opacity: replenishing ? 0.5 : 1 }}>
                {replenishing ? '...' : '補充する'}
              </button>
            </div>
          </div>
        )}

        {/* Burgundy similar matches */}
        {burgundyMatch?.type === 'similar' && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.acc, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <span>🔍</span> バーガンディ倉庫に類似ワインあり
            </div>
            {burgundyMatch.items.slice(0, 3).map(item => (
              <div key={item.id} style={{ padding:10, background:C.card, border:`1px solid ${C.bd}`, borderRadius:2,
                display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:12, fontWeight:500, color:C.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize:10, color:C.sub }}>{item.vintage || 'NV'} · 在庫{item.quantity}本</div>
                </div>
                <button onClick={() => doReplenish(item)} disabled={replenishing}
                  style={{ padding:'6px 12px', borderRadius:2, border:`1px solid ${C.green}`, background:'transparent',
                    color:C.green, fontSize:11, fontFamily:F, fontWeight:600, cursor:'pointer', flexShrink:0, marginLeft:8 }}>
                  補充
                </button>
              </div>
            ))}
          </div>
        )}

        {/* No Burgundy match */}
        {!burgundyMatch && (
          <div style={{ fontSize:12, color:C.sub, marginBottom:12, padding:8, background:'#FFF8F0', borderRadius:2, border:'1px solid #F0E8D8' }}>
            バーガンディ倉庫に該当する在庫がありません
          </div>
        )}

        {/* AI suggestions */}
        {aiSuggestions && aiSuggestions.length > 0 && (
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:12, fontWeight:600, color:C.acc, marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
              <span>🤖</span> AIおすすめ代替ワイン
            </div>
            {aiSuggestions.map((s, i) => (
              <div key={i} style={{ padding:10, background:C.card, border:`1px solid ${C.bd}`, borderRadius:2, marginBottom:4 }}>
                <div style={{ fontSize:12, fontWeight:500, color:C.tx }}>{s.name}</div>
                <div style={{ fontSize:10, color:C.sub, marginTop:2 }}>{s.reason}</div>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display:'flex', gap:8, marginTop:8 }}>
          {onWineList && (
            <button onClick={() => { /* Could auto-remove from wine list */ onClose(); }}
              style={{ flex:1, padding:12, borderRadius:2, border:`1px solid ${C.red}`, background:'transparent',
                color:C.red, fontSize:12, fontFamily:F, fontWeight:600, cursor:'pointer' }}>
              リストから外す
            </button>
          )}
          <button onClick={onClose}
            style={{ flex:1, padding:12, borderRadius:2, border:'none', background:C.acc,
              color:'#fff', fontSize:12, fontFamily:F, fontWeight:600, cursor:'pointer' }}>
            確認
          </button>
        </div>
      </div>
    </BottomSheet>
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

  const storeColor = {}, storeName = {};
  stores.forEach(s => { storeColor[s.id] = s.color || '#4A6352'; storeName[s.id] = s.name || s.id; });

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
        ) : (<>
          <div style={{ fontSize:11, color:C.sub, fontFamily:F, marginBottom:6, paddingLeft:2 }}>{results.length}件</div>
          {results.map(item => (
          <div key={item.id} onClick={() => onSelect(item)} style={{
            background:C.card, borderRadius:1, padding:'10px 14px 10px 20px', border:`1px solid ${C.bd}`,
            marginBottom:4, cursor:'pointer', position:'relative',
          }}>
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background: storeColor[item.store_id] || C.acc, opacity:0.5 }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingLeft:4 }}>
              <div style={{ flex:1, minWidth:0 }}>
                {item.producer && <div style={{ fontSize:9, color:'#A09A8C', fontFamily:F, letterSpacing:0.3 }}>{item.producer}</div>}
                <div style={{ fontSize:14, fontWeight:600, fontFamily:EL, color:C.tx, lineHeight:1.35, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}{item.vintage && <span style={{ fontWeight:400, fontSize:12, color:'#8A8478', marginLeft:3, fontFamily:F }}>{item.vintage}</span>}</div>
                <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:3 }}>
                  <span style={{ fontSize:8, padding:'1px 6px', borderRadius:4, background:storeColor[item.store_id]||C.acc, color:'#fff', fontFamily:F }}>{storeName[item.store_id]||''}</span>
                </div>
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0, marginLeft:10 }}>
                <span style={{ fontSize:12, fontWeight:600, color: (item.quantity||0) <= 1 ? C.red : C.green, fontFamily:F }}>{item.quantity || 0}本</span>
                {item.price != null && <span style={{ fontSize:10, color:'#B0AA9C', fontFamily:F }}>{fmt(item.price)}</span>}
              </div>
            </div>
          </div>
        ))}
        </>)}
      </div>
    </div>
  );
}

// ===== ExcelImport =====
function ExcelImport({ stores, categories, onClose, onImported }) {
  const [step, setStep] = useState('select'); // select | preview | confirm | importing | done
  const [groups, setGroups] = useState([]);
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [importTarget, setImportTarget] = useState('stock'); // stock | winelist
  const [checked, setChecked] = useState({});
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [fileFormat, setFileFormat] = useState(null); // 'burgundy' | 'store'
  const [importProgress, setImportProgress] = useState('');
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

      if (importTarget === 'winelist') {
        // Wine list import
        const parsed = parseWineListExcel(wb, XLSX);
        if (parsed.length === 0) {
          setError(`ワインリストデータが見つかりません（シート: ${wb.SheetNames.join(', ')}）`);
          return;
        }
        setFileFormat('winelist');
        setGroups(parsed);
        const c = {};
        parsed.forEach(g => { c[g.section || g.sheet] = true; });
        setChecked(c);
        setStep('preview');
      } else {
        // Inventory import
        const fmt = isMultiStoreFormat(wb, XLSX) ? 'store' : 'burgundy';
        setFileFormat(fmt);
        const parsed = parseInventoryExcel(wb, XLSX);
        if (parsed.length === 0) {
          setError(`データが見つかりません（シート: ${wb.SheetNames.join(', ')}、形式: ${fmt}）`);
          return;
        }
        setGroups(parsed);
        const c = {};
        parsed.forEach(g => { c[g.sheet] = true; });
        setChecked(c);
        if (fmt === 'store') setStoreId('auto');
        setStep('preview');
      }
    } catch (err) {
      setError('ファイル読取エラー: ' + err.message);
    }
  };

  const selectedGroups = fileFormat === 'winelist'
    ? groups.filter(g => checked[g.section || g.sheet])
    : groups.filter(g => checked[g.sheet]);
  const selectedItems = selectedGroups.flatMap(g => g.items);
  const totalItems = selectedItems.length;

  // For multi-store: count by store
  const storeBreakdown = {};
  if (fileFormat === 'store') {
    selectedItems.forEach(item => {
      const sid = item._storeId || 'unknown';
      storeBreakdown[sid] = (storeBreakdown[sid] || 0) + 1;
    });
  }

  const doImport = async () => {
    setStep('importing');
    setImportProgress('');

    // Wine list import
    if (fileFormat === 'winelist') {
      const targetStore = storeId;
      if (!targetStore || targetStore === 'auto') {
        setError('店舗を選択してください');
        setStep('preview');
        return;
      }
      setImportProgress('既存リストを削除中...');
      try {
        // Delete existing wine list items for this store
        await fetch(`/api/wine-list-items?store=${targetStore}`, { method: 'DELETE' });
      } catch(e) {}

      // Build items with section info
      const allItems = [];
      for (const grp of selectedGroups) {
        for (const item of grp.items) {
          allItems.push({
            ...item,
            section: grp.section,
            section_en: grp.section_en,
            section_order: grp.section_order,
          });
        }
      }

      setImportProgress(`${allItems.length}件を登録中...`);
      try {
        const r = await fetch('/api/wine-list-items', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ store_id: targetStore, items: allItems }),
        });
        const data = await r.json();
        setResult({ inserted: data.inserted || 0, total: allItems.length, errors: data.errors });
        setStep('done');
        if (data.inserted > 0) onImported();
      } catch(err) {
        setError('ワインリスト取込エラー: ' + err.message);
        setStep('preview');
      }
      return;
    }

    if (fileFormat === 'store' && storeId === 'auto') {
      // Multi-store: import per store
      const byStore = {};
      selectedItems.forEach(item => {
        const sid = item._storeId || 'unknown';
        if (!byStore[sid]) byStore[sid] = [];
        byStore[sid].push(item);
      });

      let totalInserted = 0;
      const allErrors = [];
      const storeKeys = Object.keys(byStore);

      for (let i = 0; i < storeKeys.length; i++) {
        const sid = storeKeys[i];
        const items = byStore[sid];
        const storeName = stores.find(s => s.id === sid)?.name || sid;
        setImportProgress(`${storeName} (${i + 1}/${storeKeys.length})...`);

        try {
          const r = await fetch('/api/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items, store_id: sid }),
          });
          const data = await r.json();
          totalInserted += (data.inserted || 0);
          if (data.errors?.length > 0) allErrors.push(...data.errors.map(e => ({ ...e, store: sid })));
        } catch (err) {
          allErrors.push({ store: sid, error: err.message });
        }
      }

      setResult({ inserted: totalInserted, total: totalItems, errors: allErrors, storeCount: storeKeys.length });
      setStep('done');
      if (totalInserted > 0) onImported();
    } else {
      // Single store (Burgundy or manually selected)
      const targetStore = storeId === 'auto' ? 'burgundy' : storeId;
      try {
        const r = await fetch('/api/import', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items: selectedItems, store_id: targetStore }),
        });
        const data = await r.json();
        setResult(data);
        setStep('done');
        if (data.inserted > 0) onImported();
      } catch (err) {
        setError('インポートエラー: ' + err.message);
        setStep('preview');
      }
    }
  };

  return (
    <BottomSheet open={true} onClose={onClose}>
      {step === 'select' && (
        <div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:16 }}>Excel取込</div>

          {/* Stock or Wine List */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:10, color:C.sub, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>取込種別</div>
            <div style={{ display:'flex', gap:8 }}>
              {[{ val:'stock', label:'在庫' }, { val:'winelist', label:'ワインリスト' }].map(opt => (
                <button key={opt.val} onClick={() => setImportTarget(opt.val)} style={{
                  flex:1, padding:'10px 8px', borderRadius:2, fontSize:13, fontFamily:F, fontWeight:600, cursor:'pointer',
                  border: importTarget === opt.val ? `2px solid ${C.acc}` : `1px solid ${C.bd}`,
                  background: importTarget === opt.val ? '#F5F0E5' : C.card,
                  color: importTarget === opt.val ? C.acc : C.tx,
                }}>{opt.label}</button>
              ))}
            </div>
          </div>

          <div style={{ fontSize:12, color:C.sub, marginBottom:14 }}>
            Excelファイル (.xlsx) を選択してください。
            <br />バーガンディ在庫・5社在庫いずれも自動判別します。
          </div>
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

          {/* Format badge */}
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:2,
              background: fileFormat === 'winelist' ? '#E8E0F0' : fileFormat === 'burgundy' ? '#F0E8D8' : '#E8F0E8',
              color: fileFormat === 'winelist' ? '#6A4A8A' : fileFormat === 'burgundy' ? '#8A6A30' : '#3A6A3A',
              fontWeight:600 }}>
              {fileFormat === 'winelist' ? 'ワインリスト' : fileFormat === 'burgundy' ? 'バーガンディ在庫' : '5社在庫一覧'}
            </span>
            <span style={{ fontSize:11, padding:'2px 8px', borderRadius:2, background:'#F0F0F0', color:C.tx }}>
              {totalItems}件
            </span>
          </div>

          {/* Store selector for Burgundy or Wine List */}
          {(fileFormat === 'burgundy' || fileFormat === 'winelist') && (
            <div style={{ marginBottom:12 }}>
              <div style={{ fontSize:10, color:C.sub, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>
                {fileFormat === 'winelist' ? 'リスト先店舗' : '取込先店舗'}
              </div>
              <select value={storeId} onChange={e => setStoreId(e.target.value)}
                style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F }}>
                {stores.filter(s => fileFormat === 'winelist' ? s.id !== 'burgundy' : true).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}

          {/* For multi-store: show store breakdown */}
          {fileFormat === 'store' && Object.keys(storeBreakdown).length > 0 && (
            <div style={{ marginBottom:12, padding:10, background:'#F5F3EE', borderRadius:2, border:`1px solid ${C.bd}` }}>
              <div style={{ fontSize:10, color:C.sub, marginBottom:6, textTransform:'uppercase', letterSpacing:0.5 }}>店舗別内訳（自動振り分け）</div>
              {Object.entries(storeBreakdown).map(([sid, cnt]) => (
                <div key={sid} style={{ fontSize:12, color:C.tx, display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                  <span>{stores.find(s => s.id === sid)?.name || sid}</span>
                  <span style={{ color:C.sub }}>{cnt}件</span>
                </div>
              ))}
            </div>
          )}

          {/* Section/Sheet checkboxes */}
          <div style={{ maxHeight:'35vh', overflowY:'auto', marginBottom:16 }}>
            {groups.map(g => {
              const key = fileFormat === 'winelist' ? (g.section || g.sheet) : g.sheet;
              const label = fileFormat === 'winelist' ? `${g.section_en || ''} ${g.section || ''}`.trim() : g.label;
              return (
                <div key={key} style={{
                  padding:'10px 12px', marginBottom:6, background: checked[key] ? '#F5F3EE' : C.card,
                  border:`1px solid ${checked[key] ? C.acc : C.bd}`, borderRadius:2, cursor:'pointer',
                }} onClick={() => setChecked(c => ({ ...c, [key]: !c[key] }))}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <span style={{ fontSize:13, fontWeight:500, color:C.tx }}>{label}</span>
                      <span style={{ fontSize:11, color:C.sub, marginLeft:8 }}>{g.items.length}件</span>
                    </div>
                    <div style={{ width:18, height:18, borderRadius:2, border:`2px solid ${checked[key] ? C.acc : C.bd}`,
                      background: checked[key] ? C.acc : 'transparent', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {checked[key] && <span style={{ color:'#fff', fontSize:12, fontWeight:700 }}>✓</span>}
                    </div>
                  </div>
                  {checked[key] && (
                    <div style={{ marginTop:6 }}>
                      {g.items.slice(0, 3).map((item, i) => (
                        <div key={i} style={{ fontSize:11, color:C.sub, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {fileFormat === 'winelist'
                            ? `${item.vintage || 'NV'} ${item.name_en || item.name_jp || ''} ${item.sell_price ? '¥' + item.sell_price.toLocaleString() : ''}`
                            : `${item.vintage || 'NV'} ${item.name} (${item.quantity}本)`
                          }
                        </div>
                      ))}
                      {g.items.length > 3 && <div style={{ fontSize:10, color:C.sub }}>...他 {g.items.length - 3}件</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {error && <div style={{ color:C.red, fontSize:12, marginBottom:12 }}>{error}</div>}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setStep('select'); setGroups([]); setFileFormat(null); }} style={{ flex:1, padding:12, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.tx }}>戻る</button>
            <button onClick={() => setStep('confirm')} disabled={totalItems === 0} style={{
              flex:1, padding:12, borderRadius:2, border:'none', background: totalItems > 0 ? C.acc : C.bd,
              color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer',
            }}>確認 →</button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:8 }}>上書きしますか？</div>
          <div style={{ padding:16, background:'#FFF8F0', border:`1px solid #E8D8C0`, borderRadius:2, marginBottom:16 }}>
            <div style={{ fontSize:13, color:C.tx, lineHeight:1.8 }}>
              {fileFormat === 'store' ? (
                <>
                  <div><strong>形式:</strong> 5社在庫一覧（自動振り分け）</div>
                  <div><strong>種別:</strong> {importTarget === 'winelist' ? 'ワインリスト' : '在庫'}</div>
                  <div><strong>件数:</strong> {totalItems}件 → {Object.keys(storeBreakdown).length}店舗</div>
                  {Object.entries(storeBreakdown).map(([sid, cnt]) => (
                    <div key={sid} style={{ fontSize:12, marginLeft:16 }}>
                      {stores.find(s => s.id === sid)?.name || sid}: {cnt}件
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div><strong>取込先:</strong> {stores.find(s => s.id === storeId)?.name || storeId}</div>
                  <div><strong>種別:</strong> {importTarget === 'winelist' ? 'ワインリスト' : '在庫'}</div>
                  <div><strong>件数:</strong> {totalItems}件</div>
                </>
              )}
            </div>
            <div style={{ fontSize:12, color:'#8A6A30', marginTop:10, lineHeight:1.6 }}>
              既存データに同名・同ヴィンテージのアイテムがある場合、数量と価格が上書きされます。新規アイテムは追加されます。
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep('preview')} style={{ flex:1, padding:12, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.tx }}>戻る</button>
            <button onClick={doImport} style={{
              flex:1, padding:12, borderRadius:2, border:'none', background:C.wine,
              color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer',
            }}>{totalItems}件を取込</button>
          </div>
        </div>
      )}

      {step === 'importing' && (
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:8 }}>取込中...</div>
          <div style={{ fontSize:13, color:C.sub }}>{totalItems}件をインポートしています</div>
          {importProgress && <div style={{ fontSize:12, color:C.acc, marginTop:8 }}>{importProgress}</div>}
        </div>
      )}

      {step === 'done' && result && (
        <div style={{ textAlign:'center', padding:20 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:8 }}>取込完了</div>
          <div style={{ fontSize:14, color:C.green, fontWeight:600, marginBottom:4 }}>
            {result.inserted}件 追加しました
            {result.storeCount && ` (${result.storeCount}店舗)`}
          </div>
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
  const [fileName, setFileName] = useState('');
  const cameraRef = useRef(null);
  const fileRef = useRef(null);

  const processFile = async (file) => {
    if (!file) return;
    setError('');
    setFileName(file.name);
    setStep('loading');

    try {
      const reader = new FileReader();
      const base64 = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const isPDF = file.type === 'application/pdf';
      const resp = await fetch('/api/ai/parse-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(isPDF ? { document: base64 } : { image: base64 }),
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
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:4 }}>AI入庫</div>
          <div style={{ fontSize:12, color:C.sub, marginBottom:16 }}>納品書・伝票の写真やファイルからAIがアイテムを読み取ります</div>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={e => processFile(e.target.files?.[0])} style={{ display:'none' }} />
          <input ref={fileRef} type="file" accept="image/*,.pdf" onChange={e => processFile(e.target.files?.[0])} style={{ display:'none' }} />
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => cameraRef.current?.click()} style={{
              flex:1, padding:20, borderRadius:2, border:`2px dashed ${C.bd}`, background:'transparent',
              fontSize:14, fontFamily:F, color:C.acc, cursor:'pointer', textAlign:'center',
            }}>📷 撮影</button>
            <button onClick={() => fileRef.current?.click()} style={{
              flex:1, padding:20, borderRadius:2, border:`2px dashed ${C.bd}`, background:'transparent',
              fontSize:14, fontFamily:F, color:C.acc, cursor:'pointer', textAlign:'center',
            }}>📄 ファイル選択</button>
          </div>
          <div style={{ fontSize:10, color:C.sub, marginTop:8, textAlign:'center' }}>画像（JPG, PNG）・PDF対応</div>
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
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:4 }}>読み取り結果 — 1件ずつ確認</div>
          <div style={{ fontSize:12, color:C.sub, marginBottom:8 }}>{totalChecked}/{items.length}件 選択中 · チェックを外すと入庫しません</div>

          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:C.sub, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>取込先店舗</div>
            <select value={storeId} onChange={e => setStoreId(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F }}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ maxHeight:'45vh', overflowY:'auto', marginBottom:12 }}>
            {items.map((item, i) => (
              <div key={i} style={{
                padding:'10px 12px', marginBottom:6, background: checked[i] ? '#F5F3EE' : '#FAFAFA',
                border:`1px solid ${checked[i] ? C.acc : '#E0D8D0'}`, borderRadius:2,
                opacity: checked[i] ? 1 : 0.6,
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    {/* Original language name */}
                    <div style={{ fontSize:14, fontWeight:600, fontFamily:EL, color:C.tx, lineHeight:1.3 }}>
                      {item.name || item.name_ja}
                    </div>
                    {/* Kana name */}
                    {item.name_ja && item.name && item.name_ja !== item.name && (
                      <div style={{ fontSize:10, color:'#B0AA9C', marginTop:1 }}>{item.name_ja}</div>
                    )}
                    {/* Details row */}
                    <div style={{ fontSize:10, color:C.sub, marginTop:3, display:'flex', flexWrap:'wrap', gap:4 }}>
                      <span style={{ background:'#F0EDE8', padding:'1px 5px', borderRadius:2 }}>{item.vintage || 'NV'}</span>
                      {item.producer && <span>{item.producer}</span>}
                      {item.quantity && <span style={{ fontWeight:600 }}>{item.quantity}本</span>}
                      {item.cost_price && <span>¥{item.cost_price.toLocaleString()}</span>}
                    </div>
                  </div>
                  {/* Toggle checkbox */}
                  <div onClick={() => setChecked(c => ({ ...c, [i]: !c[i] }))}
                    style={{ width:22, height:22, borderRadius:2, border:`2px solid ${checked[i] ? C.acc : '#C8C0B8'}`,
                    background: checked[i] ? C.acc : 'transparent', display:'flex', alignItems:'center', justifyContent:'center',
                    flexShrink:0, marginLeft:8, marginTop:2, cursor:'pointer' }}>
                    {checked[i] && <span style={{ color:'#fff', fontSize:14, fontWeight:700 }}>✓</span>}
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
function PhotoRemoval({ stores, onClose, onRemoved, onStockZero }) {
  // Steps: capture → loading → queue (review each) → done
  const [step, setStep] = useState('capture'); // capture | loading | queue | search | done
  const [queue, setQueue] = useState([]); // [{identified, matches, confirmed, selectedId}]
  const [currentIdx, setCurrentIdx] = useState(0);
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);
  const cameraRef = useRef(null);
  const fileRef = useRef(null);
  const multiRef = useRef(null);

  // Process single image → AI identify
  const processImage = async (file) => {
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
    return { identified: data.identified, matches: data.matches || [] };
  };

  // Handle single capture
  const handleSingle = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setStep('loading');
    setProcessedCount(0);
    setTotalProcessed(1);
    try {
      const result = await processImage(file);
      setQueue([{ ...result, confirmed: false, selectedId: null }]);
      setCurrentIdx(0);
      setStep('queue');
    } catch (err) {
      setError(err.message);
      setStep('capture');
    }
  };

  // Handle multiple files
  const handleMulti = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError('');
    setStep('loading');
    setProcessedCount(0);
    setTotalProcessed(files.length);

    const results = [];
    for (let i = 0; i < files.length; i++) {
      setProcessedCount(i + 1);
      try {
        const result = await processImage(files[i]);
        results.push({ ...result, confirmed: false, selectedId: null });
      } catch (err) {
        results.push({ identified: { name: files[i].name, error: err.message }, matches: [], confirmed: false, selectedId: null });
      }
    }
    setQueue(results);
    setCurrentIdx(0);
    setStep('queue');
  };

  const current = queue[currentIdx];

  // Confirm removal for current item
  const confirmRemove = async (item) => {
    if (item.quantity <= 0) return;
    setRemoving(item.id);
    const newQty = item.quantity - 1;
    try {
      await fetch(`/api/beverages/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Math.max(0, newQty) }),
      });
      // Mark as confirmed
      setQueue(prev => prev.map((q, i) => i === currentIdx ? { ...q, confirmed: true, selectedId: item.id, matchQty: newQty } : q));
      onRemoved();
      if (newQty === 0 && onStockZero) onStockZero(item.id, storeId);
      // Auto-advance after brief delay
      setTimeout(() => {
        if (currentIdx < queue.length - 1) setCurrentIdx(currentIdx + 1);
        else setStep('done');
      }, 600);
    } catch (err) { setError(err.message); }
    setRemoving(null);
  };

  // Skip current
  const skipCurrent = () => {
    setQueue(prev => prev.map((q, i) => i === currentIdx ? { ...q, confirmed: false, selectedId: 'skipped' } : q));
    if (currentIdx < queue.length - 1) setCurrentIdx(currentIdx + 1);
    else setStep('done');
  };

  // Manual search
  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    try {
      const resp = await fetch(`/api/beverages?store=${storeId}&q=${encodeURIComponent(searchQuery.trim())}&limit=20`);
      const data = await resp.json();
      setSearchResults(data.items || data || []);
    } catch (err) { setError(err.message); }
    setSearchLoading(false);
  };

  const confirmedCount = queue.filter(q => q.confirmed).length;

  return (
    <BottomSheet open={true} onClose={onClose}>
      {step === 'capture' && (
        <div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:4 }}>写真で出庫</div>
          <div style={{ fontSize:12, color:C.sub, marginBottom:12 }}>ボトルのラベルを撮影 → AIが特定 → 1本ずつ確認</div>

          <div style={{ marginBottom:12 }}>
            <div style={{ fontSize:10, color:C.sub, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>対象店舗</div>
            <select value={storeId} onChange={e => setStoreId(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F }}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleSingle} style={{ display:'none' }} />
          <input ref={fileRef} type="file" accept="image/*" onChange={handleSingle} style={{ display:'none' }} />
          <input ref={multiRef} type="file" accept="image/*" multiple onChange={handleMulti} style={{ display:'none' }} />
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <button onClick={() => cameraRef.current?.click()} style={{
              flex:1, padding:16, borderRadius:2, border:`2px dashed ${C.bd}`, background:'transparent',
              fontSize:12, fontFamily:F, color:C.acc, cursor:'pointer', textAlign:'center',
            }}>📷 撮影</button>
            <button onClick={() => fileRef.current?.click()} style={{
              flex:1, padding:16, borderRadius:2, border:`2px dashed ${C.bd}`, background:'transparent',
              fontSize:12, fontFamily:F, color:C.acc, cursor:'pointer', textAlign:'center',
            }}>📁 写真1枚</button>
            <button onClick={() => multiRef.current?.click()} style={{
              flex:1, padding:16, borderRadius:2, border:`2px dashed ${C.bd}`, background:'transparent',
              fontSize:12, fontFamily:F, color:C.acc, cursor:'pointer', textAlign:'center',
            }}>📁 複数枚</button>
          </div>
          {error && <div style={{ color:C.red, fontSize:12, marginTop:8 }}>{error}</div>}
        </div>
      )}

      {step === 'loading' && (
        <div style={{ textAlign:'center', padding:40 }}>
          <div style={{ fontSize:32, marginBottom:12 }}>🍷</div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:8 }}>ラベル解析中...</div>
          <div style={{ fontSize:13, color:C.sub }}>
            {totalProcessed > 1 ? `${processedCount} / ${totalProcessed} 枚を処理中` : 'ワインを特定しています'}
          </div>
        </div>
      )}

      {step === 'queue' && current && (
        <div>
          {/* Progress bar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <div style={{ fontSize:14, fontWeight:500, fontFamily:SR, color:C.tx }}>
              出庫確認 {currentIdx + 1} / {queue.length}
            </div>
            <div style={{ fontSize:11, color:C.sub }}>{confirmedCount}本 出庫済</div>
          </div>
          {queue.length > 1 && (
            <div style={{ height:3, background:C.bd, borderRadius:2, marginBottom:12 }}>
              <div style={{ height:3, background:C.acc, borderRadius:2, width:`${((currentIdx + 1) / queue.length) * 100}%`, transition:'width 0.3s' }} />
            </div>
          )}

          {/* AI identification result */}
          {current.identified && (
            <div style={{ padding:10, background:'#F5F3EE', borderRadius:2, marginBottom:10, border:`1px solid ${C.bd}` }}>
              <div style={{ fontSize:10, color:C.sub, marginBottom:2 }}>AI識別結果</div>
              <div style={{ fontSize:14, fontWeight:600, fontFamily:EL, color:C.tx }}>{current.identified.name}</div>
              {current.identified.name_ja && <div style={{ fontSize:11, color:C.sub }}>{current.identified.name_ja}</div>}
              <div style={{ fontSize:10, color:C.sub, marginTop:2 }}>
                {current.identified.vintage || 'NV'} · {current.identified.producer || ''}
              </div>
            </div>
          )}

          {/* Confirmation prompt */}
          {current.confirmed ? (
            <div style={{ textAlign:'center', padding:16, background:'#F0F8F0', borderRadius:2, marginBottom:8, border:'1px solid #C8E0C8' }}>
              <div style={{ fontSize:20, marginBottom:4 }}>✅</div>
              <div style={{ fontSize:13, fontWeight:600, color:'#3A6A3A' }}>出庫しました</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize:12, fontWeight:500, color:C.tx, marginBottom:6 }}>
                このワインを出庫しますか？
              </div>

              {current.matches.length === 0 ? (
                <div style={{ textAlign:'center', padding:16, color:C.sub, fontSize:12, background:'#FFF8F0', borderRadius:2, border:'1px solid #E8D8C0', marginBottom:8 }}>
                  在庫マッチが見つかりません。手動検索で探してください。
                </div>
              ) : (
                <div style={{ maxHeight:'30vh', overflowY:'auto', marginBottom:8 }}>
                  {current.matches.map(item => (
                    <div key={item.id} style={{
                      padding:'8px 10px', marginBottom:3, background:C.card,
                      border:`1px solid ${C.bd}`, borderRadius:2,
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                    }}>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, fontWeight:600, fontFamily:EL, color:C.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {item.name}
                        </div>
                        {item.name_kana && item.name_kana !== item.name && (
                          <div style={{ fontSize:10, color:'#B0AA9C', marginTop:1 }}>{item.name_kana}</div>
                        )}
                        <div style={{ fontSize:10, color:C.sub, marginTop:1 }}>
                          {item.vintage || 'NV'} · {item.producer || ''} · 在庫:{item.quantity}
                        </div>
                      </div>
                      <button onClick={() => confirmRemove(item)} disabled={item.quantity <= 0 || removing === item.id}
                        style={{
                          padding:'6px 12px', borderRadius:2, border:'none',
                          background: item.quantity > 0 ? C.wine : C.bd, color:'#fff',
                          fontSize:12, fontFamily:F, fontWeight:600, cursor: item.quantity > 0 ? 'pointer' : 'default',
                          opacity: removing === item.id ? 0.5 : 1, flexShrink:0, marginLeft:6,
                        }}>{removing === item.id ? '...' : '出庫'}</button>
                    </div>
                  ))}
                </div>
              )}

              {/* Manual search fallback */}
              <div style={{ padding:8, background:'#FAFAF8', borderRadius:2, border:`1px solid ${C.bd}`, marginBottom:8 }}>
                <div style={{ fontSize:10, color:C.sub, marginBottom:4 }}>手動検索（見つからない場合）</div>
                <div style={{ display:'flex', gap:6 }}>
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && doSearch()}
                    placeholder="ワイン名で検索..."
                    style={{ flex:1, padding:'6px 8px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:12, fontFamily:F }} />
                  <button onClick={doSearch} disabled={searchLoading}
                    style={{ padding:'6px 12px', borderRadius:2, border:'none', background:C.acc, color:'#fff', fontSize:12, fontFamily:F, cursor:'pointer' }}>
                    {searchLoading ? '...' : '検索'}
                  </button>
                </div>
                {searchResults.length > 0 && (
                  <div style={{ maxHeight:'20vh', overflowY:'auto', marginTop:6 }}>
                    {searchResults.map(item => (
                      <div key={item.id} style={{
                        padding:'6px 8px', marginBottom:2, background:C.card, border:`1px solid ${C.bd}`, borderRadius:2,
                        display:'flex', justifyContent:'space-between', alignItems:'center', cursor:'pointer',
                      }}>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize:12, fontWeight:500, color:C.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {item.name}
                          </div>
                          {item.name_kana && item.name_kana !== item.name && (
                            <div style={{ fontSize:9, color:'#B0AA9C' }}>{item.name_kana}</div>
                          )}
                          <div style={{ fontSize:9, color:C.sub }}>{item.vintage || 'NV'} · {item.producer || ''} · 在庫:{item.quantity}</div>
                        </div>
                        <button onClick={() => confirmRemove(item)} disabled={item.quantity <= 0}
                          style={{
                            padding:'4px 10px', borderRadius:2, border:'none',
                            background: item.quantity > 0 ? C.wine : C.bd, color:'#fff',
                            fontSize:11, fontFamily:F, fontWeight:600, flexShrink:0, marginLeft:4,
                          }}>出庫</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {error && <div style={{ color:C.red, fontSize:11, marginBottom:6 }}>{error}</div>}

          <div style={{ display:'flex', gap:8 }}>
            {!current.confirmed && (
              <button onClick={skipCurrent} style={{ flex:1, padding:10, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:13, fontFamily:F, cursor:'pointer', color:C.sub }}>
                スキップ
              </button>
            )}
            {currentIdx < queue.length - 1 && current.confirmed && (
              <button onClick={() => setCurrentIdx(currentIdx + 1)} style={{
                flex:1, padding:10, borderRadius:2, border:'none', background:C.acc, color:'#fff', fontSize:13, fontFamily:F, fontWeight:600, cursor:'pointer',
              }}>次へ →</button>
            )}
            {(currentIdx === queue.length - 1 && current.confirmed) && (
              <button onClick={() => setStep('done')} style={{
                flex:1, padding:10, borderRadius:2, border:'none', background:C.acc, color:'#fff', fontSize:13, fontFamily:F, fontWeight:600, cursor:'pointer',
              }}>完了</button>
            )}
          </div>
        </div>
      )}

      {step === 'done' && (
        <div style={{ textAlign:'center', padding:20 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:8 }}>出庫完了</div>
          <div style={{ fontSize:14, color:C.green, fontWeight:600, marginBottom:4 }}>
            {queue.filter(q => q.confirmed).length}本 出庫しました
          </div>
          {queue.filter(q => q.selectedId === 'skipped').length > 0 && (
            <div style={{ fontSize:12, color:C.sub }}>{queue.filter(q => q.selectedId === 'skipped').length}件 スキップ</div>
          )}
          <div style={{ display:'flex', gap:10, marginTop:16 }}>
            <button onClick={() => { setStep('capture'); setQueue([]); setCurrentIdx(0); setError(''); setSearchQuery(''); setSearchResults([]); }}
              style={{ flex:1, padding:12, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.tx }}>続けて出庫</button>
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

// ===== WineListReconcile — 在庫と連動 =====
function WineListReconcile({ storeId, stores, onBack, onDone }) {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);
  const [unmatched, setUnmatched] = useState([]);
  const [summary, setSummary] = useState(null);
  const [step, setStep] = useState('review'); // review | confirm | done
  const [toast, setToast] = useState('');
  const [processing, setProcessing] = useState(false);
  const [excluded, setExcluded] = useState(new Set()); // match indices to exclude
  const [priceOverrides, setPriceOverrides] = useState({}); // { matchIdx: price }

  const store = stores.find(s => s.id === storeId);
  const storeName = store?.name || storeId;

  // Run reconciliation
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/wine-list-reconcile', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ store_id: storeId }),
        });
        const d = await r.json();
        setMatches(d.matches || []);
        setUnmatched(d.unmatched || []);
        setSummary(d);
      } catch (e) {
        setToast('照合エラー: ' + e.message);
      }
      setLoading(false);
    })();
  }, [storeId]);

  const toggleExclude = (idx) => {
    setExcluded(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx); else next.add(idx);
      return next;
    });
  };

  // Create wine list entries from matches
  const doReconcile = async () => {
    setProcessing(true);
    try {
      const items = matches
        .filter((_, i) => !excluded.has(i))
        .filter(m => !m.alreadyLinked)
        .map((m, i) => ({
          store_id: storeId,
          beverage_id: m.beverage.id,
          sell_price: priceOverrides[i] !== undefined
            ? (priceOverrides[i] ? Number(priceOverrides[i]) : null)
            : (m.wlItem.sell_price_incl || m.wlItem.sell_price || m.beverage.price || null),
        }));

      if (items.length === 0) {
        setToast('連動するアイテムがありません');
        setProcessing(false);
        return;
      }

      const r = await fetch('/api/wine-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items }),
      });

      if (r.ok) {
        const d = await r.json();
        setStep('done');
        setToast(`${d.added}件をワインリストに連動しました`);
      } else {
        const err = await r.json();
        setToast('エラー: ' + (err.error || 'unknown'));
      }
    } catch (e) {
      setToast('エラー: ' + e.message);
    }
    setProcessing(false);
  };

  const confBadge = (conf) => {
    const colors = { high: '#4A6352', medium: '#B8860B', low: '#C25050' };
    const labels = { high: '高', medium: '中', low: '低' };
    return (
      <span style={{
        display: 'inline-block', padding: '2px 8px', borderRadius: 10,
        fontSize: 9, fontWeight: 600, color: '#fff', background: colors[conf] || '#999',
      }}>{labels[conf] || conf}</span>
    );
  };

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: C.sub, fontFamily: F }}>
        <div style={{ animation: 'spin 1s linear infinite', width: 20, height: 20, border: `2px solid ${C.bd}`, borderTop: `2px solid ${C.acc}`, borderRadius: '50%', margin: '0 auto 12px' }} />
        在庫データと照合中...
      </div>
    );
  }

  // Done step
  if (step === 'done') {
    return (
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F }}>
        <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${C.bd}` }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><IcoBack /></button>
          <div style={{ fontSize: 15, fontWeight: 500, fontFamily: SR, color: C.tx }}>連動完了</div>
        </div>
        <div style={{ padding: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 600, color: C.tx, marginBottom: 8 }}>在庫との連動が完了しました</div>
          <div style={{ fontSize: 13, color: C.sub, marginBottom: 24 }}>
            ワインリストが在庫と紐付けされました。<br />
            今後はアプリ内でリストの追加・削除ができます。
          </div>
          <button onClick={() => { if (onDone) onDone(); onBack(); }} style={{
            padding: '12px 32px', borderRadius: 2, border: 'none', background: C.acc,
            color: '#fff', fontSize: 14, fontFamily: F, fontWeight: 600, cursor: 'pointer',
          }}>ワインリストを表示</button>
        </div>
      </div>
    );
  }

  const activeMatches = matches.filter((_, i) => !excluded.has(i));
  const newLinks = activeMatches.filter(m => !m.alreadyLinked);

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: F }}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
          background: '#2A2520', color: '#fff', padding: '8px 20px', borderRadius: 4, fontSize: 12, fontFamily: F }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: C.bg, borderBottom: `1px solid ${C.bd}`, padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><IcoBack /></button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500, fontFamily: SR, color: C.tx }}>
              {storeName} 在庫連動
            </div>
            <div style={{ fontSize: 11, color: C.sub }}>ワインリスト → 在庫マッチング</div>
          </div>
        </div>
      </div>

      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderBottom: `1px solid ${C.bd}`, background: C.card }}>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: C.sub }}>リスト</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.tx }}>{summary?.total || 0}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: C.sub }}>マッチ</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#4A6352' }}>{matches.length}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: C.sub }}>未マッチ</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#C25050' }}>{unmatched.length}</div>
        </div>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <div style={{ fontSize: 9, color: C.sub }}>連動済</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.sub }}>{matches.filter(m => m.alreadyLinked).length}</div>
        </div>
      </div>

      {/* Confidence breakdown */}
      {summary && (
        <div style={{ padding: '8px 16px', fontSize: 11, color: C.sub, borderBottom: `1px solid ${C.bd}`, display: 'flex', gap: 12 }}>
          <span>高信頼: {summary.highConfidence}</span>
          <span>中信頼: {summary.mediumConfidence}</span>
          <span>低信頼: {summary.lowConfidence}</span>
        </div>
      )}

      <div style={{ padding: '12px 16px 140px' }}>
        {/* Matched items */}
        {matches.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.tx, marginBottom: 8 }}>
              マッチしたアイテム ({matches.length})
            </div>
            {matches.map((m, i) => {
              const isExcluded = excluded.has(i);
              return (
                <div key={i} style={{
                  padding: '10px 14px', marginBottom: 4, borderRadius: 2,
                  border: `1px solid ${isExcluded ? '#ddd' : m.alreadyLinked ? '#E0DBCF' : m.confidence === 'high' ? '#cde6d5' : m.confidence === 'medium' ? '#e6dfc0' : '#e6cfc0'}`,
                  background: isExcluded ? '#f5f5f5' : C.card,
                  opacity: isExcluded ? 0.5 : 1,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.tx, marginBottom: 2 }}>
                        {m.wlItem.name_en}
                        {m.wlItem.vintage && <span style={{ color: C.sub, fontWeight: 400 }}> {m.wlItem.vintage}</span>}
                      </div>
                      {m.wlItem.name_jp && (
                        <div style={{ fontSize: 10, color: C.sub }}>{m.wlItem.name_jp}</div>
                      )}
                      <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>
                        {m.wlItem.section_en || m.wlItem.section}
                        {m.wlItem.sell_price_incl && ` · ¥${m.wlItem.sell_price_incl.toLocaleString()}`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {confBadge(m.confidence)}
                      {m.alreadyLinked && (
                        <span style={{ fontSize: 9, color: C.sub, padding: '2px 6px', borderRadius: 10, border: `1px solid ${C.bd}` }}>連動済</span>
                      )}
                    </div>
                  </div>

                  {/* Matched beverage */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <span style={{ fontSize: 10, color: '#4A6352' }}>→</span>
                    <div style={{ flex: 1, fontSize: 11, color: '#4A6352' }}>
                      <strong>{m.beverage.name}</strong>
                      {m.beverage.vintage && ` ${m.beverage.vintage}`}
                      <span style={{ color: C.sub }}> ({stores.find(s => s.id === m.beverage.store_id)?.name || m.beverage.store_id})</span>
                      {m.beverage.quantity !== undefined && (
                        <span style={{ color: C.sub }}> · 残{m.beverage.quantity}本</span>
                      )}
                    </div>
                    {!m.alreadyLinked && (
                      <button onClick={() => toggleExclude(i)} style={{
                        padding: '3px 8px', borderRadius: 2, border: `1px solid ${C.bd}`,
                        background: 'transparent', fontSize: 9, color: isExcluded ? '#4A6352' : '#C25050',
                        cursor: 'pointer', fontFamily: F, whiteSpace: 'nowrap',
                      }}>
                        {isExcluded ? '戻す' : '除外'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Unmatched items */}
        {unmatched.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#C25050', marginBottom: 8 }}>
              未マッチ ({unmatched.length})
            </div>
            <div style={{ fontSize: 11, color: C.sub, marginBottom: 8 }}>
              在庫に該当するアイテムが見つかりませんでした。連動後に手動で追加できます。
            </div>
            {unmatched.map((item, i) => (
              <div key={i} style={{
                padding: '8px 14px', marginBottom: 3, borderRadius: 2,
                border: `1px solid ${C.bd}`, background: '#faf8f4',
              }}>
                <div style={{ fontSize: 12, color: C.tx }}>
                  {item.name_en}
                  {item.vintage && <span style={{ color: C.sub }}> {item.vintage}</span>}
                </div>
                {item.name_jp && (
                  <div style={{ fontSize: 10, color: C.sub }}>{item.name_jp}</div>
                )}
                <div style={{ fontSize: 10, color: '#999' }}>
                  {item.section_en || item.section}
                  {item.sell_price_incl && ` · ¥${item.sell_price_incl.toLocaleString()}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bottom action bar */}
      {newLinks.length > 0 && (
        <div style={{
          position: 'fixed', bottom: 60, left: 0, right: 0, zIndex: 20,
          padding: '12px 16px', background: C.bg, borderTop: `1px solid ${C.bd}`,
          display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center',
          maxWidth: 430, margin: '0 auto',
        }}>
          <div style={{ fontSize: 12, color: C.tx }}>
            <strong>{newLinks.length}</strong>件を連動
          </div>
          <button onClick={doReconcile} disabled={processing} style={{
            padding: '12px 32px', borderRadius: 2, border: 'none',
            background: processing ? C.bd : C.acc, color: '#fff',
            fontSize: 14, fontFamily: F, fontWeight: 600, cursor: processing ? 'default' : 'pointer',
          }}>
            {processing ? '処理中...' : '在庫と連動する'}
          </button>
        </div>
      )}
    </div>
  );
}

// ===== WineListPrint =====
function WineListPrint({ storeId, stores, onBack, onReconcile }) {
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allStoreData, setAllStoreData] = useState({});
  const [selectedStore, setSelectedStore] = useState(storeId || null);
  const [printMode, setPrintMode] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // { id, field, value }
  const [toast, setToast] = useState('');
  const [dragItem, setDragItem] = useState(null); // { sectionIdx, itemIdx }

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  // Fetch wine list items for all stores or specific store
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (storeId) {
        const r = await fetch(`/api/wine-list-items?store=${storeId}`);
        const d = await r.json();
        setSections(d.sections || []);
        setAllStoreData({ [storeId]: d.sections || [] });
      } else {
        const storeIds = stores.map(s => s.id);
        const results = {};
        await Promise.all(storeIds.map(async (sid) => {
          try {
            const r = await fetch(`/api/wine-list-items?store=${sid}`);
            const d = await r.json();
            if (d.sections && d.sections.length > 0) results[sid] = d.sections;
          } catch(e) {}
        }));
        setAllStoreData(results);
        const first = Object.keys(results)[0];
        if (first && !selectedStore) setSelectedStore(first);
        if (selectedStore && results[selectedStore]) {
          setSections(results[selectedStore]);
        } else if (first) {
          setSections(results[first] || []);
        }
      }
    } catch(e) { setSections([]); }
    setLoading(false);
  }, [storeId, stores]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (selectedStore && allStoreData[selectedStore]) {
      setSections(allStoreData[selectedStore]);
    }
  }, [selectedStore, allStoreData]);

  const store = stores.find(s => s.id === selectedStore);
  const storeName = store?.name || selectedStore || '';
  const storeNameEn = store?.name_en || '';
  const availableStores = Object.keys(allStoreData);

  const [addingToSection, setAddingToSection] = useState(null); // section index for add form
  const [newItem, setNewItem] = useState({ name_en:'', name_jp:'', producer_en:'', vintage:'', sell_price_incl:'', glass_price:'' });

  // ---- Edit handlers ----
  const startEdit = (item, field) => {
    if (!editMode) return;
    setEditingItem({ id: item.id, field, value: item[field] ?? '' });
  };

  const saveEdit = async () => {
    if (!editingItem) return;
    const { id, field, value } = editingItem;
    try {
      const updates = {};
      if (field === 'sell_price_incl' || field === 'glass_price') {
        updates[field] = value === '' ? null : parseInt(value, 10);
      } else {
        updates[field] = value || null;
      }
      const r = await fetch('/api/wine-list-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates }),
      });
      if (r.ok) {
        setSections(prev => prev.map(sec => ({
          ...sec,
          items: sec.items.map(it => it.id === id ? { ...it, ...updates } : it),
        })));
        showToast('保存しました');
      }
    } catch(e) { showToast('エラー'); }
    setEditingItem(null);
  };

  const deleteItem = async (itemId) => {
    try {
      const r = await fetch(`/api/wine-list-items?id=${itemId}`, { method: 'DELETE' });
      if (r.ok) {
        setSections(prev => prev.map(sec => ({
          ...sec,
          items: sec.items.filter(it => it.id !== itemId),
        })).filter(sec => sec.items.length > 0));
        showToast('削除しました');
      }
    } catch(e) { showToast('エラー'); }
  };

  const moveItem = async (secIdx, itemIdx, direction) => {
    const sec = sections[secIdx];
    if (!sec) return;
    const newIdx = itemIdx + direction;
    if (newIdx < 0 || newIdx >= sec.items.length) return;

    const newItems = [...sec.items];
    [newItems[itemIdx], newItems[newIdx]] = [newItems[newIdx], newItems[itemIdx]];

    const reorder = newItems.map((it, i) => ({ id: it.id, sort_order: i }));
    const newSections = [...sections];
    newSections[secIdx] = { ...sec, items: newItems.map((it, i) => ({ ...it, sort_order: i })) };
    setSections(newSections);

    try {
      await fetch('/api/wine-list-items', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder }),
      });
    } catch(e) {}
  };

  const addItem = async (secIdx) => {
    if (!newItem.name_en.trim()) { showToast('ワイン名(EN)を入力してください'); return; }
    const sec = sections[secIdx];
    const item = {
      store_id: selectedStore,
      section: sec.section,
      section_en: sec.section_en,
      section_order: sec.section_order,
      name_en: newItem.name_en.trim(),
      name_jp: newItem.name_jp.trim() || null,
      producer_en: newItem.producer_en.trim() || null,
      vintage: newItem.vintage.trim() || null,
      sell_price_incl: newItem.sell_price_incl ? parseInt(newItem.sell_price_incl, 10) : null,
      glass_price: newItem.glass_price ? parseInt(newItem.glass_price, 10) : null,
      sort_order: sec.items.length,
    };
    try {
      const r = await fetch('/api/wine-list-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ store_id: selectedStore, items: [item] }),
      });
      if (r.ok) {
        showToast('追加しました');
        setAddingToSection(null);
        setNewItem({ name_en:'', name_jp:'', producer_en:'', vintage:'', sell_price_incl:'', glass_price:'' });
        // Refresh data to get new IDs
        const fr = await fetch(`/api/wine-list-items?store=${selectedStore}`);
        const fd = await fr.json();
        setSections(fd.sections || []);
        setAllStoreData(prev => ({ ...prev, [selectedStore]: fd.sections || [] }));
      }
    } catch(e) { showToast('エラー'); }
  };

  const handlePrint = () => {
    setPrintMode(true);
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(false), 500);
    }, 100);
  };

  if (loading) {
    return (
      <div style={{ padding:40, textAlign:'center', color:C.sub, fontFamily:F }}>
        <div style={{ animation:'spin 1s linear infinite', width:20, height:20, border:`2px solid ${C.bd}`, borderTop:`2px solid ${C.acc}`, borderRadius:'50%', margin:'0 auto 12px' }} />
        読み込み中...
      </div>
    );
  }

  // Print mode: render clean printable layout
  if (printMode) {
    return (
      <div className="wine-list-print" style={{ fontFamily:"'Cormorant Garamond','DM Sans',serif", maxWidth:700, margin:'0 auto', padding:'40px 32px', background:'#fff' }}>
        <style>{`
          @media print {
            body { margin:0; padding:0; }
            .wine-list-print { max-width:100% !important; padding:0 !important; }
            .no-print { display:none !important; }
            .print-section { page-break-inside:avoid; }
            .print-section-break { page-break-before:always; }
            @page { margin: 18mm 14mm; size: A4; }
          }
        `}</style>
        {/* Cover */}
        <div style={{ textAlign:'center', pageBreakAfter:'always', display:'flex', flexDirection:'column', justifyContent:'center', minHeight:'80vh' }}>
          <div style={{ fontSize:11, letterSpacing:6, color:'#B0A89A', fontFamily:"'DM Sans',sans-serif", marginBottom:16, textTransform:'uppercase' }}>Wine List</div>
          <div style={{ width:50, height:1, background:'#D4AF37', margin:'0 auto 28px' }} />
          <div style={{ fontSize:36, fontWeight:300, letterSpacing:8, color:'#2A2520', fontFamily:"'Cormorant Garamond',serif" }}>
            {storeName}
          </div>
          {storeNameEn && (
            <div style={{ fontSize:15, fontWeight:300, letterSpacing:4, color:'#A09A8C', marginTop:10, fontFamily:"'Cormorant Garamond',serif" }}>
              {storeNameEn}
            </div>
          )}
          <div style={{ width:50, height:1, background:'#D4AF37', margin:'28px auto 0' }} />
          <div style={{ fontSize:10, color:'#C0B8A8', marginTop:24, fontFamily:"'DM Sans',sans-serif", letterSpacing:2 }}>
            PRICE INCLUDES TAX
          </div>
        </div>

        {/* Sections */}
        {sections.map((sec, si) => {
          // Large sections break before; small sections avoid break inside
          const isLarge = sec.items.length > 12;
          return (
            <div key={si} className={isLarge ? 'print-section-break' : 'print-section'}
              style={{ marginBottom:32, ...(isLarge ? { pageBreakBefore:'always' } : { pageBreakInside:'avoid' }) }}>
              {/* Section Header */}
              <div style={{ textAlign:'center', marginBottom:18, paddingTop: isLarge ? 8 : 0 }}>
                <div style={{ fontSize:18, fontWeight:400, letterSpacing:5, color:'#2A2520', fontFamily:"'Cormorant Garamond',serif", textTransform:'uppercase' }}>
                  {sec.section_en || sec.section}
                </div>
                <div style={{ fontSize:10.5, color:'#A09A8C', letterSpacing:2, marginTop:4, fontFamily:"'Shippori Mincho',serif" }}>
                  {sec.section}
                </div>
                <div style={{ width:24, height:1, background:'#D4AF37', margin:'8px auto 0' }} />
              </div>

              {/* Items */}
              {sec.items.map((item, ii) => (
                <div key={ii} style={{ marginBottom:8, paddingBottom:7, borderBottom:'1px solid #F0EDE8' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                    <div style={{ flex:1, marginRight:12 }}>
                      <span style={{ fontSize:13, fontWeight:400, color:'#2A2520', fontFamily:"'Cormorant Garamond',serif", letterSpacing:0.5 }}>
                        {item.vintage && <span style={{ color:'#A09A8C', marginRight:6, fontSize:12 }}>{item.vintage}</span>}
                        {item.name_en}
                      </span>
                      {item.producer_en && (
                        <span style={{ fontSize:11, color:'#B0A89A', fontFamily:"'Cormorant Garamond',serif", marginLeft:6 }}>
                          / {item.producer_en}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign:'right', whiteSpace:'nowrap' }}>
                      <div style={{ fontSize:13, fontWeight:400, color:'#2A2520', fontFamily:"'DM Sans',sans-serif" }}>
                        {item.sell_price_incl ? `¥${item.sell_price_incl.toLocaleString()}` : ''}
                      </div>
                      {item.glass_price && (
                        <div style={{ fontSize:10, color:'#B0A89A', fontFamily:"'DM Sans',sans-serif", marginTop:1 }}>
                          Glass ¥{item.glass_price.toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  {item.name_jp && (
                    <div style={{ fontSize:9.5, color:'#A09A8C', fontFamily:"'Shippori Mincho',serif", marginTop:2, letterSpacing:0.5 }}>
                      {item.name_jp}
                      {item.producer_jp && ` / ${item.producer_jp}`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    );
  }

  // Normal mode: preview with controls
  return (
    <div style={{ minHeight:'100vh', background:C.bg, fontFamily:F }}>
      {/* Toast */}
      {toast && (
        <div style={{ position:'fixed', top:16, left:'50%', transform:'translateX(-50%)', zIndex:100,
          background:'#2A2520', color:'#fff', padding:'8px 20px', borderRadius:4, fontSize:12, fontFamily:F, boxShadow:'0 2px 12px rgba(0,0,0,0.15)' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="no-print" style={{ position:'sticky', top:0, zIndex:10, background:C.bg, borderBottom:`1px solid ${C.bd}`, padding:'12px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><IcoBack /></button>
            <div>
              <div style={{ fontSize:15, fontWeight:400, letterSpacing:1, color:C.tx, fontFamily:EL }}>Wine List</div>
              <div style={{ fontSize:10, color:C.sub }}>ワインリスト印刷・編集</div>
            </div>
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <button onClick={() => setEditMode(!editMode)} style={{
              padding:'8px 14px', borderRadius:2, border:`1px solid ${editMode ? '#C25050' : C.bd}`,
              background: editMode ? '#C25050' : 'transparent', color: editMode ? '#fff' : C.tx,
              fontSize:11, fontFamily:F, cursor:'pointer', fontWeight:500,
            }}>
              {editMode ? '編集終了' : '編集'}
            </button>
            <button onClick={handlePrint} style={{
              padding:'8px 16px', borderRadius:2, border:'none',
              background:C.tx, color:'#fff', fontSize:11, fontFamily:F,
              cursor:'pointer', fontWeight:500, letterSpacing:1,
            }}>
              印刷
            </button>
          </div>
        </div>

        {/* Reconcile button */}
        {selectedStore && sections.length > 0 && onReconcile && (
          <button onClick={() => onReconcile(selectedStore)} style={{
            width: '100%', marginTop: 8, padding: '10px 16px', borderRadius: 2,
            border: `1px solid ${C.acc}`, background: 'transparent',
            color: C.acc, fontSize: 12, fontFamily: F, fontWeight: 600, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            🔗 在庫と連動する
          </button>
        )}

        {/* Store selector */}
        {availableStores.length > 1 && (
          <div style={{ display:'flex', gap:6, marginTop:10, overflowX:'auto', paddingBottom:4 }}>
            {availableStores.map(sid => {
              const s = stores.find(st => st.id === sid);
              const active = sid === selectedStore;
              return (
                <button key={sid} onClick={() => setSelectedStore(sid)} style={{
                  padding:'6px 14px', borderRadius:20, border:`1px solid ${active ? C.acc : C.bd}`,
                  background: active ? C.acc : 'transparent', color: active ? '#fff' : C.sub,
                  fontSize:11, fontFamily:F, cursor:'pointer', whiteSpace:'nowrap', fontWeight: active ? 600 : 400,
                }}>
                  {s?.name || sid}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview */}
      <div style={{ padding:'16px', maxWidth:700, margin:'0 auto', paddingBottom:80 }}>
        {sections.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:C.sub }}>
            <div style={{ fontSize:13, marginBottom:8 }}>このストアのワインリストデータがありません</div>
            <div style={{ fontSize:11 }}>scripts/import-wine-list.js でインポートしてください</div>
          </div>
        ) : (
          <>
            {/* Store title */}
            <div style={{ textAlign:'center', marginBottom:32, paddingTop:8 }}>
              <div style={{ fontSize:11, letterSpacing:5, color:C.sub, fontFamily:F, marginBottom:8 }}>WINE LIST</div>
              <div style={{ width:30, height:1, background:C.gold, margin:'0 auto 16px' }} />
              <div style={{ fontSize:26, fontWeight:300, letterSpacing:4, color:C.tx, fontFamily:EL }}>
                {storeName}
              </div>
              {storeNameEn && (
                <div style={{ fontSize:12, fontWeight:300, letterSpacing:2, color:C.sub, marginTop:4, fontFamily:EL }}>
                  {storeNameEn}
                </div>
              )}
              <div style={{ fontSize:10, color:'#C0B8A8', marginTop:16, fontFamily:F }}>
                {sections.reduce((acc, s) => acc + s.items.length, 0)} items · Price includes tax
              </div>
            </div>

            {/* Sections */}
            {sections.map((sec, si) => (
              <div key={si} style={{ marginBottom:28 }}>
                {/* Section Header */}
                <div style={{ textAlign:'center', marginBottom:14 }}>
                  <div style={{ fontSize:16, fontWeight:400, letterSpacing:3, color:C.tx, fontFamily:EL }}>
                    {sec.section_en || sec.section}
                  </div>
                  <div style={{ fontSize:10, color:C.sub, letterSpacing:1.5, marginTop:3, fontFamily:SR }}>
                    {sec.section} · {sec.items.length}
                  </div>
                  <div style={{ width:20, height:1, background:C.gold, margin:'6px auto 0' }} />
                </div>

                {/* Items */}
                {sec.items.map((item, ii) => {
                  const isEditing = editingItem?.id === item.id;
                  const ef = editingItem?.field;
                  const editInput = (field, placeholder, style2) => (
                    isEditing && ef === field ? (
                      <input autoFocus value={editingItem.value}
                        onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                        onBlur={saveEdit}
                        onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingItem(null); }}
                        style={{ border:`1px solid ${C.acc}`, borderRadius:2, padding:'2px 6px', background:'#FFFCF5', outline:'none', ...style2 }}
                      />
                    ) : null
                  );
                  return (
                  <div key={item.id || ii} style={{
                    marginBottom:editMode ? 2 : 6, paddingBottom:editMode ? 6 : 6,
                    padding: editMode ? '6px 8px' : 0,
                    borderBottom:`1px solid ${C.bd}`,
                    background: editMode ? '#fff' : 'transparent',
                    borderRadius: editMode ? 4 : 0,
                    ...(editMode ? { border:`1px solid ${C.bd}`, marginBottom:4 } : {}),
                  }}>
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
                      <div style={{ flex:1, marginRight:8 }}>
                        {/* Vintage - editable */}
                        {editInput('vintage', 'NV', { fontSize:12, fontFamily:F, color:C.sub, width:50 }) || (
                          item.vintage && <span onClick={() => startEdit(item, 'vintage')}
                            style={{ color:C.sub, marginRight:5, fontSize:12, cursor: editMode ? 'pointer' : 'default' }}>{item.vintage}</span>
                        )}
                        {/* Wine name - editable */}
                        {editInput('name_en', 'Wine name', { fontSize:13, fontFamily:EL, color:C.tx, width:'70%' }) || (
                          <span onClick={() => startEdit(item, 'name_en')}
                            style={{ fontSize:13, fontWeight:400, color:C.tx, fontFamily:EL, letterSpacing:0.3, cursor: editMode ? 'pointer' : 'default' }}>
                            {item.name_en}
                          </span>
                        )}
                        {/* Producer - editable */}
                        {!isEditing && item.producer_en && (
                          <span onClick={() => startEdit(item, 'producer_en')}
                            style={{ fontSize:10.5, color:'#B0A89A', fontFamily:EL, marginLeft:5, cursor: editMode ? 'pointer' : 'default' }}>
                            / {item.producer_en}
                          </span>
                        )}
                        {editInput('producer_en', 'Producer', { fontSize:11, fontFamily:EL, color:'#B0A89A', width:'60%', marginTop:2 })}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        {/* Price - editable */}
                        {editInput('sell_price_incl', '0', { fontSize:12, fontFamily:F, color:C.tx, width:80, textAlign:'right' }) || (
                          <div onClick={() => startEdit(item, 'sell_price_incl')}
                            style={{ fontSize:12, fontWeight:500, color:C.tx, fontFamily:F, whiteSpace:'nowrap', cursor: editMode ? 'pointer' : 'default', textAlign:'right',
                              ...(editMode ? { padding:'2px 6px', borderRadius:2, background:'#F9F7F3', border:`1px solid ${C.bd}` } : {}) }}>
                            {item.sell_price_incl ? `¥${item.sell_price_incl.toLocaleString()}` : editMode ? '¥---' : ''}
                          </div>
                        )}
                        {/* Edit controls */}
                        {editMode && (
                          <div style={{ display:'flex', gap:2, marginLeft:4 }}>
                            <button onClick={() => moveItem(si, ii, -1)} disabled={ii === 0}
                              style={{ width:22, height:22, border:'none', background:'none', cursor: ii === 0 ? 'default' : 'pointer', fontSize:11, color: ii === 0 ? C.bd : C.sub, padding:0 }}>▲</button>
                            <button onClick={() => moveItem(si, ii, 1)} disabled={ii === sec.items.length - 1}
                              style={{ width:22, height:22, border:'none', background:'none', cursor: ii === sec.items.length - 1 ? 'default' : 'pointer', fontSize:11, color: ii === sec.items.length - 1 ? C.bd : C.sub, padding:0 }}>▼</button>
                            <button onClick={() => { if (confirm(`「${item.name_en}」を削除しますか？`)) deleteItem(item.id); }}
                              style={{ width:22, height:22, border:'none', background:'none', cursor:'pointer', fontSize:13, color:'#C25050', padding:0 }}>×</button>
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Second row: JP name + glass price */}
                    {!isEditing && (
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginTop:1.5 }}>
                        <div style={{ flex:1 }}>
                          {item.name_jp && (
                            <span onClick={() => startEdit(item, 'name_jp')}
                              style={{ fontSize:10, color:C.sub, fontFamily:SR, letterSpacing:0.3, cursor: editMode ? 'pointer' : 'default' }}>
                              {item.name_jp}{item.producer_jp && ` / ${item.producer_jp}`}
                            </span>
                          )}
                          {editMode && !item.name_jp && (
                            <span onClick={() => startEdit(item, 'name_jp')}
                              style={{ fontSize:10, color:C.bd, fontFamily:SR, cursor:'pointer' }}>+ 日本語名</span>
                          )}
                        </div>
                        {item.glass_price && (
                          <span onClick={() => startEdit(item, 'glass_price')}
                            style={{ fontSize:10, color:'#B0A89A', fontFamily:F, cursor: editMode ? 'pointer' : 'default',
                              ...(editMode ? { padding:'1px 4px', borderRadius:2, background:'#F9F7F3', border:`1px solid ${C.bd}` } : {}) }}>
                            Glass ¥{item.glass_price.toLocaleString()}
                          </span>
                        )}
                        {editMode && !item.glass_price && (
                          <span onClick={() => startEdit(item, 'glass_price')}
                            style={{ fontSize:10, color:C.bd, fontFamily:F, cursor:'pointer', padding:'1px 4px' }}>+ Glass</span>
                        )}
                      </div>
                    )}
                    {/* Inline edit for JP name */}
                    {editInput('name_jp', '日本語名', { fontSize:10, fontFamily:SR, color:C.sub, width:'100%', marginTop:2 })}
                    {editInput('glass_price', '0', { fontSize:11, fontFamily:F, color:C.tx, width:70, textAlign:'right', marginTop:2 })}
                  </div>
                  );
                })}
                {/* Add item button */}
                {editMode && (
                  addingToSection === si ? (
                    <div style={{ background:'#FFFCF5', border:`1px dashed ${C.acc}`, borderRadius:4, padding:'10px 10px', marginTop:6 }}>
                      <div style={{ fontSize:11, fontWeight:600, color:C.acc, marginBottom:8, fontFamily:F }}>新規アイテム追加</div>
                      <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                        <input placeholder="Vintage" value={newItem.vintage} onChange={e => setNewItem({...newItem, vintage:e.target.value})}
                          style={{ width:55, fontSize:11, fontFamily:F, padding:'4px 6px', border:`1px solid ${C.bd}`, borderRadius:2, outline:'none' }} />
                        <input placeholder="Wine Name (EN) *" value={newItem.name_en} onChange={e => setNewItem({...newItem, name_en:e.target.value})}
                          style={{ flex:1, fontSize:11, fontFamily:EL, padding:'4px 6px', border:`1px solid ${C.bd}`, borderRadius:2, outline:'none' }} />
                      </div>
                      <div style={{ display:'flex', gap:6, marginBottom:6 }}>
                        <input placeholder="Producer (EN)" value={newItem.producer_en} onChange={e => setNewItem({...newItem, producer_en:e.target.value})}
                          style={{ flex:1, fontSize:11, fontFamily:EL, padding:'4px 6px', border:`1px solid ${C.bd}`, borderRadius:2, outline:'none' }} />
                        <input placeholder="日本語名" value={newItem.name_jp} onChange={e => setNewItem({...newItem, name_jp:e.target.value})}
                          style={{ flex:1, fontSize:11, fontFamily:SR, padding:'4px 6px', border:`1px solid ${C.bd}`, borderRadius:2, outline:'none' }} />
                      </div>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        <input placeholder="税込価格" type="number" value={newItem.sell_price_incl} onChange={e => setNewItem({...newItem, sell_price_incl:e.target.value})}
                          style={{ width:90, fontSize:11, fontFamily:F, padding:'4px 6px', border:`1px solid ${C.bd}`, borderRadius:2, outline:'none' }} />
                        <input placeholder="Glass価格" type="number" value={newItem.glass_price} onChange={e => setNewItem({...newItem, glass_price:e.target.value})}
                          style={{ width:90, fontSize:11, fontFamily:F, padding:'4px 6px', border:`1px solid ${C.bd}`, borderRadius:2, outline:'none' }} />
                        <div style={{ flex:1 }} />
                        <button onClick={() => { setAddingToSection(null); setNewItem({ name_en:'', name_jp:'', producer_en:'', vintage:'', sell_price_incl:'', glass_price:'' }); }}
                          style={{ padding:'5px 12px', border:`1px solid ${C.bd}`, background:'transparent', borderRadius:2, fontSize:11, fontFamily:F, cursor:'pointer', color:C.sub }}>
                          取消
                        </button>
                        <button onClick={() => addItem(si)}
                          style={{ padding:'5px 14px', border:'none', background:C.acc, borderRadius:2, fontSize:11, fontFamily:F, cursor:'pointer', color:'#fff', fontWeight:600 }}>
                          追加
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => { setAddingToSection(si); setNewItem({ name_en:'', name_jp:'', producer_en:'', vintage:'', sell_price_incl:'', glass_price:'' }); }}
                      style={{ width:'100%', padding:'8px', border:`1px dashed ${C.bd}`, background:'transparent', borderRadius:4, fontSize:11, fontFamily:F, cursor:'pointer', color:C.sub, marginTop:6, letterSpacing:1 }}>
                      ＋ アイテム追加
                    </button>
                  )
                )}
              </div>
            ))}
          </>
        )}
      </div>

      <style>{`
        @media print {
          body { margin:0 !important; padding:0 !important; }
          .no-print { display:none !important; }
          @page { margin: 15mm 12mm; size: A4; }
        }
      `}</style>
    </div>
  );
}

// ===== WineListManager =====
function WineListManager({ storeId, categoryId, stores, categories, onBack, onRefreshHome, onStockZero }) {
  const [wlItems, setWlItems] = useState([]);
  const [invItems, setInvItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list'); // list | add
  const [searchQ, setSearchQ] = useState('');
  const [adding, setAdding] = useState(null); // beverage being added
  const [addPrice, setAddPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [catFilter, setCatFilter] = useState(null);
  const debRef = useRef(null);

  const store = stores.find(s => s.id === storeId);
  const storeName = store?.name || storeId;

  // Fetch wine list items
  const fetchWineList = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/wine-list?store=${storeId}`;
      if (categoryId) url += `&category=${categoryId}`;
      const r = await fetch(url);
      const data = await r.json();
      setWlItems(data.items || []);
    } catch(e) { setWlItems([]); }
    setLoading(false);
  }, [storeId, categoryId]);

  useEffect(() => { fetchWineList(); }, [fetchWineList]);

  // Search inventory items to add
  const searchInventory = useCallback(async (q) => {
    if (q.length < 2) { setInvItems([]); return; }
    try {
      const r = await fetch(`/api/beverages?q=${encodeURIComponent(q)}&limit=30`);
      const data = await r.json();
      // Exclude items already on this store's list
      const onList = new Set(wlItems.map(wl => wl.beverage_id));
      setInvItems((data.items || []).filter(i => !onList.has(i.id)));
    } catch(e) { setInvItems([]); }
  }, [wlItems]);

  const onSearch = (val) => {
    setSearchQ(val);
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => searchInventory(val), 300);
  };

  // Add to wine list
  const addToList = async () => {
    if (!adding) return;
    setSaving(true);
    try {
      const r = await fetch('/api/wine-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          store_id: storeId,
          beverage_id: adding.id,
          sell_price: addPrice ? Number(addPrice) : (adding.price || null),
        }),
      });
      if (r.ok) {
        setToast(`「${adding.name}」をリストに追加`);
        setAdding(null);
        setAddPrice('');
        setSearchQ('');
        setInvItems([]);
        await fetchWineList();
        if (onRefreshHome) onRefreshHome();
      }
    } catch(e) { setToast('エラーが発生しました'); }
    setSaving(false);
  };

  // Remove from wine list
  const removeFromList = async (wlId, name) => {
    if (!confirm(`「${name}」をリストから外しますか？`)) return;
    try {
      await fetch(`/api/wine-list?id=${wlId}`, { method: 'DELETE' });
      setToast('リストから外しました');
      await fetchWineList();
      if (onRefreshHome) onRefreshHome();
    } catch(e) { setToast('エラーが発生しました'); }
  };

  // Update sell price inline
  const updatePrice = async (wlId, newPrice) => {
    try {
      await fetch('/api/wine-list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: wlId, sell_price: newPrice ? Number(newPrice) : null }),
      });
      await fetchWineList();
    } catch(e) {}
  };

  const storeColor = {};
  stores.forEach(s => { storeColor[s.id] = s.color || '#4A6352'; });

  const catTitle = categoryId ? (categories.find(c => c.id === categoryId)?.name || '') : '';

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${C.bd}` }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><IcoBack /></button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:15, fontWeight:500, fontFamily:SR, color:C.tx }}>
            {storeName} リスト{catTitle ? ` · ${catTitle}` : ''}
          </div>
          <div style={{ fontSize:11, color:C.sub }}>{wlItems.length}種</div>
        </div>
      </div>

      {/* Mode Tabs */}
      <div style={{ display:'flex', borderBottom:`1px solid ${C.bd}` }}>
        <button onClick={() => setMode('list')} style={{
          flex:1, padding:'10px', border:'none', cursor:'pointer', fontSize:13, fontFamily:F,
          background: mode === 'list' ? C.card : 'transparent',
          color: mode === 'list' ? C.acc : C.sub,
          fontWeight: mode === 'list' ? 600 : 400,
          borderBottom: mode === 'list' ? `2px solid ${C.acc}` : '2px solid transparent',
        }}>リスト一覧</button>
        <button onClick={() => setMode('add')} style={{
          flex:1, padding:'10px', border:'none', cursor:'pointer', fontSize:13, fontFamily:F,
          background: mode === 'add' ? C.card : 'transparent',
          color: mode === 'add' ? C.acc : C.sub,
          fontWeight: mode === 'add' ? 600 : 400,
          borderBottom: mode === 'add' ? `2px solid ${C.acc}` : '2px solid transparent',
        }}>+ 在庫から追加</button>
      </div>

      {/* Category filter tags */}
      {mode === 'list' && wlItems.length > 0 && (
        <div style={{ display:'flex', gap:6, overflowX:'auto', padding:'8px 16px', borderBottom:`1px solid ${C.bd}` }}>
          <button onClick={() => setCatFilter(null)} style={{
            padding:'4px 12px', borderRadius:14, border:`1px solid ${!catFilter ? C.acc : C.bd}`,
            background: !catFilter ? C.acc : 'transparent', color: !catFilter ? '#fff' : C.sub,
            fontSize:11, fontFamily:F, cursor:'pointer', whiteSpace:'nowrap',
          }}>All</button>
          {categories.filter(c => !c.parent_id).map(cat => {
            const hasItems = wlItems.some(wl => {
              const cid = wl.beverage?.category_id;
              const parentCat = categories.find(c => c.id === cid);
              return cid === cat.id || parentCat?.parent_id === cat.id;
            });
            if (!hasItems) return null;
            return (
              <button key={cat.id} onClick={() => setCatFilter(cat.id)} style={{
                padding:'4px 12px', borderRadius:14, border:`1px solid ${catFilter === cat.id ? C.acc : C.bd}`,
                background: catFilter === cat.id ? C.acc : 'transparent',
                color: catFilter === cat.id ? '#fff' : C.sub,
                fontSize:11, fontFamily:F, cursor:'pointer', whiteSpace:'nowrap',
              }}>{cat.name_en || cat.name}</button>
            );
          })}
        </div>
      )}

      <div style={{ padding:'12px 16px 100px' }}>
        {mode === 'list' ? (
          /* ===== Wine List View ===== */
          loading ? (
            <div style={{ textAlign:'center', padding:40, color:C.sub, fontSize:13 }}>読み込み中...</div>
          ) : wlItems.length === 0 ? (
            <div style={{ textAlign:'center', padding:40 }}>
              <div style={{ fontSize:13, color:C.sub, marginBottom:12 }}>リストにアイテムがありません</div>
              <button onClick={() => setMode('add')} style={{
                padding:'10px 24px', borderRadius:2, border:'none', background:C.acc,
                color:'#fff', fontSize:13, fontFamily:F, fontWeight:600, cursor:'pointer',
              }}>在庫から追加</button>
            </div>
          ) : (() => {
            const filtered = catFilter
              ? wlItems.filter(wl => {
                  const cid = wl.beverage?.category_id;
                  const parentCat = categories.find(c => c.id === cid);
                  return cid === catFilter || parentCat?.parent_id === catFilter;
                })
              : wlItems;
            const adjustQty = async (bevId, currentQty, delta) => {
              const newQty = Math.max(0, (currentQty || 0) + delta);
              try {
                await fetch(`/api/beverages/${bevId}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ quantity: newQty }),
                });
                await fetchWineList();
                if (newQty === 0 && onStockZero) {
                  onStockZero(bevId, storeId);
                }
              } catch(e) {}
            };
            return filtered.map(wl => {
              const bev = wl.beverage || {};
              return (
                <div key={wl.id} style={{
                  background:C.card, borderRadius:1, padding:'12px 14px 12px 20px',
                  border:`1px solid ${C.bd}`, marginBottom:5, position:'relative',
                }}>
                  <div style={{
                    position:'absolute', left:0, top:4, bottom:4, width:3,
                    background: storeColor[bev.store_id] || C.acc, opacity:0.6, borderRadius:'0 2px 2px 0',
                  }} />
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:14, fontWeight:600, fontFamily:EL, color:C.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                        {bev.name || '-'}
                      </div>
                      <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>
                        {bev.producer || ''}{bev.vintage ? ` · ${bev.vintage}` : ''}
                      </div>
                      <div style={{ display:'flex', gap:8, marginTop:4, alignItems:'center' }}>
                        <div style={{ fontSize:12, color:C.acc, fontWeight:600 }}>
                          売価: {wl.sell_price ? fmt(wl.sell_price) : (bev.price ? fmt(bev.price) : '-')}
                        </div>
                        <div style={{ fontSize:10, color:C.sub }}>
                          仕入: {bev.cost_price ? fmt(bev.cost_price) : (bev.price ? fmt(bev.price) : '-')}
                        </div>
                      </div>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0, marginLeft:8 }}>
                      <div style={{ fontSize:9, color:C.sub }}>残数</div>
                      <div style={{ display:'flex', alignItems:'center', gap:4 }}>
                        <button onClick={() => adjustQty(bev.id, bev.quantity, -1)} style={{
                          width:22, height:22, borderRadius:'50%', border:`1px solid ${C.bd}`,
                          background:C.card, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.tx,
                        }}>−</button>
                        <span style={{ fontSize:14, fontWeight:700, color:C.tx, minWidth:20, textAlign:'center', fontFamily:F }}>{bev.quantity || 0}</span>
                        <button onClick={() => adjustQty(bev.id, bev.quantity, 1)} style={{
                          width:22, height:22, borderRadius:'50%', border:`1px solid ${C.bd}`,
                          background:C.card, fontSize:13, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.tx,
                        }}>+</button>
                      </div>
                      <button onClick={() => removeFromList(wl.id, bev.name)}
                        style={{ padding:'3px 8px', borderRadius:2, border:`1px solid ${C.bd}`,
                          background:'transparent', fontSize:9, color:C.sub, cursor:'pointer', fontFamily:F, marginTop:2 }}>外す</button>
                    </div>
                  </div>
                </div>
              );
            });
          })()
        ) : (
          /* ===== Add from Inventory ===== */
          <>
            <input autoFocus value={searchQ} onChange={e => onSearch(e.target.value)}
              placeholder="在庫からワイン名・生産者で検索..."
              style={{ width:'100%', padding:'10px 14px', border:`1px solid ${C.bd}`, borderRadius:10,
                fontSize:14, fontFamily:F, background:C.card, outline:'none', boxSizing:'border-box', marginBottom:12 }} />

            {/* Adding modal */}
            {adding && (
              <div style={{
                background:'#F5F3EE', border:`1px solid ${C.acc}`, borderRadius:4,
                padding:16, marginBottom:16,
              }}>
                <div style={{ fontSize:13, fontWeight:600, fontFamily:EL, color:C.tx, marginBottom:4 }}>{adding.name}</div>
                <div style={{ fontSize:11, color:C.sub, marginBottom:12 }}>
                  {adding.producer || ''}{adding.vintage ? ` · ${adding.vintage}` : ''}
                  {adding.price ? ` · 仕入: ${fmt(adding.price)}` : ''}
                </div>
                <div style={{ marginBottom:12 }}>
                  <div style={{ fontSize:10, color:C.sub, marginBottom:4, fontFamily:F, textTransform:'uppercase', letterSpacing:0.5 }}>リスト販売価格</div>
                  <input type="number" value={addPrice} onChange={e => setAddPrice(e.target.value)}
                    placeholder={adding.price ? String(Math.round(adding.price * 1.5)) : ''}
                    style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2,
                      fontSize:14, fontFamily:F, boxSizing:'border-box' }} />
                  {adding.price && (
                    <div style={{ fontSize:10, color:C.sub, marginTop:4 }}>
                      参考: 仕入{fmt(adding.price)} → ×1.5 = {fmt(Math.round(adding.price * 1.5))} / ×2.0 = {fmt(Math.round(adding.price * 2))}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button onClick={() => { setAdding(null); setAddPrice(''); }}
                    style={{ flex:1, padding:'10px', borderRadius:2, border:`1px solid ${C.bd}`, background:C.card,
                      fontSize:13, fontFamily:F, cursor:'pointer', color:C.tx }}>キャンセル</button>
                  <button onClick={addToList} disabled={saving}
                    style={{ flex:1, padding:'10px', borderRadius:2, border:'none', background:C.acc,
                      color:'#fff', fontSize:13, fontFamily:F, fontWeight:600, cursor:'pointer' }}>
                    {saving ? '...' : 'リストに追加'}
                  </button>
                </div>
              </div>
            )}

            {searchQ.length < 2 ? (
              <div style={{ textAlign:'center', padding:30, color:C.sub, fontSize:13 }}>2文字以上で検索</div>
            ) : invItems.length === 0 ? (
              <div style={{ textAlign:'center', padding:30, color:C.sub, fontSize:13 }}>該当なし</div>
            ) : invItems.map(item => (
              <div key={item.id} onClick={() => { setAdding(item); setAddPrice(item.price ? String(Math.round(item.price * 1.5)) : ''); }}
                style={{
                  background:C.card, borderRadius:1, padding:'10px 14px 10px 20px',
                  border:`1px solid ${adding?.id === item.id ? C.acc : C.bd}`, marginBottom:4,
                  cursor:'pointer', position:'relative',
                }}>
                <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background: storeColor[item.store_id] || C.acc, opacity:0.5 }} />
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:600, fontFamily:EL, color:C.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                    <div style={{ fontSize:11, color:C.sub, marginTop:1 }}>{item.producer || ''}{item.vintage ? ` · ${item.vintage}` : ''}</div>
                  </div>
                  <div style={{ flexShrink:0, marginLeft:8, textAlign:'right' }}>
                    <QBadge q={item.quantity} />
                    {item.price != null && <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>{fmt(item.price)}</div>}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {toast && <Toast msg={toast} onClose={() => setToast('')} />}
    </div>
  );
}

// ===== WineListStorePicker — matches Beverage Compass リスト tab =====
function WineListStorePicker({ stores, categories, onOpenStore, onOpenPrint, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [selectedStore, setSelectedStore] = useState(null);

  useEffect(() => {
    fetch('/api/stats').then(r => r.json()).then(d => setStats(d)).catch(() => setStats({ stores: {} }));
  }, []);

  const getStoreName = (store) => {
    if (store.id === 'burgundy') return 'Burgundy';
    if (store.id === 'ume') return 'umé';
    if (store.id === 'ch') return 'C&H';
    return store.name;
  };
  const getStoreSubName = (store) => {
    if (store.id === 'burgundy') return 'Warehouse';
    if (store.id === 'ch') return 'シェ・カルベール / Chez Calvert';
    if (store.id === 'ume') return 'umé';
    return store.name_en || '';
  };
  const getStoreFont = (store) => {
    if (store.id === 'burgundy' || store.id === 'ume' || store.id === 'ch') return EL;
    return SR;
  };

  // Store picker view
  if (!selectedStore) {
    return (
      <div style={{ padding:'16px 16px 100px' }}>
        <div style={{ fontSize:18, fontWeight:400, letterSpacing:2, color:C.tx, fontFamily:EL, marginBottom:16 }}>
          在庫一覧
        </div>
        {stores.map(store => {
          const ss = stats?.stores?.[store.id];
          if (!ss || ss.total === 0) return null;
          return (
            <div key={store.id} onClick={() => setSelectedStore(store)}
              style={{
                background:C.card, borderRadius:2, padding:'16px 20px',
                border:`1px solid ${C.bd}`, marginBottom:6, cursor:'pointer',
                display:'flex', justifyContent:'space-between', alignItems:'center',
              }}>
              <div>
                <div style={{ fontSize:18, fontWeight:400, fontFamily:getStoreFont(store), letterSpacing:'2px', color:C.tx }}>
                  {getStoreName(store)}
                </div>
                <div style={{ fontSize:10, color:'rgba(74,68,64,0.5)', fontFamily:EL, letterSpacing:'1px', marginTop:2 }}>
                  {getStoreSubName(store)}
                </div>
              </div>
              <div style={{ textAlign:'right' }}>
                <div style={{ fontSize:14, fontWeight:700, color:C.tx, fontFamily:F }}>{ss.total}種</div>
                <div style={{ fontSize:11, color:C.acc, fontWeight:600, fontFamily:F }}>{fmtY(Math.round(ss.totalValue))}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  // Category view for selected store
  const ss = stats?.stores?.[selectedStore.id] || { categories: {}, total: 0, totalQty: 0, totalValue: 0 };
  const storeName = getStoreName(selectedStore);

  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      {/* Header */}
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${C.bd}` }}>
        <button onClick={() => setSelectedStore(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><IcoBack /></button>
        <div style={{ flex:1 }}>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:getStoreFont(selectedStore), color:C.tx, letterSpacing:'1.5px' }}>
            {storeName}
          </div>
          <div style={{ fontSize:11, color:C.sub, fontFamily:F }}>ワインリスト · {ss.total}種</div>
        </div>
      </div>

      <div style={{ padding:'12px 16px 100px' }}>
        {/* Summary */}
        <div style={{ display:'flex', gap:12, marginBottom:16, padding:'10px 14px', background:'linear-gradient(135deg, #E0DBCF 0%, #D5D0C6 100%)', borderRadius:2, border:`1px solid ${C.bd}` }}>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, color:'rgba(74,68,64,0.45)', fontFamily:F }}>在庫</div>
            <div style={{ fontSize:16, fontWeight:700, fontFamily:F }}>{ss.total}種</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, color:'rgba(74,68,64,0.45)', fontFamily:F }}>本数</div>
            <div style={{ fontSize:16, fontWeight:700, fontFamily:F }}>{Math.round(ss.totalQty || 0).toLocaleString()}本</div>
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontSize:9, color:'rgba(74,68,64,0.45)', fontFamily:F }}>総額</div>
            <div style={{ fontSize:16, fontWeight:700, color:C.acc, fontFamily:F }}>{fmtY(Math.round(ss.totalValue || 0))}</div>
          </div>
        </div>

        {/* Category cards */}
        {categories.filter(c => !c.parent_id).map(cat => {
          const catSt = ss.categories?.[cat.id];
          if (!catSt || catSt.count === 0) return null;
          // Get subcategory names
          const subCats = categories.filter(sc => sc.parent_id === cat.id);
          const subNames = subCats.map(sc => sc.name_en || sc.name).join(' · ');
          return (
            <div key={cat.id} onClick={() => onNavigate('list-items', { store: selectedStore.id, category: cat.id, title: `${storeName} · ${cat.name}` })}
              style={{
                background:C.card, borderRadius:2, padding:'14px 18px',
                border:`1px solid ${C.bd}`, marginBottom:5, cursor:'pointer',
              }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:600, color:C.tx, fontFamily:F }}>{cat.name}</div>
                  {subNames && (
                    <div style={{ fontSize:10, color:C.sub, marginTop:3, fontFamily:F }}>{subNames}</div>
                  )}
                </div>
                <div style={{ textAlign:'right', flexShrink:0 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:C.tx, fontFamily:F }}>{catSt.count}種</div>
                  <div style={{ fontSize:10, color:C.sub, fontFamily:F }}>{Math.round(catSt.qty || 0)}本</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* 全アイテム表示 button */}
        <button onClick={() => onNavigate('list-items', { store: selectedStore.id, title: `${storeName} · 全在庫` })} style={{
          width:'100%', padding:'12px', borderRadius:2, marginTop:12,
          border:`1px solid ${C.acc}`, background:'transparent',
          fontSize:12, fontFamily:F, color:C.acc, cursor:'pointer', fontWeight:600,
        }}>全カテゴリを表示</button>
      </div>
    </div>
  );
}

// ===== CSVExport =====
function CSVExport({ stores, onClose }) {
  const [storeId, setStoreId] = useState('');

  const doExport = () => {
    const url = storeId ? `/api/export?format=csv&store=${storeId}` : `/api/export?format=csv`;
    window.open(url, '_blank');
    onClose();
  };

  return (
    <BottomSheet open={true} onClose={onClose}>
      <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:16 }}>CSV出力</div>

      <div style={{ marginBottom:16 }}>
        <div style={{ fontSize:10, color:C.sub, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>店舗を選択</div>
        <select value={storeId} onChange={e => setStoreId(e.target.value)}
          style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F }}>
          <option value="">全店舗</option>
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      <div style={{ display:'flex', gap:10 }}>
        <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.tx }}>キャンセル</button>
        <button onClick={doExport} style={{
          flex:1, padding:12, borderRadius:2, border:'none', background:C.acc,
          color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer',
        }}>ダウンロード</button>
      </div>
    </BottomSheet>
  );
}

// ===== ManualRemoval =====
function ManualRemoval({ stores, onClose, onRemoved, onStockZero }) {
  const [storeId, setStoreId] = useState(stores[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [cart, setCart] = useState([]);
  const [step, setStep] = useState('select');
  const [processing, setProcessing] = useState(false);

  const doSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const resp = await fetch(`/api/beverages?store=${storeId}&q=${encodeURIComponent(searchQuery.trim())}&limit=20&stock=true`);
      const data = await resp.json();
      setResults(data.items || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const addToCart = (item) => {
    if (cart.find(c => c.id === item.id)) return;
    setCart(prev => [...prev, {
      id: item.id, name: item.name, name_kana: item.name_kana,
      vintage: item.vintage, producer: item.producer,
      quantity: item.quantity, removeQty: 1,
    }]);
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const doRemoval = async () => {
    setProcessing(true);
    for (const item of cart) {
      const newQty = Math.max(0, item.quantity - item.removeQty);
      try {
        await fetch(`/api/beverages/${item.id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: newQty }),
        });
        if (newQty === 0 && onStockZero) onStockZero(item.id, storeId);
      } catch (e) { console.error(e); }
    }
    onRemoved();
    setStep('done');
    setProcessing(false);
  };

  const inCart = (id) => cart.find(c => c.id === id);

  return (
    <BottomSheet open={true} onClose={onClose}>
      {step === 'select' && (
        <div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:4 }}>選んで出庫</div>
          <div style={{ fontSize:12, color:C.sub, marginBottom:10 }}>ワインを検索して選択 → まとめて出庫</div>

          <div style={{ marginBottom:10 }}>
            <div style={{ fontSize:10, color:C.sub, marginBottom:4, textTransform:'uppercase', letterSpacing:0.5 }}>対象店舗</div>
            <select value={storeId} onChange={e => setStoreId(e.target.value)}
              style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:14, fontFamily:F }}>
              {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={{ display:'flex', gap:6, marginBottom:10 }}>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doSearch()}
              placeholder="ワイン名・生産者で検索..."
              style={{ flex:1, padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:2, fontSize:13, fontFamily:F }} />
            <button onClick={doSearch} disabled={loading}
              style={{ padding:'8px 14px', borderRadius:2, border:'none', background:C.acc, color:'#fff', fontSize:13, fontFamily:F, cursor:'pointer' }}>
              {loading ? '...' : '検索'}
            </button>
          </div>

          {results.length > 0 && (
            <div style={{ maxHeight:'25vh', overflowY:'auto', marginBottom:10 }}>
              {results.map(item => {
                const already = inCart(item.id);
                return (
                  <div key={item.id} onClick={() => !already && addToCart(item)} style={{
                    padding:'8px 10px', marginBottom:3, background: already ? '#F0F8F0' : C.card,
                    border:`1px solid ${already ? '#C8E0C8' : C.bd}`, borderRadius:2,
                    cursor: already ? 'default' : 'pointer', opacity: already ? 0.7 : 1,
                    display:'flex', justifyContent:'space-between', alignItems:'center',
                  }}>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, fontFamily:EL, color:C.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                      {item.name_kana && item.name_kana !== item.name && <div style={{ fontSize:9, color:'#B0AA9C' }}>{item.name_kana}</div>}
                      <div style={{ fontSize:10, color:C.sub }}>{item.vintage || 'NV'} · {item.producer || ''} · 在庫:{item.quantity}</div>
                    </div>
                    <div style={{ fontSize:16, flexShrink:0, marginLeft:6 }}>{already ? '✅' : '＋'}</div>
                  </div>
                );
              })}
            </div>
          )}

          {cart.length > 0 && (
            <div style={{ borderTop:`1px solid ${C.bd}`, paddingTop:10 }}>
              <div style={{ fontSize:12, fontWeight:600, color:C.tx, marginBottom:6 }}>出庫リスト ({cart.length}本)</div>
              {cart.map(item => (
                <div key={item.id} style={{
                  padding:'8px 10px', marginBottom:3, background:'#FFF8F0', border:'1px solid #E8D8C0', borderRadius:2,
                  display:'flex', justifyContent:'space-between', alignItems:'center',
                }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:600, fontFamily:EL, color:C.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
                    {item.name_kana && item.name_kana !== item.name && <div style={{ fontSize:9, color:'#B0AA9C' }}>{item.name_kana}</div>}
                    <div style={{ fontSize:10, color:C.sub }}>{item.vintage || 'NV'} · {item.producer || ''}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
                    <span style={{ fontSize:12, fontWeight:600, color:C.wine }}>-{item.removeQty}</span>
                    <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }}
                      style={{ width:20, height:20, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card,
                        fontSize:12, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.sub }}>✕</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ display:'flex', gap:10, marginTop:12 }}>
            <button onClick={onClose} style={{ flex:1, padding:12, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.tx }}>キャンセル</button>
            <button onClick={() => setStep('confirm')} disabled={cart.length === 0} style={{
              flex:1, padding:12, borderRadius:2, border:'none', background: cart.length > 0 ? C.wine : C.bd, color:'#fff',
              fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer',
            }}>出庫確認 →</button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:8 }}>以下の{cart.length}本を出庫しますか？</div>
          <div style={{ maxHeight:'50vh', overflowY:'auto', marginBottom:16 }}>
            {cart.map(item => (
              <div key={item.id} style={{ padding:'10px 12px', marginBottom:4, background:'#FFF8F0', border:'1px solid #E8D8C0', borderRadius:2 }}>
                <div style={{ fontSize:14, fontWeight:600, fontFamily:EL, color:C.tx }}>{item.name}</div>
                {item.name_kana && item.name_kana !== item.name && <div style={{ fontSize:10, color:'#B0AA9C', marginTop:1 }}>{item.name_kana}</div>}
                <div style={{ fontSize:11, color:C.sub, marginTop:2 }}>
                  {item.vintage || 'NV'} · {item.producer || ''} · 在庫:{item.quantity} → {Math.max(0, item.quantity - item.removeQty)}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setStep('select')} style={{ flex:1, padding:12, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.tx }}>戻る</button>
            <button onClick={doRemoval} disabled={processing} style={{
              flex:1, padding:12, borderRadius:2, border:'none', background:C.wine, color:'#fff',
              fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer', opacity: processing ? 0.5 : 1,
            }}>{processing ? '処理中...' : `${cart.length}本を出庫`}</button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <div style={{ textAlign:'center', padding:20 }}>
          <div style={{ fontSize:40, marginBottom:12 }}>✅</div>
          <div style={{ fontSize:16, fontWeight:500, fontFamily:SR, color:C.tx, marginBottom:8 }}>出庫完了</div>
          <div style={{ fontSize:14, color:C.green, fontWeight:600 }}>{cart.length}本 出庫しました</div>
          <button onClick={onClose} style={{
            marginTop:20, padding:'12px 32px', borderRadius:2, border:'none', background:C.acc,
            color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer',
          }}>閉じる</button>
        </div>
      )}
    </BottomSheet>
  );
}

// ===== StockManager =====
function StockManager({ onNavigate, onImport, onPhotoImport, onPhotoRemoval, onManualRemoval, onCSVExport, stores }) {
  const actions = [
    { icon: '📦', title: '在庫一覧', desc: '全アイテムを閲覧・管理', action: () => onNavigate('list-items', { title: '全在庫一覧' }) },
    { icon: '📷', title: 'AI入庫', desc: '納品書の写真・PDF→AI読取→在庫追加', action: () => onPhotoImport() },
    { icon: '🍷', title: '写真で出庫', desc: 'ボトル撮影→AI識別→1本ずつ確認', action: () => onPhotoRemoval() },
    { icon: '🔍', title: '選んで出庫', desc: '検索→選択→まとめて出庫', action: () => onManualRemoval() },
    { icon: '➕', title: '新規追加', desc: 'アイテムを手動で追加', action: () => onNavigate('add') },
    { icon: '📊', title: 'Excel取込', desc: 'バーガンディ在庫・5社在庫を自動判別', action: () => onImport() },
    { icon: '📋', title: 'CSV出力', desc: '店舗別に在庫データをCSVでエクスポート', action: () => onCSVExport() },
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
function ItemListPage({ title, storeId, categoryId, categoriesParam, stores, categories, onBack, onSelect, onAdd }) {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('category');
  const debRef = useRef(null);
  const PAGE_SIZE = 50;

  // Wine list selection states
  const [onListIds, setOnListIds] = useState(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [wlStep, setWlStep] = useState(null); // null | 'price' | 'confirm'
  const [prices, setPrices] = useState({});
  const [targetStore, setTargetStore] = useState(storeId);
  const [saving, setSaving] = useState(false);
  const [wlToast, setWlToast] = useState('');

  const SORT_OPTIONS = [
    { val: 'category', label: 'カテゴリ順' },
    { val: 'name', label: '名前順' },
    { val: 'price_desc', label: '高い順' },
    { val: 'price_asc', label: '安い順' },
    { val: 'producer', label: '生産者+価格順' },
  ];

  const restaurantStores = stores.filter(s => s.id !== 'burgundy');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (storeId) p.set('store', storeId);
    if (categoriesParam) p.set('categories', categoriesParam);
    else if (categoryId) p.set('category', String(categoryId));
    if (q) p.set('q', q);
    p.set('sort', sort);
    p.set('page', String(page));
    p.set('limit', String(PAGE_SIZE));
    try {
      const r = await fetch('/api/beverages?' + p.toString());
      const data = await r.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch(e) { setItems([]); setTotal(0); }
    setLoading(false);
  }, [storeId, categoryId, categoriesParam, q, page, sort]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Fetch on-list IDs
  const fetchOnListIds = useCallback(async () => {
    const sid = targetStore || storeId;
    if (!sid) return;
    try {
      const r = await fetch(`/api/wine-list?store=${sid}`);
      const d = await r.json();
      setOnListIds(new Set((d.items || []).map(wl => wl.beverage_id)));
    } catch(e) {}
  }, [targetStore, storeId]);

  useEffect(() => { fetchOnListIds(); }, [fetchOnListIds]);

  const onSearch = (val) => {
    if (debRef.current) clearTimeout(debRef.current);
    debRef.current = setTimeout(() => { setQ(val); setPage(1); }, 300);
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // AI recommended price calculation
  const calcPrice = (item) => {
    const cost = item.cost_price || 0;
    if (!cost) return '';
    let rate;
    if (cost >= 20000) rate = 1.8;
    else if (cost >= 10000) rate = 2.0;
    else if (cost >= 5000) rate = 2.5;
    else if (cost >= 2000) rate = 3.0;
    else rate = 3.5;
    return Math.ceil(cost * rate / 500) * 500;
  };

  // Enter price step
  const goToPriceStep = () => {
    const defaultPrices = {};
    items.filter(i => selectedIds.has(i.id)).forEach(item => {
      defaultPrices[item.id] = calcPrice(item);
    });
    setPrices(defaultPrices);
    setWlStep('price');
  };

  // Save to wine list
  const saveToWineList = async () => {
    setSaving(true);
    const sid = targetStore || storeId;
    const entries = [...selectedIds].map(bevId => ({
      store_id: sid,
      beverage_id: bevId,
      sell_price: prices[bevId] ? Number(prices[bevId]) : null,
    }));
    try {
      const r = await fetch('/api/wine-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: entries }),
      });
      if (r.ok) {
        setWlToast(`${entries.length}件をワインリストに追加しました`);
        setSelectMode(false);
        setSelectedIds(new Set());
        setWlStep(null);
        await fetchOnListIds();
      }
    } catch(e) { setWlToast('エラーが発生しました'); }
    setSaving(false);
  };

  const cancelWlMode = () => {
    setSelectMode(false);
    setSelectedIds(new Set());
    setWlStep(null);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const storeColor = {};
  stores.forEach(s => { storeColor[s.id] = s.color || '#4A6352'; });

  const selectedItems = items.filter(i => selectedIds.has(i.id));

  // ===== Price Setting Step =====
  if (wlStep === 'price') {
    return (
      <div style={{ minHeight:'100vh', background:C.bg }}>
        <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${C.bd}` }}>
          <button onClick={() => setWlStep(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><IcoBack /></button>
          <div style={{ flex:1, fontSize:15, fontWeight:500, fontFamily:SR, color:C.tx }}>売価を設定 ({selectedIds.size}件)</div>
        </div>
        {/* Target store selector */}
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.bd}`, display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:11, color:C.sub, fontFamily:F }}>リスト先:</span>
          <select value={targetStore} onChange={e => setTargetStore(e.target.value)}
            style={{ flex:1, padding:'6px 10px', border:`1px solid ${C.bd}`, borderRadius:4, fontSize:13, fontFamily:F, background:C.card }}>
            {restaurantStores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div style={{ padding:'12px 16px 120px' }}>
          {selectedItems.map(item => {
            const cost = item.cost_price || 0;
            const rec = calcPrice(item);
            return (
              <div key={item.id} style={{ background:C.card, border:`1px solid ${C.bd}`, borderRadius:2, padding:'12px 14px', marginBottom:6 }}>
                <div style={{ fontSize:13, fontWeight:600, fontFamily:EL, color:C.tx, marginBottom:2 }}>
                  {item.name}{item.vintage && <span style={{ fontWeight:400, fontSize:11, color:'#8A8478', marginLeft:3 }}>{item.vintage}</span>}
                </div>
                {item.producer && <div style={{ fontSize:10, color:'#A09A8C', fontFamily:F, marginBottom:6 }}>{item.producer}</div>}
                <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' }}>
                  {cost > 0 && <span style={{ fontSize:11, color:C.sub, fontFamily:F }}>仕入: {fmt(cost)}</span>}
                  {rec && <span style={{ fontSize:11, color:'#6B8C5E', fontFamily:F, fontWeight:600 }}>AI推奨: {fmt(rec)}</span>}
                  <div style={{ flex:1, minWidth:100 }}>
                    <input type="number" value={prices[item.id] || ''} onChange={e => setPrices(prev => ({ ...prev, [item.id]: e.target.value }))}
                      placeholder={rec ? String(rec) : '売価'}
                      style={{ width:'100%', padding:'6px 10px', border:`1px solid ${C.bd}`, borderRadius:4, fontSize:14, fontFamily:F, boxSizing:'border-box', textAlign:'right' }} />
                  </div>
                </div>
                {cost > 0 && (
                  <div style={{ display:'flex', gap:6, marginTop:6 }}>
                    {[1.5, 2.0, 2.5, 3.0].map(r => (
                      <button key={r} onClick={() => setPrices(prev => ({ ...prev, [item.id]: Math.ceil(cost * r / 500) * 500 }))}
                        style={{ padding:'3px 8px', borderRadius:10, border:`1px solid ${C.bd}`, background:'transparent',
                          fontSize:9, color:C.sub, cursor:'pointer', fontFamily:F }}>×{r}</button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Bottom bar */}
        <div style={{
          position:'fixed', bottom:56, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430,
          background:'rgba(253,252,250,0.97)', borderTop:`1px solid ${C.bd}`, padding:'12px 16px', boxSizing:'border-box',
          display:'flex', gap:10, zIndex:90,
        }}>
          <button onClick={() => setWlStep(null)} style={{
            flex:1, padding:'12px', borderRadius:2, border:`1px solid ${C.bd}`, background:C.card,
            fontSize:13, fontFamily:F, cursor:'pointer', color:C.tx,
          }}>戻る</button>
          <button onClick={() => setWlStep('confirm')} style={{
            flex:2, padding:'12px', borderRadius:2, border:'none', background:C.acc,
            color:'#fff', fontSize:13, fontFamily:F, fontWeight:600, cursor:'pointer',
          }}>オンリストしますか？</button>
        </div>
      </div>
    );
  }

  // ===== Confirm/Preview Step =====
  if (wlStep === 'confirm') {
    const storeName = stores.find(s => s.id === targetStore)?.name || targetStore;
    return (
      <div style={{ minHeight:'100vh', background:C.bg }}>
        <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${C.bd}` }}>
          <button onClick={() => setWlStep('price')} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><IcoBack /></button>
          <div style={{ flex:1, fontSize:15, fontWeight:500, fontFamily:SR, color:C.tx }}>プレビュー</div>
        </div>
        <div style={{ padding:'12px 16px', borderBottom:`1px solid ${C.bd}`, background:'#F5F3EE' }}>
          <div style={{ fontSize:12, color:C.sub, fontFamily:F }}>
            <span style={{ fontWeight:600, color:C.tx }}>{storeName}</span> のワインリストに <span style={{ fontWeight:700, color:C.acc }}>{selectedIds.size}件</span> 追加
          </div>
        </div>
        <div style={{ padding:'12px 16px 120px' }}>
          {selectedItems.map((item, idx) => (
            <div key={item.id} style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'10px 0', borderBottom: idx < selectedItems.length - 1 ? `1px solid ${C.bd}` : 'none',
            }}>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontSize:13, fontWeight:600, fontFamily:EL, color:C.tx, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {item.name}{item.vintage && <span style={{ fontWeight:400, fontSize:11, color:'#8A8478', marginLeft:3 }}>{item.vintage}</span>}
                </div>
                {item.producer && <div style={{ fontSize:10, color:'#A09A8C', fontFamily:F }}>{item.producer}</div>}
              </div>
              <div style={{ textAlign:'right', flexShrink:0, marginLeft:10 }}>
                <div style={{ fontSize:13, fontWeight:700, color:C.acc, fontFamily:F }}>
                  {prices[item.id] ? fmt(Number(prices[item.id])) : '-'}
                </div>
                {item.cost_price > 0 && (
                  <div style={{ fontSize:9, color:C.sub, fontFamily:F }}>仕入: {fmt(item.cost_price)}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <div style={{
          position:'fixed', bottom:56, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430,
          background:'rgba(253,252,250,0.97)', borderTop:`1px solid ${C.bd}`, padding:'12px 16px', boxSizing:'border-box',
          display:'flex', gap:10, zIndex:90,
        }}>
          <button onClick={() => setWlStep('price')} style={{
            flex:1, padding:'12px', borderRadius:2, border:`1px solid ${C.bd}`, background:C.card,
            fontSize:13, fontFamily:F, cursor:'pointer', color:C.tx,
          }}>戻る</button>
          <button onClick={saveToWineList} disabled={saving} style={{
            flex:2, padding:'12px', borderRadius:2, border:'none', background:'#4A6352',
            color:'#fff', fontSize:13, fontFamily:F, fontWeight:600, cursor:'pointer',
            opacity: saving ? 0.6 : 1,
          }}>{saving ? '保存中...' : '確認してリストに追加'}</button>
        </div>
      </div>
    );
  }

  // ===== Normal / Selection Mode =====
  return (
    <div style={{ minHeight:'100vh', background:C.bg }}>
      <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', gap:10, borderBottom:`1px solid ${C.bd}` }}>
        <button onClick={selectMode ? cancelWlMode : onBack} style={{ background:'none', border:'none', cursor:'pointer', padding:4 }}><IcoBack /></button>
        <div style={{ flex:1, fontSize:15, fontWeight:500, fontFamily:SR, color:C.tx }}>
          {selectMode ? 'ワインリストに追加' : (title || '在庫一覧')}
        </div>
        {selectMode ? (
          <span style={{ fontSize:12, color:C.acc, fontWeight:600 }}>{selectedIds.size}件選択</span>
        ) : (
          <span style={{ fontSize:12, color:C.sub }}>{total}件</span>
        )}
      </div>
      <div style={{ padding:'10px 16px 0' }}>
        <input onChange={e => onSearch(e.target.value)} placeholder="検索..."
          style={{ width:'100%', padding:'10px 14px', border:`1px solid ${C.bd}`, borderRadius:10, fontSize:14, fontFamily:F, background:C.card, boxSizing:'border-box', outline:'none' }} />
      </div>
      {/* Sort options + Wine list button */}
      <div style={{ padding:'8px 16px', display:'flex', gap:4, overflowX:'auto', alignItems:'center' }}>
        {SORT_OPTIONS.map(opt => (
          <button key={opt.val} onClick={() => { setSort(opt.val); setPage(1); }}
            style={{
              padding:'4px 10px', borderRadius:10, border: sort === opt.val ? `1px solid ${C.acc}` : `1px solid ${C.bd}`,
              background: sort === opt.val ? '#F5F0E5' : 'transparent',
              color: sort === opt.val ? C.acc : C.sub,
              fontSize:10, fontFamily:F, cursor:'pointer', whiteSpace:'nowrap', fontWeight: sort === opt.val ? 600 : 400,
            }}>{opt.label}</button>
        ))}
        <div style={{ flex:1 }} />
        {!selectMode && (
          <button onClick={() => setSelectMode(true)} style={{
            padding:'4px 10px', borderRadius:10, border:`1px solid #6B8C5E`,
            background:'#EBF2EB', color:'#4A6352', fontSize:10, fontFamily:F, cursor:'pointer',
            whiteSpace:'nowrap', fontWeight:600, display:'flex', alignItems:'center', gap:3,
          }}>📋 リスト追加</button>
        )}
      </div>
      <div style={{ padding:'0 16px 120px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:C.sub, fontSize:13 }}>読み込み中...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:C.sub, fontSize:13 }}>該当なし</div>
        ) : items.map(item => {
          const isOnList = onListIds.has(item.id);
          const isSelected = selectedIds.has(item.id);
          return (
            <div key={item.id} onClick={() => {
              if (selectMode) {
                if (!isOnList) toggleSelect(item.id);
              } else {
                onSelect(item);
              }
            }} style={{
              background: isSelected ? '#F0EDE5' : C.card, borderRadius:1,
              padding:'12px 14px 12px 20px',
              border: isSelected ? `1px solid ${C.acc}` : `1px solid ${C.bd}`,
              marginBottom:5, cursor:'pointer', position:'relative',
              opacity: selectMode && isOnList ? 0.5 : 1,
            }}>
              <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background: storeColor[item.store_id] || C.acc, opacity:0.5 }} />
              <div style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                {/* Selection / On-list indicator */}
                {selectMode ? (
                  <div style={{
                    width:22, height:22, borderRadius:'50%', flexShrink:0, marginTop:2,
                    border: isOnList ? '2px solid #6B8C5E' : isSelected ? `2px solid ${C.acc}` : '2px dashed #C0B8A8',
                    background: isOnList ? '#6B8C5E' : isSelected ? C.acc : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                  }}>
                    {(isOnList || isSelected) && (
                      <svg width={12} height={12} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    )}
                  </div>
                ) : isOnList ? (
                  <div style={{
                    width:8, height:8, borderRadius:'50%', background:'#6B8C5E', flexShrink:0, marginTop:8,
                  }} title="オンリスト" />
                ) : null}
                <div style={{ flex:1, minWidth:0 }}>
                  {item.producer && <div style={{ fontSize:9, color:'#A09A8C', fontFamily:F, letterSpacing:0.3, marginBottom:1 }}>{item.producer}</div>}
                  {(item.region || item.wc_categories?.name) && <div style={{ fontSize:9, color:'#B0AA9C', fontFamily:F, marginTop:1 }}>{item.region || item.wc_categories?.name || ''}</div>}
                  <div style={{ fontSize:14, fontWeight:600, fontFamily:EL, color:C.tx, lineHeight:1.35 }}>{item.name}{item.vintage && <span style={{ fontWeight:400, fontSize:12, color:'#8A8478', marginLeft:3, fontFamily:F }}>{item.vintage}</span>}</div>
                  {item.name_kana && item.name_kana !== item.name && <div style={{ fontSize:10, color:'#B0AA9C', fontFamily:"'Noto Sans JP',sans-serif", marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name_kana}</div>}
                  {item.notes && <div style={{ fontSize:10, color:'#B0AA9C', fontFamily:F, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.notes}</div>}
                </div>
                <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0, marginLeft:10 }}>
                  <QBadge q={item.quantity} />
                  {item.cost_price != null && <span style={{ fontSize:10, color:'#B0AA9C', fontFamily:F }}>仕入: {fmt(item.cost_price)}</span>}
                  {item.price != null && <span style={{ fontSize:10, color:C.acc, fontFamily:F }}>売値: {fmt(item.price)}</span>}
                </div>
              </div>
            </div>
          );
        })}
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
      {/* Bottom action bars */}
      {selectMode ? (
        <div style={{
          position:'fixed', bottom:56, left:'50%', transform:'translateX(-50%)', width:'100%', maxWidth:430,
          background:'rgba(253,252,250,0.97)', borderTop:`1px solid ${C.bd}`, padding:'10px 16px', boxSizing:'border-box',
          display:'flex', gap:10, alignItems:'center', zIndex:90,
        }}>
          <button onClick={cancelWlMode} style={{
            padding:'10px 16px', borderRadius:2, border:`1px solid ${C.bd}`, background:C.card,
            fontSize:12, fontFamily:F, cursor:'pointer', color:C.tx,
          }}>キャンセル</button>
          <div style={{ flex:1, textAlign:'center', fontSize:11, color:C.sub, fontFamily:F }}>
            {selectedIds.size > 0 ? `${selectedIds.size}件選択中` : 'アイテムを選択'}
          </div>
          <button onClick={goToPriceStep} disabled={selectedIds.size === 0} style={{
            padding:'10px 20px', borderRadius:2, border:'none', background: selectedIds.size > 0 ? C.acc : '#D0C8B8',
            color:'#fff', fontSize:13, fontFamily:F, fontWeight:600, cursor: selectedIds.size > 0 ? 'pointer' : 'default',
          }}>決定</button>
        </div>
      ) : (
        <button onClick={onAdd} style={{
          position:'fixed', bottom:72, right:'calc(50% - 195px)', width:48, height:48, borderRadius:'50%',
          background:C.acc, color:'#fff', border:'none', fontSize:24, cursor:'pointer',
          boxShadow:'0 4px 12px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50,
        }}>+</button>
      )}
      {wlToast && <Toast msg={wlToast} onClose={() => setWlToast('')} />}
    </div>
  );
}

// ===== AI Section Config =====
const AI_SECTIONS = [
  { key: 'taste', label: 'Taste', color: '#8B2252' },
  { key: 'terroir', label: 'Terroir', color: '#6B8C5E' },
  { key: 'producer', label: 'Producer', color: '#8B6914' },
  { key: 'vintage', label: 'Vintage', color: '#5C5C78' },
  { key: 'pairing', label: 'Pairing', color: '#B06040' },
  { key: 'service', label: 'Service', color: '#6A7D8E' },
  { key: 'market', label: 'Market', color: '#2A5E3F' },
];
const WINE_CACHE = {};
const wineKey = (item) => (item.name || '') + '_' + (item.vintage || 'NV');

// ===== AI Section Renderers =====
function AiSectionContent({ section, data }) {
  if (!data) return null;
  if (data.error) return <div style={{ textAlign:'center', padding:20, color:'#B0AA9C', fontSize:12 }}>情報を取得できませんでした</div>;

  const SH = ({ title }) => <div style={{ fontSize:10, color:'#A09A8C', textTransform:'uppercase', letterSpacing:1.5, fontFamily:F, marginBottom:12, fontWeight:600 }}>{title}</div>;
  const P = ({ text }) => <div style={{ fontSize:13, lineHeight:1.7, color:'#3A3630', fontFamily:"'Noto Sans JP',sans-serif", marginBottom:12 }}>{text}</div>;
  const Tag = ({ text, accent }) => <span style={{ display:'inline-block', fontSize:10, padding:'3px 10px', borderRadius:6, background: accent ? 'rgba(139,105,20,0.08)' : '#F0EDE8', color: accent ? '#8B6914' : '#5A5548', marginRight:4, marginBottom:4, fontFamily:F }}>{text}</span>;
  const Row = ({ label, value }) => value && value !== 'null' ? (
    <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #F0EDE8' }}>
      <span style={{ fontSize:11, color:'#A09A8C', fontFamily:F }}>{label}</span>
      <span style={{ fontSize:12, fontWeight:500, color:C.tx, textAlign:'right', maxWidth:'60%' }}>{value}</span>
    </div>
  ) : null;

  if (section === 'taste') return (
    <div>
      <SH title="TASTING PROFILE" />
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:16 }}>
        {[['Sweetness',data.sweetness],['Acidity',data.acidity],['Tannin',data.tannin],['Alcohol',data.alcohol],['Body',data.body],['Intensity',data.intensity],['Finish',data.finish]].map(([l,v]) =>
          <div key={l} style={{ background:'#F6F4F0', borderRadius:8, padding:'8px 12px' }}>
            <div style={{ fontSize:9, color:'#A09A8C', textTransform:'uppercase', letterSpacing:0.8, fontFamily:F }}>{l}</div>
            <div style={{ fontSize:12, fontWeight:600, color:'#8B2252', marginTop:2, fontFamily:F, textTransform:'capitalize' }}>{v || '—'}</div>
          </div>
        )}
      </div>
      {data.aromas && <div style={{ marginBottom:12 }}>
        <div style={{ fontSize:9, color:'#A09A8C', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6, fontFamily:F }}>AROMAS</div>
        <div style={{ display:'flex', flexWrap:'wrap' }}>{data.aromas.map(a => <Tag key={a} text={a} />)}</div>
      </div>}
      {data.description && <P text={data.description} />}
    </div>
  );
  if (section === 'terroir') return (
    <div><SH title="TERROIR" /><Row label="Country" value={data.country} /><Row label="Region" value={data.region} /><Row label="Sub-region" value={data.subregion} /><Row label="Village" value={data.village} /><Row label="Vineyard" value={data.vineyard} /><Row label="Soil" value={data.soil} /><Row label="Climate" value={data.climate} /><Row label="Elevation" value={data.elevation} /><div style={{ height:12 }} />{data.description && <P text={data.description} />}</div>
  );
  if (section === 'producer') return (
    <div><SH title="PRODUCER" /><Row label="生産者" value={data.name} /><Row label="創業" value={data.founded} /><Row label="オーナー" value={data.owner} /><Row label="醸造責任者" value={data.winemaker} /><Row label="栽培方法" value={data.philosophy} /><div style={{ height:12 }} />{data.history && <P text={data.history} />}{data.notable && <div style={{ background:'#F6F4F0', borderRadius:10, padding:'12px 14px', borderLeft:`3px solid ${C.gold}`, marginTop:8 }}><P text={data.notable} /></div>}</div>
  );
  if (section === 'vintage') return (
    <div><SH title={`VINTAGE ${data.year || ''}`} /><Row label="評価" value={data.rating} /><Row label="気候" value={data.climate} /><Row label="収穫" value={data.harvest} /><Row label="熟成ポテンシャル" value={data.aging} /><div style={{ height:12 }} />{data.description && <P text={data.description} />}</div>
  );
  if (section === 'pairing') return (
    <div><SH title="FOOD PAIRING" />{data.ideal && <div style={{ marginBottom:12 }}><div style={{ fontSize:9, color:'#A09A8C', textTransform:'uppercase', letterSpacing:0.8, marginBottom:6, fontFamily:F }}>IDEAL PAIRINGS</div><div style={{ display:'flex', flexWrap:'wrap' }}>{data.ideal.map(p => <Tag key={p} text={p} accent />)}</div></div>}<Row label="クラシック" value={data.classic} /><Row label="避けるべき" value={data.avoid} /><div style={{ height:12 }} />{data.description && <P text={data.description} />}</div>
  );
  if (section === 'service') return (
    <div><SH title="SERVICE" /><Row label="適温" value={data.temperature} /><Row label="グラス" value={data.glass} /><Row label="デカンタ" value={data.decant} /><Row label="開栓" value={data.timing} /><div style={{ height:12 }} />{data.description && <P text={data.description} />}</div>
  );
  if (section === 'market') return (
    <div><SH title="MARKET" /><Row label="市場価格" value={data.avgPrice} /><Row label="価格レンジ" value={data.priceRange} /><Row label="トレンド" value={data.trend} /><Row label="希少性" value={data.rarity} /><Row label="評価" value={data.critic} /><div style={{ height:12 }} />{data.description && <P text={data.description} />}</div>
  );
  return null;
}

// ===== EditModal =====
function EditModal({ item, stores, categories, onSave, onClose }) {
  const [form, setForm] = useState({ ...item });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const catOpts = categories.map(c => ({ value: c.id, label: (c.parent_id ? '  ' : '') + c.name }));
  const storeOpts = stores.map(s => ({ value: s.id, label: s.name }));

  const save = async () => {
    setSaving(true);
    const updates = {};
    for (const k of ['name','producer','vintage','region','appellation','grape','price','cost_price','quantity','size_ml','notes','category_id','store_id']) {
      if (form[k] !== item[k]) updates[k] = form[k];
    }
    if (Object.keys(updates).length > 0) await onSave(item.id, updates);
    setSaving(false); onClose();
  };

  const Field = ({ label, k, type, opts }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:10, color:C.sub, marginBottom:4, fontFamily:F, textTransform:'uppercase', letterSpacing:0.5 }}>{label}</div>
      {opts ? (
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
      )}
    </div>
  );

  return (
    <BottomSheet open={true} onClose={onClose}>
      <div style={{ fontSize:14, fontWeight:600, fontFamily:F, color:C.tx, marginBottom:16 }}>編集</div>
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
      <Field label="在庫数" k="quantity" type="number" />
      <Field label="メモ" k="notes" type="textarea" />
      <div style={{ display:'flex', gap:10, marginTop:20 }}>
        <button onClick={onClose} style={{ flex:1, padding:'12px', borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.tx }}>キャンセル</button>
        <button onClick={save} disabled={saving} style={{ flex:1, padding:'12px', borderRadius:2, border:'none', background:C.acc, color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer' }}>{saving ? '...' : '保存'}</button>
      </div>
    </BottomSheet>
  );
}

// ===== DetailModal =====
function DetailModal({ item, stores, categories, onClose, onSave, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);

  // AI state
  const wk = wineKey(item);
  const [section, setSection] = useState(null);
  const [aiData, setAiData] = useState(WINE_CACHE[wk] || {});
  const [loading, setLoading] = useState(null);

  // Pairing & comment state
  const [pairings, setPairings] = useState([]);
  const [comments, setComments] = useState([]);
  const [showPairingForm, setShowPairingForm] = useState(false);
  const [pairingForm, setPairingForm] = useState({ date: new Date().toISOString().slice(0, 10), dish: '', description: '', staff: '' });
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');

  useEffect(() => {
    if (!item?.id) return;
    fetch(`/api/pairings?beverage_id=${item.id}`).then(r => r.json()).then(d => setPairings(Array.isArray(d) ? d : [])).catch(() => {});
    fetch(`/api/comments?beverage_id=${item.id}`).then(r => r.json()).then(d => setComments(Array.isArray(d) ? d : [])).catch(() => {});
  }, [item?.id]);

  const addPairing = async () => {
    if (!pairingForm.dish.trim()) return;
    try {
      const r = await fetch('/api/pairings', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beverage_id: item.id, store_id: item.store_id, ...pairingForm }) });
      const data = await r.json();
      if (data.id) { setPairings(prev => [data, ...prev]); setShowPairingForm(false); setPairingForm({ date: new Date().toISOString().slice(0, 10), dish: '', description: '', staff: '' }); }
    } catch(e) {}
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    try {
      const r = await fetch('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ beverage_id: item.id, text: commentText, author: commentAuthor || '匿名' }) });
      const data = await r.json();
      if (data.id) { setComments(prev => [data, ...prev]); setShowCommentInput(false); setCommentText(''); setCommentAuthor(''); }
    } catch(e) {}
  };

  if (!item) return null;

  const catName = categories.find(c => c.id === item.category_id)?.name || '';
  const storeName = stores.find(s => s.id === item.store_id)?.name || item.store_id;
  const vt = item.vintage ? String(item.vintage) : null;

  const adjustQty = async (delta) => {
    const newQty = Math.max(0, (item.quantity || 0) + delta);
    if (newQty === item.quantity) return;
    await onSave(item.id, { quantity: newQty });
  };

  const fetchSection = (key) => {
    if (aiData[key]) { setSection(key); return; }
    setSection(key); setLoading(key);
    const wine = `${item.producer || ''} ${item.name} ${item.vintage || 'NV'} (${catName}, ${item.region || ''})`;
    fetch('/api/ai/wine-analysis', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wine, section: key }),
    }).then(r => r.json()).then(parsed => {
      if (parsed.error) {
        setAiData(prev => ({ ...prev, [key]: { error: true } }));
      } else {
        const nd = { ...aiData, [key]: parsed };
        WINE_CACHE[wk] = nd;
        setAiData(nd);
      }
      setLoading(null);
    }).catch(() => {
      setAiData(prev => ({ ...prev, [key]: { error: true } }));
      setLoading(null);
    });
  };

  // Stat display component
  const Stat = ({ label, value, accent }) => (
    <div style={{ flex:1 }}>
      <div style={{ fontSize:9, color:'#A09A8C', textTransform:'uppercase', letterSpacing:1, marginBottom:4, fontFamily:F }}>{label}</div>
      <div style={{ fontSize:17, fontWeight:600, color: accent || C.tx, fontFamily:F }}>{value || '—'}</div>
    </div>
  );
  const Div = () => <div style={{ height:1, background:C.bd, margin:'16px 0' }} />;

  // Delegate to EditModal
  if (editing) return <EditModal item={item} stores={stores} categories={categories} onSave={onSave} onClose={() => setEditing(false)} />;

  return (
    <BottomSheet open={true} onClose={onClose}>
      <div style={{ padding:'4px 4px 0' }}>
        {/* AI Section view */}
        {section ? (
          <div>
            <button onClick={() => setSection(null)} style={{ background:'none', border:'none', cursor:'pointer', padding:0, display:'flex', alignItems:'center', gap:4, color:'#A09A8C', fontSize:11, marginBottom:12, fontFamily:F }}>
              <svg width={16} height={16} fill="none" stroke="#A09A8C" strokeWidth={2} viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6" /></svg>
              <span>{item.name}{vt ? ` ${vt}` : ''}</span>
            </button>
            {loading === section ? (
              <div style={{ textAlign:'center', padding:'40px 0' }}>
                <div style={{ fontSize:11, color:'#A09A8C', fontFamily:F, marginBottom:8 }}>{AI_SECTIONS.find(s => s.key === section)?.label} を取得中...</div>
                <div style={{ width:28, height:28, border:'2px solid #E8E4DC', borderTop:'2px solid #8B6914', borderRadius:'50%', margin:'0 auto', animation:'spin 0.8s linear infinite' }} />
              </div>
            ) : (
              <AiSectionContent section={section} data={aiData[section]} />
            )}
          </div>
        ) : (
          <div>
            {/* Producer name */}
            {item.producer && <div style={{ fontSize:11, color:'#A09A8C', marginBottom:4, fontFamily:F, letterSpacing:0.3 }}>{item.producer}</div>}

            {/* Wine name + vintage */}
            <div style={{ fontSize:22, fontWeight:700, lineHeight:1.3, fontFamily:EL, color:C.tx }}>
              {item.name}
              {vt && <span style={{ fontWeight:400, fontSize:18, color:'#8A8478', marginLeft:6, fontFamily:F }}>{vt}</span>}
            </div>
            {item.name_kana && item.name_kana !== item.name && <div style={{ fontSize:11, color:'#A09A8C', marginTop:3, fontFamily:F }}>{item.name_kana}</div>}

            {/* Region / Category line */}
            <div style={{ display:'flex', alignItems:'center', gap:5, marginTop:8 }}>
              <span style={{ fontSize:11, color:'#A09A8C', fontFamily:F }}>{catName}</span>
              {item.region && <span style={{ fontSize:10, color:'#B0AA9C', fontFamily:F, marginLeft:6 }}>{item.region}</span>}
            </div>

            <Div />

            {/* Info Grid Row 1: Vintage + Stock */}
            <div style={{ display:'flex', gap:0 }}>
              <Stat label="Vintage" value={item.vintage || 'NV'} accent={C.acc} />
              <div style={{ width:1, background:C.bd, margin:'0 16px', alignSelf:'stretch' }} />
              <Stat label="在庫" value={`${item.quantity || 0}本`} accent={(item.quantity || 0) <= 1 ? C.red : C.green} />
            </div>

            <Div />

            {/* Info Grid Row 2: Cost + Stock Value */}
            <div style={{ display:'flex', gap:0 }}>
              <Stat label="仕入価格" value={fmt(item.cost_price || item.price)} />
              <div style={{ width:1, background:C.bd, margin:'0 16px', alignSelf:'stretch' }} />
              <Stat label="在庫金額" value={(item.cost_price || item.price) ? fmt(Math.round((item.quantity || 0) * (item.cost_price || item.price))) : '—'} />
            </div>

            <Div />

            {/* 7 AI Analysis Buttons (4 + 3 grid) */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:6 }}>
              {AI_SECTIONS.slice(0, 4).map(s => {
                const cached = !!aiData[s.key] && !aiData[s.key]?.error;
                return (
                  <button key={s.key} onClick={() => fetchSection(s.key)} style={{
                    background: cached ? C.card : '#F6F4F0', border: `1px solid ${cached ? C.gold : C.bd}`,
                    borderRadius:10, padding:'10px 4px', cursor:'pointer', textAlign:'center', position:'relative',
                  }}>
                    {cached && <div style={{ position:'absolute', top:5, right:5, width:5, height:5, borderRadius:'50%', background:C.gold }} />}
                    <div style={{ fontSize:10, fontWeight:600, color:s.color, fontFamily:F, letterSpacing:0.3 }}>{s.label}</div>
                  </button>
                );
              })}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
              {AI_SECTIONS.slice(4).map(s => {
                const cached = !!aiData[s.key] && !aiData[s.key]?.error;
                return (
                  <button key={s.key} onClick={() => fetchSection(s.key)} style={{
                    background: cached ? C.card : '#F6F4F0', border: `1px solid ${cached ? C.gold : C.bd}`,
                    borderRadius:10, padding:'10px 4px', cursor:'pointer', textAlign:'center', position:'relative',
                  }}>
                    {cached && <div style={{ position:'absolute', top:5, right:5, width:5, height:5, borderRadius:'50%', background:C.gold }} />}
                    <div style={{ fontSize:10, fontWeight:600, color:s.color, fontFamily:F, letterSpacing:0.3 }}>{s.label}</div>
                  </button>
                );
              })}
            </div>

            {/* Pairing History */}
            <div style={{ marginTop:16 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:600, fontFamily:F, color:C.tx, display:'flex', alignItems:'center', gap:4 }}>🍷 PAIRING HISTORY</div>
                <button onClick={() => setShowPairingForm(!showPairingForm)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:C.acc, fontFamily:F }}>
                  {showPairingForm ? '閉じる' : '＋記録を追加'}
                </button>
              </div>
              {showPairingForm && (
                <div style={{ padding:12, background:'#F6F4F0', borderRadius:6, marginBottom:8 }}>
                  <input type="date" value={pairingForm.date} onChange={e => setPairingForm(f => ({ ...f, date: e.target.value }))}
                    style={{ width:'100%', padding:'6px 8px', border:`1px solid ${C.bd}`, borderRadius:4, fontSize:12, fontFamily:F, marginBottom:6, boxSizing:'border-box' }} />
                  <input placeholder="料理名 *" value={pairingForm.dish} onChange={e => setPairingForm(f => ({ ...f, dish: e.target.value }))}
                    style={{ width:'100%', padding:'6px 8px', border:`1px solid ${C.bd}`, borderRadius:4, fontSize:12, fontFamily:F, marginBottom:6, boxSizing:'border-box' }} />
                  <input placeholder="説明" value={pairingForm.description} onChange={e => setPairingForm(f => ({ ...f, description: e.target.value }))}
                    style={{ width:'100%', padding:'6px 8px', border:`1px solid ${C.bd}`, borderRadius:4, fontSize:12, fontFamily:F, marginBottom:6, boxSizing:'border-box' }} />
                  <input placeholder="スタッフ" value={pairingForm.staff} onChange={e => setPairingForm(f => ({ ...f, staff: e.target.value }))}
                    style={{ width:'100%', padding:'6px 8px', border:`1px solid ${C.bd}`, borderRadius:4, fontSize:12, fontFamily:F, marginBottom:6, boxSizing:'border-box' }} />
                  <button onClick={addPairing} style={{ width:'100%', padding:8, background:C.acc, color:'#fff', border:'none', borderRadius:4, fontSize:12, fontWeight:600, fontFamily:F, cursor:'pointer' }}>追加</button>
                </div>
              )}
              {pairings.length === 0 ? (
                <div style={{ fontSize:11, color:C.sub, fontFamily:F, padding:'8px 0' }}>ペアリング記録なし</div>
              ) : pairings.map(p => (
                <div key={p.id} style={{ padding:'8px 0', borderBottom:`1px solid ${C.bd}` }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ fontSize:13, fontWeight:500, fontFamily:F, color:C.tx }}>{p.dish}</div>
                    <div style={{ fontSize:10, color:C.sub, fontFamily:F }}>{p.date}</div>
                  </div>
                  {p.description && <div style={{ fontSize:11, color:C.sub, fontFamily:F, marginTop:2 }}>{p.description}</div>}
                  {p.staff && <div style={{ fontSize:10, color:'#B0AA9C', fontFamily:F, marginTop:2 }}>by {p.staff}</div>}
                </div>
              ))}
            </div>

            <Div />

            {/* Tasting Comments */}
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div style={{ fontSize:12, fontWeight:600, fontFamily:F, color:C.tx, display:'flex', alignItems:'center', gap:4 }}>💬 TASTING COMMENTS</div>
                <button onClick={() => setShowCommentInput(!showCommentInput)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:11, color:C.acc, fontFamily:F }}>
                  {showCommentInput ? '閉じる' : '＋コメント追加'}
                </button>
              </div>
              {showCommentInput && (
                <div style={{ padding:12, background:'#F6F4F0', borderRadius:6, marginBottom:8 }}>
                  <textarea placeholder="コメント *" value={commentText} onChange={e => setCommentText(e.target.value)}
                    style={{ width:'100%', padding:'6px 8px', border:`1px solid ${C.bd}`, borderRadius:4, fontSize:12, fontFamily:F, minHeight:50, resize:'vertical', marginBottom:6, boxSizing:'border-box' }} />
                  <input placeholder="名前（匿名）" value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)}
                    style={{ width:'100%', padding:'6px 8px', border:`1px solid ${C.bd}`, borderRadius:4, fontSize:12, fontFamily:F, marginBottom:6, boxSizing:'border-box' }} />
                  <button onClick={addComment} style={{ width:'100%', padding:8, background:C.acc, color:'#fff', border:'none', borderRadius:4, fontSize:12, fontWeight:600, fontFamily:F, cursor:'pointer' }}>追加</button>
                </div>
              )}
              {comments.length === 0 ? (
                <div style={{ fontSize:11, color:C.sub, fontFamily:F, padding:'8px 0' }}>コメントなし</div>
              ) : comments.map(c => (
                <div key={c.id} style={{ padding:'8px 0', borderBottom:`1px solid ${C.bd}` }}>
                  <div style={{ fontSize:13, fontFamily:F, color:C.tx, lineHeight:1.5 }}>{c.text}</div>
                  <div style={{ fontSize:10, color:'#B0AA9C', fontFamily:F, marginTop:2 }}>{c.author || '匿名'} · {new Date(c.created_at).toLocaleDateString('ja-JP')}</div>
                </div>
              ))}
            </div>

            {/* Quantity Adjuster Bar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginTop:16, padding:'12px 0', background:'#F6F4F0', borderRadius:8 }}>
              <button onClick={() => adjustQty(-1)} style={{ width:40, height:40, borderRadius:'50%', border:`1px solid ${C.bd}`, background:C.card, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.red }}>−</button>
              <div style={{ textAlign:'center', minWidth:60 }}>
                <div style={{ fontSize:9, color:C.sub, textTransform:'uppercase', letterSpacing:1, fontFamily:F }}>数量</div>
                <div style={{ fontSize:22, fontWeight:700, fontFamily:F, color:C.tx }}>{item.quantity || 0}</div>
              </div>
              <button onClick={() => adjustQty(1)} style={{ width:40, height:40, borderRadius:'50%', border:`1px solid ${C.bd}`, background:C.card, fontSize:18, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:C.green }}>+</button>
            </div>

            {/* Delete confirmation */}
            {confirmDel ? (
              <div style={{ marginTop:12, padding:14, background:'rgba(181,61,31,0.06)', border:'1px solid rgba(181,61,31,0.2)', borderRadius:4 }}>
                <div style={{ fontSize:12, fontWeight:500, color:C.red, marginBottom:8 }}>このアイテムを削除しますか？</div>
                <div style={{ display:'flex', gap:8 }}>
                  <button onClick={() => setConfirmDel(false)} style={{ flex:1, padding:10, background:C.card, border:`1px solid ${C.bd}`, borderRadius:2, fontSize:12, cursor:'pointer', fontFamily:F }}>キャンセル</button>
                  <button onClick={() => onDelete(item.id)} style={{ flex:1, padding:10, background:C.red, color:'#fff', border:'none', borderRadius:2, fontSize:12, fontWeight:500, cursor:'pointer', fontFamily:F }}>削除する</button>
                </div>
              </div>
            ) : (
              /* Edit / Delete / Close buttons */
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                <button onClick={() => setEditing(true)} style={{ flex:1, padding:14, background:C.card, color:C.acc, border:`1px solid ${C.bd}`, borderRadius:2, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:F }}>編集</button>
                <button onClick={() => setConfirmDel(true)} style={{ padding:'14px 16px', background:C.card, color:C.red, border:`1px solid ${C.bd}`, borderRadius:2, fontSize:13, cursor:'pointer', fontFamily:F }}>削除</button>
                <button onClick={onClose} style={{ flex:1, padding:14, background:C.tx, color:C.card, border:'none', borderRadius:2, fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:F }}>閉じる</button>
              </div>
            )}
          </div>
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
  const [subViewStack, setSubViewStack] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPhotoImport, setShowPhotoImport] = useState(false);
  const [showPhotoRemoval, setShowPhotoRemoval] = useState(false);
  const [showCSVExport, setShowCSVExport] = useState(false);
  const [showManualRemoval, setShowManualRemoval] = useState(false);
  const [toast, setToast] = useState('');
  const [showAI, setShowAI] = useState(false);
  const [replenishData, setReplenishData] = useState(null);
  const [homeKey, setHomeKey] = useState(0); // for refreshing home view

  useEffect(() => {
    if (!ok) return;
    fetch('/api/stores').then(r => r.json()).then(d => Array.isArray(d) ? setStores(d) : setStores([])).catch(() => {});
    fetch('/api/categories').then(r => r.json()).then(d => Array.isArray(d) ? setCategories(d) : setCategories([])).catch(() => {});
  }, [ok]);

  const subView = subViewStack.length > 0 ? subViewStack[subViewStack.length - 1] : null;
  const navigate = (type, params = {}) => {
    if (type === 'add') { setShowAdd(true); return; }
    setSubViewStack(prev => [...prev, { type, params }]);
  };
  const goBack = () => {
    setSubViewStack(prev => {
      if (prev.length <= 1) { setHomeKey(k => k + 1); return []; }
      return prev.slice(0, -1);
    });
  };
  const openWineList = (storeId, categoryId) => {
    setSubViewStack([{ type: 'wine-list', params: { store: storeId, category: categoryId } }]);
  };
  const openWineListPrint = (storeId) => {
    setSubViewStack([{ type: 'wine-list-print', params: storeId ? { store: storeId } : {} }]);
  };
  const openAIDiagnosis = (storeId, mode = 'stock') => {
    setSubViewStack([{ type: 'ai-diagnosis', params: { store: storeId, mode } }]);
  };

  const saveItem = async (id, updates) => {
    const res = await fetch(`/api/beverages/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      setToast(`保存エラー: ${err.error || res.status}`);
      return;
    }
    if (selected?.id === id) {
      const r = await fetch(`/api/beverages/${id}`);
      if (r.ok) {
        const updated = await r.json();
        setSelected(updated);
        // Check replenishment when quantity hits 0
        if (updates.quantity === 0 && updated.store_id) {
          try {
            const rr = await fetch('/api/replenish', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ beverage_id: id, store_id: updated.store_id }),
            });
            const rd = await rr.json();
            if (rd.needsAction) setReplenishData(rd);
          } catch(e) {}
        }
      }
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
    if (subView?.type === 'stock-categories') {
      return <StockCategoryView storeId={subView.params.store} stores={stores} categories={categories}
        onBack={goBack} onNavigate={navigate} />;
    }
    if (subView?.type === 'ai-diagnosis') {
      return <AIDiagnosisView storeId={subView.params.store} stores={stores} mode={subView.params.mode || 'stock'} onBack={goBack} />;
    }
    if (subView?.type === 'list-items') {
      return <ItemListPage title={subView.params.title} storeId={subView.params.store} categoryId={subView.params.category}
        categoriesParam={subView.params.categories}
        stores={stores} categories={categories} onBack={goBack} onSelect={setSelected} onAdd={() => setShowAdd(true)} />;
    }
    if (subView?.type === 'wine-list') {
      return <WineListManager storeId={subView.params.store} categoryId={subView.params.category}
        stores={stores} categories={categories} onBack={goBack} onRefreshHome={() => setHomeKey(k => k + 1)}
        onStockZero={async (bevId, sid) => {
          try {
            const r = await fetch('/api/replenish', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ beverage_id: bevId, store_id: sid }),
            });
            const d = await r.json();
            if (d.needsAction) setReplenishData(d);
          } catch(e) {}
        }} />;
    }
    if (subView?.type === 'wine-list-reconcile') {
      return <WineListReconcile storeId={subView.params?.store} stores={stores} onBack={goBack}
        onDone={() => setHomeKey(k => k + 1)} />;
    }
    if (subView?.type === 'wine-list-print') {
      return <WineListPrint storeId={subView.params?.store} stores={stores} onBack={goBack}
        onReconcile={(sid) => navigate('wine-list-reconcile', { store: sid })} />;
    }
    switch (tab) {
      case 'home': return <HomeView key={homeKey} stores={stores} categories={categories} onNavigate={navigate} onWineList={openWineList} onWineListPrint={openWineListPrint} onShowAI={() => setShowAI(true)} onAIDiagnosis={openAIDiagnosis} />;
      case 'search': return <GlobalSearch stores={stores} onSelect={setSelected} />;
      case 'stock': return <StockManager stores={stores} onNavigate={navigate} onImport={() => setShowImport(true)} onPhotoImport={() => setShowPhotoImport(true)} onPhotoRemoval={() => setShowPhotoRemoval(true)} onManualRemoval={() => setShowManualRemoval(true)} onCSVExport={() => setShowCSVExport(true)} />;
      case 'list': return <WineListStorePicker stores={stores} categories={categories} onOpenStore={openWineList} onOpenPrint={openWineListPrint} onNavigate={navigate} />;
      case 'settings': return (
        <div style={{ padding:'16px 16px 100px' }}>
          <div style={{ fontSize:18, fontWeight:400, letterSpacing:2, color:C.tx, fontFamily:EL, marginBottom:16 }}>設定</div>

          {/* Wine List Print */}
          <button onClick={() => openWineListPrint()} style={{
            width:'100%', padding:14, borderRadius:2, border:`1px solid ${C.bd}`,
            background:C.card, fontSize:13, fontFamily:F, cursor:'pointer', color:C.tx,
            display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8,
          }}>
            <span style={{ display:'flex', alignItems:'center', gap:8 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={C.acc} strokeWidth={1.5}><path d="M6 2h12v6l-4 2 4 2v6H6v-6l4-2-4-2z"/><path d="M6 18H2v4h20v-4h-4"/></svg>
              ワインリスト 印刷・編集
            </span>
            <span style={{ color:C.sub, fontSize:11 }}>全店舗 →</span>
          </button>

          {/* Store Management */}
          <button style={{
            width:'100%', padding:14, borderRadius:2, border:`1px solid ${C.bd}`,
            background:C.card, fontSize:13, fontFamily:F, cursor:'default', color:C.tx,
            display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, opacity:0.6,
          }}>
            <span style={{ display:'flex', alignItems:'center', gap:8 }}>🏪 店舗管理</span>
            <span style={{ color:C.sub, fontSize:10 }}>準備中</span>
          </button>

          {/* Admin Registration */}
          <button style={{
            width:'100%', padding:14, borderRadius:2, border:`1px solid ${C.bd}`,
            background:C.card, fontSize:13, fontFamily:F, cursor:'default', color:C.tx,
            display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, opacity:0.6,
          }}>
            <span style={{ display:'flex', alignItems:'center', gap:8 }}>👤 管理者登録</span>
            <span style={{ color:C.sub, fontSize:10 }}>準備中</span>
          </button>

          {/* Tasting Comment Name */}
          <button style={{
            width:'100%', padding:14, borderRadius:2, border:`1px solid ${C.bd}`,
            background:C.card, fontSize:13, fontFamily:F, cursor:'default', color:C.tx,
            display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8, opacity:0.6,
          }}>
            <span style={{ display:'flex', alignItems:'center', gap:8 }}>✍️ テイスティングコメント名前選択</span>
            <span style={{ color:C.sub, fontSize:10 }}>準備中</span>
          </button>

          {/* Per-store Wine List Sort Settings */}
          <div style={{ marginBottom:8, border:`1px solid ${C.bd}`, borderRadius:2, overflow:'hidden' }}>
            <div style={{
              padding:14, background:C.card, fontSize:13, fontFamily:F, color:C.tx,
              display:'flex', alignItems:'center', gap:8, borderBottom:`1px solid ${C.bd}`,
            }}>📋 ワインリスト掲載順ロジック</div>
            {stores.filter(s => s.id !== 'burgundy').map(s => {
              const key = `wl_sort_${s.id}`;
              const saved = typeof window !== 'undefined' ? localStorage.getItem(key) || 'category' : 'category';
              return (
                <div key={s.id} style={{ padding:'8px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:`1px solid ${C.bd}`, background:C.bg }}>
                  <span style={{ fontSize:12, color:C.tx, fontFamily:F }}>{s.name}</span>
                  <select defaultValue={saved} onChange={e => { localStorage.setItem(key, e.target.value); }}
                    style={{ padding:'4px 8px', border:`1px solid ${C.bd}`, borderRadius:4, fontSize:11, fontFamily:F, background:C.card }}>
                    <option value="category">カテゴリ → 価格順</option>
                    <option value="price_desc">価格 高い順</option>
                    <option value="price_asc">価格 安い順</option>
                    <option value="producer">生産者 → 価格順</option>
                    <option value="custom">カスタム順</option>
                  </select>
                </div>
              );
            })}
          </div>

          <div style={{ height:16 }} />
          <button onClick={logout} style={{ width:'100%', padding:14, borderRadius:2, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer', color:C.red }}>ログアウト</button>
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{ maxWidth:430, margin:'0 auto', minHeight:'100vh', background:C.bg, fontFamily:F, position:'relative' }}>
      {renderView()}
      <BottomNav tab={tab} onTab={(t) => { setTab(t); setSubViewStack([]); }} />
      {selected && <DetailModal item={selected} stores={stores} categories={categories} onClose={() => setSelected(null)} onSave={saveItem} onDelete={deleteItem} />}
      {showAdd && <AddItemForm stores={stores} categories={categories} onClose={() => setShowAdd(false)} onAdd={addItem} />}
      {showImport && <ExcelImport stores={stores} categories={categories} onClose={() => setShowImport(false)} onImported={() => setToast('インポート完了')} />}
      {showPhotoImport && <PhotoImport stores={stores} categories={categories} onClose={() => setShowPhotoImport(false)} onImported={() => setToast('写真入庫完了')} />}
      {showPhotoRemoval && <PhotoRemoval stores={stores} onClose={() => setShowPhotoRemoval(false)} onRemoved={() => setToast('出庫しました')}
        onStockZero={async (bevId, storeId) => {
          try {
            const r = await fetch('/api/replenish', {
              method: 'POST', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ beverage_id: bevId, store_id: storeId }),
            });
            const d = await r.json();
            if (d.needsAction) setReplenishData(d);
          } catch(e) {}
        }} />}
      {showCSVExport && <CSVExport stores={stores} onClose={() => setShowCSVExport(false)} />}
      {showManualRemoval && <ManualRemoval stores={stores} onClose={() => setShowManualRemoval(false)} onRemoved={() => setToast('出庫しました')}
        onStockZero={async (bevId, sid) => {
          try {
            const r = await fetch('/api/replenish', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ beverage_id: bevId, store_id: sid }) });
            const d = await r.json();
            if (d.needsAction) setReplenishData(d);
          } catch(e) {}
        }} />}
      {showAI && <AISommelier onClose={() => setShowAI(false)} />}
      {replenishData && <ReplenishAlert data={replenishData} stores={stores}
        onClose={() => setReplenishData(null)}
        onReplenish={() => { setReplenishData(null); setToast('補充しました'); setHomeKey(k => k + 1); }} />}
      <Toast msg={toast} onClose={() => setToast('')} />
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        @keyframes slideDown { from { transform: translateY(0); } to { transform: translateY(100%); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        input:focus, select:focus, textarea:focus { border-color: ${C.acc} !important; outline: none; }
      `}</style>
    </div>
  );
}
