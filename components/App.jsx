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

// ===== fmtY — format yen values (万/億) =====
const fmtY = (n) => {
  if (!n && n !== 0) return '-';
  if (n >= 1e8) return (n / 1e8).toFixed(1) + '億';
  if (n >= 1e4) return Math.round(n / 1e4).toLocaleString() + '万';
  return Math.round(n).toLocaleString();
};

// ===== HomeView — matches Beverage Compass UI =====
function HomeView({ stores, categories, onNavigate, onWineList, onWineListPrint }) {
  const [openSection, setOpenSection] = useState(null);
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

  const toggleSection = (sectionId) => {
    setOpenSection(prev => prev === sectionId ? null : sectionId);
  };

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
            <div style={{ fontSize:18, fontWeight:700, color:'#8B6914', fontFamily:F, marginTop:2 }}>{fmtY(Math.round(stats?.totalValue || 0))}</div>
          </div>
        </div>
      </div>

      {/* Store Cards */}
      {stores.map(store => {
        const storeStats = stats?.stores?.[store.id] || null;
        const storeWlStats = wlStats?.stores?.[store.id] || null;
        const hasData = (storeStats && storeStats.total > 0) || (storeWlStats && storeWlStats.total > 0);
        const invSec = 'inv-' + store.id;
        const wlSec = 'wl-' + store.id;
        const invOpen = openSection === invSec;
        const wlOpen = openSection === wlSec;

        return (
          <div key={store.id} style={{ marginBottom:8, borderRadius:2, overflow:'hidden', border:`1px solid ${C.bd}` }}>
            {/* Store Header */}
            <div style={{
              background:'linear-gradient(135deg, #EDE8DF 0%, #E4DED4 100%)',
              padding:'14px 16px', color:'#4A4440',
              display:'flex', justifyContent:'space-between', alignItems:'flex-start',
            }}>
              <div>
                <div style={{ fontSize:20, fontWeight:400, fontFamily:getStoreFont(store), letterSpacing:'3px' }}>
                  {getStoreName(store)}
                </div>
                <div style={{ fontSize:10, fontWeight:400, color:'rgba(74,68,64,0.5)', fontFamily:EL, letterSpacing:'1.5px', marginTop:3 }}>
                  {getStoreSubName(store)}
                </div>
              </div>
              {hasData && (
                <div style={{ textAlign:'right', flexShrink:0, marginLeft:12 }}>
                  {storeStats && storeStats.total > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end' }}>
                      <span style={{ fontSize:11, color:'rgba(74,68,64,0.55)', fontFamily:F }}>{storeStats.total}種</span>
                      <span style={{ fontSize:11, color:'rgba(74,68,64,0.55)', fontFamily:F }}>{Math.round(storeStats.totalQty).toLocaleString()}本</span>
                      <span style={{ fontSize:11, color:C.acc, fontWeight:600, fontFamily:F }}>{fmtY(Math.round(storeStats.totalValue))}</span>
                    </div>
                  )}
                  {storeWlStats && storeWlStats.total > 0 && (
                    <div style={{ display:'flex', alignItems:'center', gap:6, justifyContent:'flex-end', marginTop:3 }}>
                      <span style={{ fontSize:10, color:'rgba(74,68,64,0.4)', fontFamily:F }}>リスト {storeWlStats.total}種</span>
                      {storeWlStats.totalValue > 0 && <span style={{ fontSize:10, color:C.acc, fontWeight:600, fontFamily:F }}>{fmtY(Math.round(storeWlStats.totalValue))}</span>}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Accordions */}
            {hasData && (
              <div style={{ background:C.card }}>
                {/* 在庫 Accordion */}
                <div>
                  <div onClick={() => toggleSection(invSec)} style={{
                    padding:'9px 16px', cursor:'pointer', display:'flex', alignItems:'center',
                    borderBottom:`1px solid ${C.bd}`,
                  }}>
                    <div style={{ fontSize:12, fontWeight:500, color:C.sub, flex:1 }}>在庫</div>
                    <Chev open={invOpen} />
                  </div>
                  {invOpen && (
                    <div style={{ padding:'8px 12px 10px' }}>
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                        {categories.filter(c => !c.parent_id).map(cat => {
                          const catStats = storeStats.categories?.[cat.id];
                          if (!catStats || catStats.count === 0) return null;
                          return (
                            <CatCard key={cat.id} label={cat.name} count={catStats.count} qty={catStats.qty}
                              onClick={() => onNavigate('list-items', { store: store.id, category: cat.id, title: `${store.name} · ${cat.name}` })} />
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* リスト Accordion */}
                <div>
                  <div onClick={() => toggleSection(wlSec)} style={{
                    padding:'9px 16px', cursor:'pointer', display:'flex', alignItems:'center',
                    borderBottom: wlOpen ? `1px solid ${C.bd}` : 'none',
                  }}>
                    <div style={{ fontSize:12, fontWeight:500, color:C.sub, flex:1 }}>
                      リスト{storeWlStats?.total > 0 ? ` (${storeWlStats.total})` : ''}
                    </div>
                    <Chev open={wlOpen} />
                  </div>
                  {wlOpen && (
                    <div style={{ padding:'8px 12px 10px' }}>
                      {storeWlStats && storeWlStats.total > 0 ? (
                        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
                          {categories.filter(c => !c.parent_id).map(cat => {
                            const catWl = storeWlStats.categories?.[cat.id];
                            if (!catWl || catWl.count === 0) return null;
                            return (
                              <CatCard key={cat.id} label={cat.name} count={catWl.count} qty={catWl.count}
                                onClick={() => onWineList(store.id, cat.id)} />
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize:12, color:C.sub, textAlign:'center', padding:'8px 0' }}>リストにアイテムなし</div>
                      )}
                      <div style={{ display:'flex', gap:6, marginTop:10 }}>
                        <button onClick={() => onWineList(store.id)} style={{
                          flex:1, padding:'10px', borderRadius:2,
                          border:`1px solid ${C.acc}`, background:'transparent',
                          fontSize:12, fontFamily:F, color:C.acc, cursor:'pointer', fontWeight:600,
                        }}>リスト管理</button>
                        <button onClick={() => onWineListPrint(store.id)} style={{
                          flex:1, padding:'10px', borderRadius:2,
                          border:`1px solid ${C.tx}`, background:C.tx,
                          fontSize:12, fontFamily:F, color:'#fff', cursor:'pointer', fontWeight:500,
                        }}>ワインリスト印刷</button>
                      </div>
                    </div>
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
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background: storeColor[item.store_id] || C.acc, opacity:0.5 }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingLeft:4 }}>
              <div style={{ flex:1, minWidth:0 }}>
                {item.producer && <div style={{ fontSize:9, color:'#A09A8C', fontFamily:F, letterSpacing:0.3 }}>{item.producer}</div>}
                <div style={{ fontSize:14, fontWeight:600, fontFamily:EL, color:C.tx, lineHeight:1.35, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}{item.vintage && <span style={{ fontWeight:400, fontSize:12, color:'#8A8478', marginLeft:3, fontFamily:F }}>{item.vintage}</span>}</div>
                {item.name_kana && item.name_kana !== item.name && <div style={{ fontSize:10, color:'#B0AA9C', fontFamily:"'Noto Sans JP',sans-serif", marginTop:1 }}>{item.name_kana}</div>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0, marginLeft:10 }}>
                <QBadge q={item.quantity} />
                {item.price != null && <span style={{ fontSize:10, color:'#B0AA9C', fontFamily:F }}>{fmt(item.price)}</span>}
              </div>
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

// ===== WineListPrint =====
function WineListPrint({ storeId, stores, onBack }) {
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
function WineListManager({ storeId, categoryId, stores, categories, onBack, onRefreshHome }) {
  const [wlItems, setWlItems] = useState([]);
  const [invItems, setInvItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list'); // list | add
  const [searchQ, setSearchQ] = useState('');
  const [adding, setAdding] = useState(null); // beverage being added
  const [addPrice, setAddPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');
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
          ) : wlItems.map(wl => {
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
                        {wl.sell_price ? fmt(wl.sell_price) : (bev.price ? fmt(bev.price) : '-')}
                      </div>
                      {bev.price && wl.sell_price && wl.sell_price !== bev.price && (
                        <div style={{ fontSize:10, color:C.sub, textDecoration:'line-through' }}>{fmt(bev.price)}</div>
                      )}
                      <QBadge q={bev.quantity} />
                    </div>
                  </div>
                  <button onClick={() => removeFromList(wl.id, bev.name)}
                    style={{ flexShrink:0, marginLeft:8, padding:'6px 10px', borderRadius:2, border:`1px solid ${C.bd}`,
                      background:'transparent', fontSize:11, color:C.sub, cursor:'pointer', fontFamily:F }}>外す</button>
                </div>
              </div>
            );
          })
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

// ===== StockManager =====
function StockManager({ onNavigate, onImport, onPhotoImport, onPhotoRemoval, stores }) {
  const exportCSV = () => {
    const url = `/api/export?format=csv`;
    window.open(url, '_blank');
  };

  const actions = [
    { icon: '📦', title: '在庫一覧', desc: '全アイテムを閲覧・管理', action: () => onNavigate('list-items', { title: '全在庫一覧' }) },
    { icon: '📷', title: '写真で入庫', desc: '納品書を撮影→AI読取→在庫追加', action: () => onPhotoImport() },
    { icon: '🍷', title: '写真で出庫', desc: 'ボトル撮影→AI識別→在庫-1', action: () => onPhotoRemoval() },
    { icon: '➕', title: '新規追加', desc: 'アイテムを手動で追加', action: () => onNavigate('add') },
    { icon: '📊', title: 'Excel取込', desc: 'Excelファイルから一括追加', action: () => onImport() },
    { icon: '📋', title: 'CSV出力', desc: '在庫データをCSVでエクスポート', action: exportCSV },
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
            <div style={{ position:'absolute', left:0, top:0, bottom:0, width:3, background: storeColor[item.store_id] || C.acc, opacity:0.5 }} />
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', paddingLeft:4 }}>
              <div style={{ flex:1, minWidth:0 }}>
                {item.producer && <div style={{ fontSize:9, color:'#A09A8C', fontFamily:F, letterSpacing:0.3, marginBottom:1 }}>{item.producer}</div>}
                {(item.region || item.wc_categories?.name) && <div style={{ fontSize:9, color:'#B0AA9C', fontFamily:F, marginTop:1 }}>{item.region || item.wc_categories?.name || ''}</div>}
                <div style={{ fontSize:14, fontWeight:600, fontFamily:EL, color:C.tx, lineHeight:1.35 }}>{item.name}{item.vintage && <span style={{ fontWeight:400, fontSize:12, color:'#8A8478', marginLeft:3, fontFamily:F }}>{item.vintage}</span>}</div>
                {item.name_kana && item.name_kana !== item.name && <div style={{ fontSize:10, color:'#B0AA9C', fontFamily:"'Noto Sans JP',sans-serif", marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name_kana}</div>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:3, flexShrink:0, marginLeft:10 }}>
                <QBadge q={item.quantity} />
                {item.price != null && <span style={{ fontSize:10, color:'#B0AA9C', fontFamily:F }}>{fmt(item.price)}</span>}
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
              <Stat label="在庫金額" value={item.price ? fmt(Math.round((item.quantity || 0) * item.price)) : '—'} />
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
  const [subView, setSubView] = useState(null);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPhotoImport, setShowPhotoImport] = useState(false);
  const [showPhotoRemoval, setShowPhotoRemoval] = useState(false);
  const [toast, setToast] = useState('');
  const [homeKey, setHomeKey] = useState(0); // for refreshing home view

  useEffect(() => {
    if (!ok) return;
    fetch('/api/stores').then(r => r.json()).then(d => Array.isArray(d) ? setStores(d) : setStores([])).catch(() => {});
    fetch('/api/categories').then(r => r.json()).then(d => Array.isArray(d) ? setCategories(d) : setCategories([])).catch(() => {});
  }, [ok]);

  const navigate = (type, params = {}) => {
    if (type === 'add') { setShowAdd(true); return; }
    setSubView({ type, params });
  };
  const goBack = () => { setSubView(null); setHomeKey(k => k + 1); };
  const openWineList = (storeId, categoryId) => {
    setSubView({ type: 'wine-list', params: { store: storeId, category: categoryId } });
  };
  const openWineListPrint = (storeId) => {
    setSubView({ type: 'wine-list-print', params: storeId ? { store: storeId } : {} });
  };

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
    if (subView?.type === 'wine-list') {
      return <WineListManager storeId={subView.params.store} categoryId={subView.params.category}
        stores={stores} categories={categories} onBack={goBack} onRefreshHome={() => setHomeKey(k => k + 1)} />;
    }
    if (subView?.type === 'wine-list-print') {
      return <WineListPrint storeId={subView.params?.store} stores={stores} onBack={goBack} />;
    }
    switch (tab) {
      case 'home': return <HomeView key={homeKey} stores={stores} categories={categories} onNavigate={navigate} onWineList={openWineList} onWineListPrint={openWineListPrint} />;
      case 'search': return <GlobalSearch stores={stores} onSelect={setSelected} />;
      case 'stock': return <StockManager stores={stores} onNavigate={navigate} onImport={() => setShowImport(true)} onPhotoImport={() => setShowPhotoImport(true)} onPhotoRemoval={() => setShowPhotoRemoval(true)} />;
      case 'list': return <WineListStorePicker stores={stores} categories={categories} onOpenStore={openWineList} onOpenPrint={openWineListPrint} onNavigate={navigate} />;
      case 'settings': return (
        <div style={{ padding:'16px 16px 100px' }}>
          <div style={{ fontSize:18, fontWeight:400, letterSpacing:2, color:C.tx, fontFamily:EL, marginBottom:16 }}>設定</div>
          {/* Wine List Print — global entry */}
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
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        input:focus, select:focus, textarea:focus { border-color: ${C.acc} !important; outline: none; }
      `}</style>
    </div>
  );
}
