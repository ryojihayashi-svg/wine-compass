"use client";
import { useState, useEffect, useCallback, useRef } from 'react';
import { C, F, SR, T, fmt, vintageLabel } from '../lib/constants';

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

// ===== Login Screen =====
function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('');
  const [err, setErr] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!pin || loading) return;
    setLoading(true); setErr(false);
    const ok = await onLogin(pin);
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
              if (next.length === 4) setTimeout(() => { setPin(next); submit(); }, 100);
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
  return <div style={{ position:'fixed', bottom:80, left:'50%', transform:'translateX(-50%)', background:C.tx, color:'#fff', padding:'10px 20px', borderRadius:20, fontSize:13, fontFamily:F, zIndex:9999, whiteSpace:'nowrap' }}>{msg}</div>;
}

// ===== Overlay =====
function Overlay({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed', inset:0, zIndex:1000 }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,0.3)' }} onClick={onClose} />
      <div style={{ position:'absolute', bottom:0, left:0, right:0, maxHeight:'92vh', background:C.card, borderRadius:'16px 16px 0 0', overflow:'auto', animation:'slideUp 0.3s ease' }}>
        <div style={{ position:'sticky', top:0, background:C.card, padding:'16px 20px', borderBottom:`1px solid ${C.bd}`, display:'flex', justifyContent:'space-between', alignItems:'center', zIndex:1 }}>
          <span style={{ fontSize:16, fontWeight:600, fontFamily:SR, color:C.tx }}>{title}</span>
          <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, color:C.sub, cursor:'pointer' }}>✕</button>
        </div>
        <div style={{ padding:20 }}>{children}</div>
      </div>
    </div>
  );
}

// ===== Beverage Card =====
function BevCard({ item, onClick }) {
  return (
    <div onClick={() => onClick(item)} style={{
      background:C.card, borderRadius:10, padding:'14px 16px', marginBottom:10, cursor:'pointer',
      border:`1px solid ${C.bd}`, transition:'box-shadow 0.2s',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8 }}>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontSize:14, fontWeight:500, fontFamily:SR, color:C.tx, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.name}</div>
          <div style={{ fontSize:12, color:C.sub, marginTop:2, fontFamily:F }}>{item.producer || ''}{item.vintage ? ` ${item.vintage}` : ''}</div>
        </div>
        <div style={{ textAlign:'right', flexShrink:0 }}>
          <div style={{ fontSize:13, fontWeight:600, color:C.tx, fontFamily:F }}>{fmt(item.price)}</div>
          <div style={{
            fontSize:11, marginTop:4, padding:'2px 8px', borderRadius:10, fontFamily:F, fontWeight:500,
            background: item.quantity > 0 ? '#E8F5E9' : '#FFEBEE',
            color: item.quantity > 0 ? C.green : C.red,
          }}>{item.quantity}{item.quantity > 0 ? '本' : ''}</div>
        </div>
      </div>
      {item.region && <div style={{ fontSize:11, color:C.sub, marginTop:6, fontFamily:F }}>{item.region}{item.appellation ? ` · ${item.appellation}` : ''}</div>}
    </div>
  );
}

// ===== Beverage Detail =====
function BevDetail({ item, stores, categories, onClose, onSave, onDelete }) {
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
    if (Object.keys(updates).length > 0) {
      await onSave(item.id, updates);
    }
    setEditing(false);
    setSaving(false);
  };

  const Field = ({ label, k, type, opts }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, color:C.sub, marginBottom:4, fontFamily:F }}>{label}</div>
      {editing ? (
        opts ? (
          <select value={form[k] || ''} onChange={e => set(k, e.target.value === '' ? null : (type === 'number' ? Number(e.target.value) : e.target.value))}
            style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:6, fontSize:14, fontFamily:F, background:C.card }}>
            <option value="">-</option>
            {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        ) : type === 'textarea' ? (
          <textarea value={form[k] || ''} onChange={e => set(k, e.target.value)}
            style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:6, fontSize:14, fontFamily:F, minHeight:60, resize:'vertical', boxSizing:'border-box' }} />
        ) : (
          <input type={type || 'text'} value={form[k] ?? ''} onChange={e => set(k, type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
            style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:6, fontSize:14, fontFamily:F, boxSizing:'border-box' }} />
        )
      ) : (
        <div style={{ fontSize:14, color:C.tx, fontFamily: k === 'name' ? SR : F }}>{
          k === 'price' || k === 'cost_price' ? fmt(item[k]) :
          k === 'vintage' ? vintageLabel(item[k]) :
          k === 'size_ml' ? (item[k] ? `${item[k]}ml` : '-') :
          k === 'store_id' ? (stores.find(s => s.id === item[k])?.name || item[k]) :
          k === 'category_id' ? (categories.find(c => c.id === item[k])?.name || '-') :
          item[k] || '-'
        }</div>
      )}
    </div>
  );

  const catOpts = categories.map(c => ({ value: c.id, label: (c.parent_id ? '  ' : '') + c.name }));
  const storeOpts = stores.map(s => ({ value: s.id, label: s.name }));

  return (
    <Overlay open={true} onClose={onClose} title={editing ? '編集' : item.name}>
      {/* Quantity adjuster */}
      {!editing && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, padding:'12px 0 20px', borderBottom:`1px solid ${C.bd}`, marginBottom:16 }}>
          <button onClick={() => onSave(item.id, { quantity: Math.max(0, item.quantity - 1) })}
            style={{ width:44, height:44, borderRadius:'50%', border:`1px solid ${C.bd}`, background:C.card, fontSize:20, cursor:'pointer', color:C.tx }}>−</button>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:32, fontWeight:600, fontFamily:F, color:C.tx }}>{item.quantity}</div>
            <div style={{ fontSize:11, color:C.sub }}>在庫数</div>
          </div>
          <button onClick={() => onSave(item.id, { quantity: item.quantity + 1 })}
            style={{ width:44, height:44, borderRadius:'50%', border:`1px solid ${C.bd}`, background:C.card, fontSize:20, cursor:'pointer', color:C.tx }}>+</button>
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

      <div style={{ display:'flex', gap:10, marginTop:20, paddingBottom:20 }}>
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} style={{ flex:1, padding:'12px', borderRadius:8, border:`1px solid ${C.bd}`, background:C.card, fontSize:14, fontFamily:F, cursor:'pointer' }}>キャンセル</button>
            <button onClick={save} disabled={saving} style={{ flex:1, padding:'12px', borderRadius:8, border:'none', background:C.acc, color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer' }}>{saving ? '...' : '保存'}</button>
          </>
        ) : (
          <>
            <button onClick={() => { if (confirm(`「${item.name}」を削除しますか？`)) onDelete(item.id); }}
              style={{ flex:1, padding:'12px', borderRadius:8, border:`1px solid ${C.red}`, background:'transparent', color:C.red, fontSize:14, fontFamily:F, cursor:'pointer' }}>削除</button>
            <button onClick={() => setEditing(true)} style={{ flex:1, padding:'12px', borderRadius:8, border:'none', background:C.acc, color:'#fff', fontSize:14, fontFamily:F, fontWeight:600, cursor:'pointer' }}>編集</button>
          </>
        )}
      </div>
    </Overlay>
  );
}

// ===== Add Item Form =====
function AddForm({ stores, categories, onClose, onAdd }) {
  const [form, setForm] = useState({ store_id: stores[0]?.id || '', quantity: 0, size_ml: 750 });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name || !form.store_id) return;
    setSaving(true);
    await onAdd(form);
    setSaving(false);
  };

  const Inp = ({ label, k, type, ph, opts }) => (
    <div style={{ marginBottom:14 }}>
      <div style={{ fontSize:11, color:C.sub, marginBottom:4, fontFamily:F }}>{label}</div>
      {opts ? (
        <select value={form[k] || ''} onChange={e => set(k, e.target.value === '' ? null : (type === 'number' ? Number(e.target.value) : e.target.value))}
          style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:6, fontSize:14, fontFamily:F, boxSizing:'border-box' }}>
          <option value="">-</option>
          {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : (
        <input type={type || 'text'} value={form[k] ?? ''} placeholder={ph} onChange={e => set(k, type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
          style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:6, fontSize:14, fontFamily:F, boxSizing:'border-box' }} />
      )}
    </div>
  );

  return (
    <Overlay open={true} onClose={onClose} title="新規追加">
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
        <div style={{ fontSize:11, color:C.sub, marginBottom:4, fontFamily:F }}>メモ</div>
        <textarea value={form.notes || ''} onChange={e => set('notes', e.target.value)}
          style={{ width:'100%', padding:'8px 10px', border:`1px solid ${C.bd}`, borderRadius:6, fontSize:14, fontFamily:F, minHeight:60, resize:'vertical', boxSizing:'border-box' }} />
      </div>
      <button onClick={save} disabled={saving || !form.name || !form.store_id}
        style={{ width:'100%', padding:'14px', borderRadius:8, border:'none', background: (form.name && form.store_id) ? C.acc : C.bd, color:'#fff', fontSize:15, fontFamily:F, fontWeight:600, cursor:'pointer', marginBottom:20 }}>
        {saving ? '保存中...' : '追加'}
      </button>
    </Overlay>
  );
}

// ===== Main App =====
export default function App() {
  const { ok, login, logout } = useAuth();
  const [lang] = useState('ja');
  const t = T[lang];

  // Data
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [storeFilter, setStoreFilter] = useState(null);
  const [catFilter, setCatFilter] = useState(null);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [stockFilter, setStockFilter] = useState(null); // null=all, true=in-stock

  // UI
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [toast, setToast] = useState('');
  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const PAGE_SIZE = 50;

  // Fetch stores & categories on mount
  useEffect(() => {
    if (!ok) return;
    fetch('/api/stores').then(r => r.json()).then(setStores).catch(() => {});
    fetch('/api/categories').then(r => r.json()).then(setCategories).catch(() => {});
  }, [ok]);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (storeFilter) p.set('store', storeFilter);
    if (catFilter) p.set('category', String(catFilter));
    if (query) p.set('q', query);
    if (stockFilter !== null) p.set('stock', String(stockFilter));
    p.set('page', String(page));
    p.set('limit', String(PAGE_SIZE));

    try {
      const r = await fetch('/api/beverages?' + p.toString());
      const data = await r.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch (e) {
      console.error(e);
      setItems([]);
      setTotal(0);
    }
    setLoading(false);
  }, [storeFilter, catFilter, query, page, stockFilter]);

  useEffect(() => { if (ok) fetchItems(); }, [ok, fetchItems]);

  // Debounced search
  const onSearch = (val) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(val);
      setPage(1);
    }, 300);
  };

  // CRUD operations
  const saveItem = async (id, updates) => {
    await fetch(`/api/beverages/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(updates) });
    await fetchItems();
    // Refresh selected item
    if (selected?.id === id) {
      const r = await fetch(`/api/beverages/${id}`);
      setSelected(await r.json());
    }
    setToast('保存しました');
  };

  const deleteItem = async (id) => {
    await fetch(`/api/beverages/${id}`, { method: 'DELETE' });
    setSelected(null);
    await fetchItems();
    setToast('削除しました');
  };

  const addItem = async (form) => {
    await fetch('/api/beverages', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowAdd(false);
    setPage(1);
    await fetchItems();
    setToast('追加しました');
  };

  // Category tree helpers
  const topCats = categories.filter(c => !c.parent_id);
  const subCats = (pid) => categories.filter(c => c.parent_id === pid);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!ok) return <LoginScreen onLogin={login} />;

  return (
    <div style={{ maxWidth:430, margin:'0 auto', minHeight:'100vh', background:C.bg, fontFamily:F, position:'relative' }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:100, background:C.bg, padding:'12px 16px 0' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div style={{ fontSize:15, fontWeight:600, letterSpacing:2, color:C.tx, fontFamily:SR }}>WINE COMPASS</div>
          <button onClick={logout} style={{ background:'none', border:'none', fontSize:12, color:C.sub, cursor:'pointer', fontFamily:F }}>{t.logout}</button>
        </div>

        {/* Search */}
        <div style={{ position:'relative', marginBottom:10 }}>
          <input ref={searchRef} type="text" placeholder={t.search}
            onChange={e => onSearch(e.target.value)}
            style={{ width:'100%', padding:'10px 12px 10px 36px', border:`1px solid ${C.bd}`, borderRadius:8, fontSize:14, fontFamily:F, background:C.card, boxSizing:'border-box', outline:'none' }} />
          <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:16, color:C.sub }}>🔍</span>
        </div>

        {/* Store pills */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none' }}>
          <Pill label={t.allStores} active={!storeFilter} onClick={() => { setStoreFilter(null); setPage(1); }} />
          {stores.map(s => <Pill key={s.id} label={s.name} active={storeFilter === s.id} onClick={() => { setStoreFilter(s.id); setPage(1); }} color={s.color} />)}
        </div>

        {/* Category tabs */}
        <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none' }}>
          <Pill label={t.allCategories} active={!catFilter} onClick={() => { setCatFilter(null); setPage(1); }} small />
          {topCats.map(c => <Pill key={c.id} label={c.name} active={catFilter === c.id} onClick={() => { setCatFilter(c.id); setPage(1); }} small />)}
        </div>

        {/* Sub-category chips */}
        {catFilter && subCats(catFilter).length > 0 && (
          <div style={{ display:'flex', gap:6, overflowX:'auto', paddingBottom:8, scrollbarWidth:'none' }}>
            {subCats(catFilter).map(c => <Pill key={c.id} label={c.name} active={catFilter === c.id} onClick={() => { setCatFilter(c.id); setPage(1); }} small accent />)}
          </div>
        )}

        {/* Result count + stock filter */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'4px 0 8px' }}>
          <span style={{ fontSize:12, color:C.sub }}>{total} {t.items}</span>
          <div style={{ display:'flex', gap:6 }}>
            <Pill label={t.inStock} active={stockFilter === true} onClick={() => { setStockFilter(stockFilter === true ? null : true); setPage(1); }} small accent />
          </div>
        </div>
      </div>

      {/* Item List */}
      <div style={{ padding:'0 16px 100px' }}>
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:C.sub, fontSize:13 }}>{t.loading}</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign:'center', padding:40, color:C.sub, fontSize:13 }}>{t.noResults}</div>
        ) : (
          items.map(item => <BevCard key={item.id} item={item} onClick={setSelected} />)
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', alignItems:'center', gap:16, padding:'16px 0' }}>
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
              style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${C.bd}`, background:C.card, fontSize:13, fontFamily:F, cursor: page > 1 ? 'pointer' : 'default', opacity: page > 1 ? 1 : 0.4 }}>{t.prev}</button>
            <span style={{ fontSize:13, color:C.sub }}>{page} / {totalPages}</span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
              style={{ padding:'8px 16px', borderRadius:6, border:`1px solid ${C.bd}`, background:C.card, fontSize:13, fontFamily:F, cursor: page < totalPages ? 'pointer' : 'default', opacity: page < totalPages ? 1 : 0.4 }}>{t.next}</button>
          </div>
        )}
      </div>

      {/* FAB - Add button */}
      <button onClick={() => setShowAdd(true)} style={{
        position:'fixed', bottom:24, right: 'calc(50% - 195px)', width:56, height:56, borderRadius:'50%',
        background:C.acc, color:'#fff', border:'none', fontSize:28, cursor:'pointer',
        boxShadow:'0 4px 12px rgba(0,0,0,0.15)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50,
      }}>+</button>

      {/* Detail overlay */}
      {selected && <BevDetail item={selected} stores={stores} categories={categories} onClose={() => setSelected(null)} onSave={saveItem} onDelete={deleteItem} />}

      {/* Add form */}
      {showAdd && <AddForm stores={stores} categories={categories} onClose={() => setShowAdd(false)} onAdd={addItem} />}

      {/* Toast */}
      <Toast msg={toast} onClose={() => setToast('')} />

      {/* Global animations */}
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        * { -webkit-tap-highlight-color: transparent; }
        ::-webkit-scrollbar { display: none; }
        input:focus, select:focus, textarea:focus { border-color: ${C.acc} !important; }
      `}</style>
    </div>
  );
}

// ===== Pill Button =====
function Pill({ label, active, onClick, color, small, accent }) {
  return (
    <button onClick={onClick} style={{
      padding: small ? '4px 10px' : '6px 14px',
      borderRadius: 16,
      border: `1px solid ${active ? (accent ? C.acc : (color || C.tx)) : C.bd}`,
      background: active ? (accent ? C.acc : (color || C.tx)) : C.card,
      color: active ? '#fff' : C.sub,
      fontSize: small ? 11 : 12,
      fontFamily: F,
      fontWeight: 500,
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      flexShrink: 0,
      transition: 'all 0.2s',
    }}>{label}</button>
  );
}
