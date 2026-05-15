'use client'
import { useState, useEffect, useRef } from 'react'
import axios from 'axios'
import { motion, AnimatePresence } from 'framer-motion'

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8003'

const ESTADO_CONFIG: Record<string, { label:string; color:string; bg:string; border:string }> = {
  valida:   { label:'Válida',   color:'#166534', bg:'#dcfce7', border:'#bbf7d0' },
  invalida: { label:'Inválida', color:'#991b1b', bg:'#fee2e2', border:'#fecaca' },
  revisar:  { label:'Revisar',  color:'#92400e', bg:'#fef3c7', border:'#fde68a' },
  pendiente:{ label:'Pendiente',color:'#1e3a5f', bg:'#dbeafe', border:'#bfdbfe' },
}

export default function App() {
  const [tab,        setTab]        = useState<'upload'|'facturas'|'config'|'stats'>('upload')
  const [facturas,   setFacturas]   = useState<any[]>([])
  const [stats,      setStats]      = useState<any>(null)
  const [config,     setConfig]     = useState<any>(null)
  const [uploading,  setUploading]  = useState(false)
  const [dragOver,   setDragOver]   = useState(false)
  const [selected,   setSelected]   = useState<any>(null)
  const [filterEstado, setFilterEstado] = useState('')
  const [filterProv,   setFilterProv]   = useState('')
  const [liquidador, setLiquidador] = useState({ nombre:'', codigo:'' })
  const [notif,      setNotif]      = useState<{msg:string;type:'ok'|'err'}|null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    try {
      const [f, s, c] = await Promise.all([
        axios.get(`${API}/facturas`),
        axios.get(`${API}/stats`),
        axios.get(`${API}/config`),
      ])
      setFacturas(f.data); setStats(s.data); setConfig(c.data)
    } catch {}
  }

  const notify = (msg: string, type: 'ok'|'err' = 'ok') => {
    setNotif({ msg, type })
    setTimeout(() => setNotif(null), 3500)
  }

  const handleFiles = async (files: FileList|null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      try {
        await axios.post(`${API}/facturas/upload`, form)
        notify(`✓ ${file.name} procesada correctamente`)
      } catch(e:any) {
        notify(`✕ Error en ${file.name}: ${e.response?.data?.detail||'Error'}`, 'err')
      }
    }
    setUploading(false)
    fetchAll()
  }

  const saveConfig = async () => {
    try {
      await axios.put(`${API}/config`, config)
      notify('✓ Configuración guardada')
      fetchAll()
    } catch { notify('✕ Error al guardar', 'err') }
  }

  const liquidar = async (facturaId: string) => {
    if (!liquidador.nombre || !liquidador.codigo) { notify('Complete nombre y código del liquidador', 'err'); return }
    try {
      await axios.put(`${API}/facturas/${facturaId}/liquidar`, { factura_id:facturaId, liquidador_nombre:liquidador.nombre, liquidador_codigo:liquidador.codigo })
      notify('✓ Liquidador asignado')
      fetchAll()
    } catch { notify('✕ Error', 'err') }
  }

  const cambiarEstado = async (id: string, estado: string) => {
    try {
      await axios.put(`${API}/facturas/${id}/estado?estado=${estado}`)
      notify('✓ Estado actualizado')
      fetchAll()
    } catch { notify('✕ Error', 'err') }
  }

  const deleteFact = async (id: string) => {
    try {
      await axios.delete(`${API}/facturas/${id}`)
      notify('✓ Factura eliminada')
      setSelected(null); fetchAll()
    } catch { notify('✕ Error', 'err') }
  }

  const facturasFiltradas = facturas.filter(f => {
    const eOk = !filterEstado || f.estado_validacion === filterEstado
    const pOk = !filterProv   || (f.proveedor_nombre||'').toLowerCase().includes(filterProv.toLowerCase())
    return eOk && pOk
  })

  const inp = { width:'100%', border:'1px solid #e2e8f0', borderRadius:8, padding:'9px 12px', fontSize:14, outline:'none', background:'#fff', boxSizing:'border-box' as const, fontFamily:'inherit' }
  const lbl = { fontSize:12, fontWeight:600, color:'#374151', marginBottom:4, display:'block' as const }

  return (
    <div style={{ minHeight:'100vh', background:'#f1f5f9', fontFamily:"'Inter',sans-serif" }}>
      <AnimatePresence>
        {notif && (
          <motion.div initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            style={{ position:'fixed', top:16, right:16, zIndex:9999, background:notif.type==='ok'?'#166534':'#991b1b', color:'#fff', padding:'10px 18px', borderRadius:10, fontSize:13, fontWeight:600, boxShadow:'0 4px 20px rgba(0,0,0,0.2)' }}>
            {notif.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ background:'#fff', borderBottom:'1px solid #e2e8f0', padding:'0 24px', display:'flex', alignItems:'center', gap:16, height:60, boxShadow:'0 1px 4px rgba(0,0,0,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:36, height:36, borderRadius:10, background:'linear-gradient(135deg,#4f46e5,#7c3aed)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🧾</div>
          <div><div style={{ fontWeight:800, fontSize:16, color:'#1e293b' }}>FacturaAI</div><div style={{ fontSize:11, color:'#94a3b8' }}>Validación inteligente de facturas</div></div>
        </div>
        <div style={{ display:'flex', gap:4, marginLeft:32 }}>
          {[['upload','📤 Subir'],['facturas','🗂 Facturas'],['stats','📊 Estadísticas'],['config','⚙️ Configurar']].map(([id,label]) => (
            <button key={id} onClick={() => setTab(id as any)} style={{ padding:'7px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:tab===id?'#4f46e5':'transparent', color:tab===id?'#fff':'#64748b', transition:'all .15s' }}>{label}</button>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <a href={`${API}/export/excel`} target="_blank" style={{ background:'#166534', color:'#fff', padding:'7px 16px', borderRadius:8, fontSize:12, fontWeight:600, textDecoration:'none', display:'flex', alignItems:'center', gap:5 }}>📥 Excel Todas</a>
          <a href={`${API}/export/excel?estado=valida`} target="_blank" style={{ background:'#0f766e', color:'#fff', padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:600, textDecoration:'none' }}>✓ Válidas</a>
          <a href={`${API}/export/excel?estado=invalida`} target="_blank" style={{ background:'#dc2626', color:'#fff', padding:'7px 14px', borderRadius:8, fontSize:12, fontWeight:600, textDecoration:'none' }}>✕ Inválidas</a>
        </div>
      </div>

      <div style={{ padding:24, maxWidth:1400, margin:'0 auto' }}>
        {tab==='upload' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            <div>
              <h2 style={{ margin:'0 0 16px', fontSize:18, fontWeight:700, color:'#1e293b' }}>Subir Facturas</h2>
              <div onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={e=>{e.preventDefault();setDragOver(false);handleFiles(e.dataTransfer.files)}} onClick={()=>fileRef.current?.click()}
                style={{ border:`2px dashed ${dragOver?'#4f46e5':'#cbd5e1'}`, borderRadius:16, padding:40, textAlign:'center', cursor:'pointer', background:dragOver?'#eef2ff':'#fff', transition:'all .2s' }}>
                <div style={{ fontSize:48, marginBottom:12 }}>📂</div>
                <div style={{ fontWeight:700, fontSize:16, color:'#1e293b', marginBottom:6 }}>Arrastra facturas aquí</div>
                <div style={{ fontSize:13, color:'#64748b', marginBottom:12 }}>JPG, PNG, PDF · Múltiples archivos</div>
                <div style={{ background:'#4f46e5', color:'#fff', padding:'9px 24px', borderRadius:8, fontSize:13, fontWeight:600, display:'inline-block' }}>{uploading ? '⏳ Procesando...' : 'Seleccionar archivos'}</div>
                <input ref={fileRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf" style={{ display:'none' }} onChange={e=>handleFiles(e.target.files)} />
              </div>
              {uploading && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ marginTop:16, background:'#eef2ff', border:'1px solid #c7d2fe', borderRadius:12, padding:16, display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ width:24, height:24, border:'3px solid #4f46e5', borderTop:'3px solid transparent', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
                  <div><div style={{ fontWeight:600, color:'#312e81', fontSize:14 }}>Analizando con IA...</div><div style={{ fontSize:12, color:'#6366f1' }}>OCR + extracción de datos + validación</div></div>
                </motion.div>
              )}
              <div style={{ marginTop:20, background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:16 }}>
                <div style={{ fontWeight:700, fontSize:14, color:'#1e293b', marginBottom:12 }}>Asignar Liquidador</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                  <div><label style={lbl}>Nombre</label><input style={inp} value={liquidador.nombre} onChange={e=>setLiquidador(l=>({...l,nombre:e.target.value}))} placeholder="Nombre completo" /></div>
                  <div><label style={lbl}>Código</label><input style={inp} value={liquidador.codigo} onChange={e=>setLiquidador(l=>({...l,codigo:e.target.value}))} placeholder="Código empleado" /></div>
                </div>
                <div style={{ fontSize:12, color:'#94a3b8', marginTop:8 }}>Se asignará al seleccionar una factura en la tabla</div>
              </div>
            </div>
            <div>
              <h2 style={{ margin:'0 0 16px', fontSize:18, fontWeight:700, color:'#1e293b' }}>Últimas procesadas</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {facturas.slice(0,8).map(f => {
                  const ec = ESTADO_CONFIG[f.estado_validacion] || ESTADO_CONFIG.pendiente
                  return (
                    <motion.div key={f.id} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} onClick={() => { setSelected(f); setTab('facturas') }}
                      style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:10, padding:'12px 14px', cursor:'pointer', display:'flex', alignItems:'center', gap:12, transition:'border-color .15s' }}>
                      <div style={{ fontSize:22 }}>{f.tipo==='fisica'?'🖼':'📄'}</div>
                      <div style={{ flex:1, minWidth:0 }}><div style={{ fontWeight:600, fontSize:13, color:'#1e293b', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.proveedor_nombre||f.filename}</div><div style={{ fontSize:11, color:'#94a3b8' }}>{f.numero_factura||'—'} · {f.fecha_factura||'—'}</div></div>
                      <div><div style={{ fontSize:13, fontWeight:700, color:'#1e293b' }}>{f.monto_total?`₡${f.monto_total.toLocaleString()}`:'—'}</div><div style={{ fontSize:11, fontWeight:600, color:ec.color, background:ec.bg, padding:'2px 8px', borderRadius:99, marginTop:3, textAlign:'center' }}>{ec.label}</div></div>
                    </motion.div>
                  )
                })}
                {facturas.length===0 && <div style={{ textAlign:'center', padding:'40px 0', color:'#94a3b8' }}>No hay facturas aún. Sube una para comenzar.</div>}
              </div>
            </div>
          </div>
        )}

        {tab==='facturas' && (
          <div style={{ display:'grid', gridTemplateColumns: selected?'1fr 380px':'1fr', gap:20 }}>
            <div>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#1e293b' }}>Facturas ({facturasFiltradas.length})</h2>
                <div style={{ display:'flex', gap:8 }}>
                  <input style={{ ...inp, width:200 }} placeholder="Buscar proveedor..." value={filterProv} onChange={e=>setFilterProv(e.target.value)} />
                  <select style={{ ...inp, width:140 }} value={filterEstado} onChange={e=>setFilterEstado(e.target.value)}>
                    <option value="">Todos los estados</option><option value="valida">Válidas</option><option value="invalida">Inválidas</option><option value="revisar">Revisar</option>
                  </select>
                </div>
              </div>
              <div style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', overflow:'hidden' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ background:'#f8fafc', borderBottom:'1px solid #e2e8f0' }}>
                      {['Tipo','Proveedor','Cédula','Nº Factura','Fecha','Monto','Estado','OCR%','Liquidador','SAP',''].map(h => (
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:700, color:'#64748b', letterSpacing:'0.05em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {facturasFiltradas.map((f) => {
                      const ec = ESTADO_CONFIG[f.estado_validacion] || ESTADO_CONFIG.pendiente
                      return (
                        <tr key={f.id} onClick={() => setSelected(selected?.id===f.id?null:f)} style={{ borderBottom:'1px solid #f1f5f9', cursor:'pointer', background:selected?.id===f.id?'#eef2ff':'#fff', transition:'background .1s' }}>
                          <td style={{ padding:'10px 12px' }}>{f.tipo==='fisica'?'🖼 Física':'📄 Electrónica'}</td>
                          <td style={{ padding:'10px 12px', fontWeight:600, color:'#1e293b', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.proveedor_nombre||'—'}</td>
                          <td style={{ padding:'10px 12px', color:'#64748b' }}>{f.proveedor_cedula||'—'}</td>
                          <td style={{ padding:'10px 12px', color:'#64748b' }}>{f.numero_factura||'—'}</td>
                          <td style={{ padding:'10px 12px', color:'#64748b' }}>{f.fecha_factura||'—'}</td>
                          <td style={{ padding:'10px 12px', fontWeight:600 }}>{f.monto_total?`₡${f.monto_total.toLocaleString()}`:'—'}</td>
                          <td style={{ padding:'10px 12px' }}>
                            <span style={{ fontSize:11, fontWeight:700, color:ec.color, background:ec.bg, border:`1px solid ${ec.border}`, padding:'3px 10px', borderRadius:99 }}>{ec.label}</span>
                          </td>
                          <td style={{ padding:'10px 12px', color: (f.ocr_confidence||0)>70?'#166534':'#991b1b' }}>{f.ocr_confidence?.toFixed(0)||'—'}%</td>
                          <td style={{ padding:'10px 12px', fontSize:12, color:'#64748b' }}>{f.liquidador_nombre||'—'}</td>
                          <td style={{ padding:'10px 12px' }}>
                            <a href={`${API}/export/sap/${f.id}`} target="_blank" style={{ background:'#0f766e', color:'#fff', padding:'4px 8px', borderRadius:6, fontSize:11, textDecoration:'none', display:'inline-block' }}>📎 SAP</a>
                          </td>
                          <td style={{ padding:'10px 12px' }}>
                            <button onClick={e=>{e.stopPropagation();deleteFact(f.id)}} style={{ background:'none', border:'none', color:'#ef4444', cursor:'pointer', fontSize:14, padding:'2px 6px' }}>✕</button>
                          </td>
                        </tr>
                      )
                    })}
                    {facturasFiltradas.length===0 && <tr><td colSpan={11} style={{ padding:'40px', textAlign:'center', color:'#94a3b8' }}>No hay facturas con ese filtro</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
            <AnimatePresence>
              {selected && (
                <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:20 }} style={{ background:'#fff', borderRadius:12, border:'1px solid #e2e8f0', padding:20, height:'fit-content', position:'sticky', top:20 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                    <div style={{ fontWeight:700, fontSize:15, color:'#1e293b' }}>Detalle de Factura</div>
                    <button onClick={() => setSelected(null)} style={{ background:'none', border:'none', color:'#94a3b8', cursor:'pointer', fontSize:18 }}>✕</button>
                  </div>
                  {(() => {
                    const ec = ESTADO_CONFIG[selected.estado_validacion] || ESTADO_CONFIG.pendiente
                    return (
                      <>
                        <div style={{ marginBottom:14, padding:12, background:ec.bg, border:`1px solid ${ec.border}`, borderRadius:8, display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:16 }}>{selected.estado_validacion==='valida'?'✅':selected.estado_validacion==='invalida'?'❌':'⚠️'}</span>
                          <div><div style={{ fontWeight:700, color:ec.color, fontSize:13 }}>{ec.label}</div><div style={{ fontSize:11, color:ec.color, opacity:0.8 }}>OCR: {selected.ocr_confidence?.toFixed(1)||'—'}%</div></div>
                        </div>
                        <div style={{ display:'flex', gap:6, marginBottom:14 }}>{['valida','invalida','revisar'].map(e => <button key={e} onClick={() => cambiarEstado(selected.id, e)} style={{ flex:1, padding:'6px 0', borderRadius:7, border:`1px solid ${ESTADO_CONFIG[e].border}`, background:selected.estado_validacion===e?ESTADO_CONFIG[e].bg:'transparent', color:ESTADO_CONFIG[e].color, cursor:'pointer', fontSize:11, fontWeight:600 }}>{ESTADO_CONFIG[e].label}</button>)}</div>
                        <div style={{ fontSize:12, display:'flex', flexDirection:'column', gap:8, marginBottom:14 }}>
                          {[
                            ['Proveedor', selected.proveedor_nombre],['Cédula Proveedor', selected.proveedor_cedula],['Teléfono', selected.proveedor_telefono],
                            ['Nº Factura', selected.numero_factura],['Fecha', selected.fecha_factura],['Monto', selected.monto_total?`₡${selected.monto_total.toLocaleString()}`:'—'],
                            ['Sociedad detectada', selected.sociedad_detectada],['Cédula detectada', selected.cedula_detectada],['Tipo', selected.tipo],['Archivo', selected.filename]
                          ].map(([l,v]) => <div key={String(l)} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #f1f5f9' }}><span style={{ color:'#64748b', fontWeight:600 }}>{l}</span><span style={{ color:'#1e293b', fontWeight:500, textAlign:'right', maxWidth:160, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{String(v||'—')}</span></div>)}
                        </div>
                        <div style={{ borderTop:'1px solid #e2e8f0', paddingTop:14 }}><div style={{ fontWeight:700, fontSize:13, color:'#1e293b', marginBottom:10 }}>Asignar Liquidador</div><input style={inp} value={liquidador.nombre} onChange={e=>setLiquidador(l=>({...l,nombre:e.target.value}))} placeholder="Nombre del liquidador" /><input style={{ ...inp, marginTop:8, marginBottom:10 }} value={liquidador.codigo} onChange={e=>setLiquidador(l=>({...l,codigo:e.target.value}))} placeholder="Código de empleado" /><button onClick={() => liquidar(selected.id)} style={{ width:'100%', background:'#4f46e5', border:'none', color:'#fff', padding:'9px', borderRadius:8, cursor:'pointer', fontWeight:700, fontSize:13 }}>Asignar</button></div>
                        {selected.texto_extraido && <div style={{ marginTop:14, borderTop:'1px solid #e2e8f0', paddingTop:14 }}><div style={{ fontWeight:700, fontSize:12, color:'#64748b', marginBottom:6 }}>TEXTO OCR</div><div style={{ background:'#f8fafc', borderRadius:8, padding:10, fontSize:11, color:'#475569', maxHeight:120, overflowY:'auto', fontFamily:'monospace', lineHeight:1.5 }}>{selected.texto_extraido}</div></div>}
                      </>
                    )
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {tab==='stats' && stats && (
          <div><h2 style={{ margin:'0 0 20px', fontSize:18, fontWeight:700, color:'#1e293b' }}>Estadísticas</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:24 }}>
            {[{l:'Total',v:stats.total,icon:'🧾',c:'#4f46e5',bg:'#eef2ff'},{l:'Válidas',v:stats.validas,icon:'✅',c:'#166534',bg:'#dcfce7'},{l:'Inválidas',v:stats.invalidas,icon:'❌',c:'#991b1b',bg:'#fee2e2'},{l:'Revisar',v:stats.revisar,icon:'⚠️',c:'#92400e',bg:'#fef3c7'},{l:'% Inválidas',v:`${stats.pct_invalidas}%`,icon:'📈',c:'#0f766e',bg:'#ccfbf1'}].map(s => <div key={s.l} style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:20, textAlign:'center' }}><div style={{ fontSize:28, marginBottom:8 }}>{s.icon}</div><div style={{ fontSize:28, fontWeight:800, color:s.c }}>{s.v}</div><div style={{ fontSize:12, color:'#64748b', marginTop:4 }}>{s.l}</div></div>)}
          </div>
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:24 }}><div style={{ fontWeight:700, color:'#1e293b', marginBottom:16 }}>Monto Total Procesado</div><div style={{ fontSize:36, fontWeight:800, color:'#4f46e5' }}>₡{stats.total_monto.toLocaleString()}</div><div style={{ fontSize:13, color:'#94a3b8', marginTop:6 }}>Suma de todas las facturas con monto detectado</div></div></div>
        )}

        {tab==='config' && config && (
          <div style={{ maxWidth:600 }}><h2 style={{ margin:'0 0 20px', fontSize:18, fontWeight:700, color:'#1e293b' }}>Configuración de Empresa</h2>
          <div style={{ background:'#fff', border:'1px solid #e2e8f0', borderRadius:12, padding:24 }}>
            <div style={{ marginBottom:14 }}><label style={lbl}>Nombre oficial de la sociedad</label><input style={inp} value={config.nombre_oficial||''} onChange={e=>setConfig((c:any)=>({...c,nombre_oficial:e.target.value}))} placeholder="Empresa S.A." /></div>
            <div style={{ marginBottom:14 }}><label style={lbl}>Cédula jurídica</label><input style={inp} value={config.cedula_juridica||''} onChange={e=>setConfig((c:any)=>({...c,cedula_juridica:e.target.value}))} placeholder="3-101-000000" /></div>
            <div style={{ marginBottom:20 }}><label style={lbl}>Variaciones del nombre (una por línea)</label><textarea style={{ ...inp, height:120, resize:'vertical', fontFamily:'inherit' }} value={(config.variaciones||[]).join('\n')} onChange={e=>setConfig((c:any)=>({...c,variaciones:e.target.value.split('\n').filter((x:string)=>x.trim())}))} placeholder={'Empresa SA\nEmpresa Sociedad Anónima\nEMPRESA S.A.'} /><div style={{ fontSize:11, color:'#94a3b8', marginTop:4 }}>La IA buscará cualquiera de estos nombres en las facturas</div></div>
            <button onClick={saveConfig} style={{ background:'#4f46e5', border:'none', color:'#fff', padding:'11px 28px', borderRadius:9, cursor:'pointer', fontWeight:700, fontSize:14 }}>Guardar configuración</button>
          </div></div>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}
