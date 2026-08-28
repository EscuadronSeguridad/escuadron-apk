import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, StyleSheet, Keyboard, Vibration, TouchableWithoutFeedback, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Clipboard from 'expo-clipboard';
const STORAGE_KEY = 'ESCUADRON_V31_FINAL';

export default function App() {
  const [permission, requestPermission] = useCameraPermissions();
  const [usuarioLogueado, setUsuarioLogueado] = useState(null);
  const [uUser, setUUser] = useState(''); const [uPass, setUPass] = useState('');
  const [listaNegra, setListaNegra] = useState([]); const [eventos, setEventos] = useState([]); const [personal, setPersonal] = useState([]); const [historial, setHistorial] = useState([]);
  const [eventoActivoId, setEventoActivoId] = useState(null);
  const [superPass, setSuperPass] = useState('Escuadron2026!R'); const [nuevoSuperPass, setNuevoSuperPass] = useState('');
  const [lnDni, setLnDni] = useState(''); const [lnNombre, setLnNombre] = useState(''); const [lnApellido, setLnApellido] = useState(''); const [lnMotivo, setLnMotivo] = useState(''); const [lnColor, setLnColor] = useState('rojo');
  const [pUser, setPUser] = useState(''); const [pPass, setPPass] = useState(''); const [pDesechable, setPDesechable] = useState(false); const [pHoraVence, setPHoraVence] = useState('08:00'); const [pRol, setPRol] = useState('garita');
  const [eNombre, setENombre] = useState(''); const [eMin, setEMin] = useState(''); const [eMax, setEMax] = useState('');
  const [tabAdmin, setTabAdmin] = useState('lista'); const [codigoTraspaso, setCodigoTraspaso] = useState(''); const [codigoLogin, setCodigoLogin] = useState(''); const [codigoGarita, setCodigoGarita] = useState('');
  const [busquedaDni, setBusquedaDni] = useState(''); const [busquedaNombreGarita, setBusquedaNombreGarita] = useState(''); const [busquedaApellidoGarita, setBusquedaApellidoGarita] = useState('');
  const [ultimoEscaneo, setUltimoEscaneo] = useState(null); const [cargado, setCargado] = useState(false);
  const [motivoBlack, setMotivoBlack] = useState(''); const [colorBlack, setColorBlack] = useState('rojo');
  const ultimoTiempoRef = useRef(0);
  const esAdmin = usuarioLogueado?.rol==='superadmin' || usuarioLogueado?.rol==='admin';
  const ocultarTeclado = () => Keyboard.dismiss();

  useEffect(()=>{(async()=>{
    const sp=await AsyncStorage.getItem('SUPER_PASS_FINAL'); if(sp) setSuperPass(sp);
    const keys=['ESCUADRON_V31_FINAL','ESCUADRON_V30_1_ARREGLADA','ESCUADRON_V30_1','ESCUADRON_FINAL_SIN_V3'];
    for(const k of keys){ const s=await AsyncStorage.getItem(k); if(s){ try{ const d=JSON.parse(s); if(d.listaNegra) setListaNegra(d.listaNegra); if(d.eventos) setEventos(d.eventos); if(d.personal) setPersonal(d.personal); if(d.historial) setHistorial(d.historial); if(d.eventoActivoId) setEventoActivoId(d.eventoActivoId); break; }catch{} } }
    setCargado(true);
  })()},[]);
  useEffect(()=>{ if(!cargado) return; AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({listaNegra, eventos, personal, historial, eventoActivoId})); },[listaNegra, eventos, personal, historial, eventoActivoId, cargado]);

  const verificar = (dni, nombre, apellido) => {
    const ahora = Date.now(); if(ahora-ultimoTiempoRef.current<350) return; ultimoTiempoRef.current=ahora;
    Keyboard.dismiss();
    let color='verde'; let motivo='AUTORIZADO - LIBRE';
    let coincidencia=listaNegra.find(x=> x.dni && dni && dni!=='S/DNI' && x.dni.toString()===dni.toString());
    if(!coincidencia && nombre && apellido){ coincidencia=listaNegra.find(x=> x.nombre.toLowerCase().trim()===nombre.toLowerCase().trim() && x.apellido.toLowerCase().trim()===apellido.toLowerCase().trim()); }
    else if(!coincidencia && nombre){ coincidencia=listaNegra.find(x=> x.nombre.toLowerCase().trim()===nombre.toLowerCase().trim()); }
    if(coincidencia){ color=coincidencia.color; motivo=coincidencia.motivo; }
    if(color==='rojo') Vibration.vibrate([60,80,60]); else if(color==='amarillo') Vibration.vibrate([40,40]); else Vibration.vibrate(40);
    const evento=eventos.find(e=>e.id===eventoActivoId);
    const registro={id:Date.now().toString(), hora:new Date().toLocaleTimeString(), dni:dni||'', nombre:(nombre||'')+' '+(apellido||''), color, motivo, operario:usuarioLogueado?.user||'garita1', eventoNombre:evento?.nombre||'PRUEBA'};
    setHistorial(prev=>[registro,...prev].slice(0,1000)); setUltimoEscaneo(registro);
  };

  const login = () => {
    Keyboard.dismiss();
    const u=uUser.trim().toLowerCase(); const p=uPass.trim();
    if(u==='admin' && p===superPass.trim()){ setUsuarioLogueado({user:'admin', rol:'superadmin'}); return; }
    const f=personal.find(x=>x.user.trim().toLowerCase()===u && x.pass.trim()===p);
    if(!f){ if(personal.length===0) Alert.alert('Importa primero','Pega el codigo del admin abajo y dale a IMPORTAR'); else Alert.alert('No existe','Usuario no encontrado'); return; }
    if(f.desechable && f.hastaReal){ const vence=new Date(f.hastaReal); if(new Date()>vence){ Alert.alert('Vencido','Usuario vencido a las '+f.hastaReal); return; } }
    setUsuarioLogueado(f);
  };

  const importarDesdeLogin = () => {
    Keyboard.dismiss();
    if(!codigoLogin.trim()){ Alert.alert('Pega codigo'); return; }
    try{
      const d=JSON.parse(codigoLogin.trim());
      if(d.listaNegra) setListaNegra(d.listaNegra);
      if(d.eventos) setEventos(d.eventos);
      if(d.personal) setPersonal(d.personal);
      if(d.eventoActivoId) setEventoActivoId(d.eventoActivoId);
      Alert.alert('Import OK', `Lista: ${d.listaNegra?.length||0} - Usuarios: ${d.personal?.length||0}`);
      setCodigoLogin('');
    }catch{ Alert.alert('Codigo invalido'); }
  };

  const importarTodoAdmin = () => {
    Keyboard.dismiss();
    if(!codigoTraspaso.trim()){ Alert.alert('Pega codigo para importar'); return; }
    try{
      const d=JSON.parse(codigoTraspaso.trim());
      if(d.listaNegra) setListaNegra(d.listaNegra);
      if(d.eventos) setEventos(d.eventos);
      if(d.personal) setPersonal(d.personal);
      if(d.historial) setHistorial(d.historial);
      if(d.eventoActivoId) setEventoActivoId(d.eventoActivoId);
      Alert.alert('IMPORT OK', `Lista: ${d.listaNegra?.length||0} - Personal: ${d.personal?.length||0} - Historial: ${d.historial?.length||0}`);
      setCodigoTraspaso('');
    }catch{ Alert.alert('Codigo invalido'); }
  };

  const agregarLista = () => { Keyboard.dismiss(); if(!lnDni &&!lnNombre){ Alert.alert('Falta DNI o Nombre'); return; } if(!lnMotivo){ Alert.alert('Falta motivo'); return; } setListaNegra(p=>[...p,{id:Date.now().toString(), dni:lnDni.trim()||null, nombre:lnNombre.trim()||'S/NOMBRE', apellido:lnApellido.trim()||'', motivo:lnMotivo.trim(), color:lnColor}]); setLnDni(''); setLnNombre(''); setLnApellido(''); setLnMotivo(''); };
  const agregarPersonal = () => {
    Keyboard.dismiss(); if(!pUser||!pPass){ Alert.alert('Falta usuario y clave'); return; }
    let hasta=''; if(pDesechable){ const [hh,mm]=pHoraVence.split(':').map(Number); const f=new Date(); f.setHours(hh||8, mm||0, 0, 0); if(f<new Date()) f.setDate(f.getDate()+1); hasta=f.toString(); }
    setPersonal(p=>[...p,{id:Date.now().toString(), user:pUser.trim(), pass:pPass.trim(), rol:pRol, desechable:pDesechable, hastaReal:hasta, horaVence:pHoraVence}]);
    setPUser(''); setPPass(''); setPDesechable(false);
  };
  const agregarEvento = () => { Keyboard.dismiss(); if(!eNombre){ Alert.alert('Falta nombre'); return; } const n={id:Date.now().toString(), nombre:eNombre.toUpperCase(), minEdad:Number(eMin)||0, maxEdad:Number(eMax)||99}; setEventos(p=>[...p,n]); setEventoActivoId(n.id); setENombre(''); setEMin(''); setEMax(''); };
  const exportarTodo = async () => { Keyboard.dismiss(); const data=JSON.stringify({listaNegra, eventos, personal, eventoActivoId, historial}); setCodigoTraspaso(data); await Clipboard.setStringAsync(data); Alert.alert('¡COPIADO!', 'Todo copiado al portapapeles.'); };
  const exportarHistorialGarita = async () => { Keyboard.dismiss(); const data=JSON.stringify({historial, operario:usuarioLogueado?.user, fecha:new Date().toLocaleString()}); setCodigoGarita(data); await Clipboard.setStringAsync(data); Alert.alert('¡COPIADO!', `Historial de ${historial.length} copiado.`); };
  const cambiarSuperPass = async () => { Keyboard.dismiss(); if(!nuevoSuperPass.trim()){ Alert.alert('Escribi nueva clave'); return; } setSuperPass(nuevoSuperPass.trim()); await AsyncStorage.setItem('SUPER_PASS_FINAL', nuevoSuperPass.trim()); Alert.alert('CLAVE CAMBIADA', `Nueva: ${nuevoSuperPass.trim()}`); setNuevoSuperPass(''); };

  const mandarAListaNegra = (item) => {
    Keyboard.dismiss();
    if(!motivoBlack.trim()){ Alert.alert('Falta motivo','Escribí el motivo arriba primero'); return; }
    const partes = item.nombre.trim().split(' ').filter(Boolean);
    const nombre = partes[0] || 'S/NOMBRE';
    const apellido = partes.slice(1).join(' ') || '';
    const yaExiste = listaNegra.find(x=> x.dni && item.dni && x.dni.toString()===item.dni.toString());
    if(yaExiste){ Alert.alert('Ya está en lista negra'); return; }
    setListaNegra(p=>[...p,{id:Date.now().toString(), dni:item.dni||null, nombre, apellido, motivo:motivoBlack.trim().toUpperCase(), color:colorBlack}]);
    Alert.alert('ENVIADO A LISTA NEGRA', `${item.dni} ${item.nombre} -> ${colorBlack.toUpperCase()} : ${motivoBlack.toUpperCase()}`);
  };

  const textoEstado = (c) => c==='rojo'?'DENEGADO': c==='amarillo'?'PRECAUCIÓN':'AUTORIZADO';
  const BotonTeclado = () => (<TouchableOpacity onPress={ocultarTeclado} style={{backgroundColor:'#2A2A2A', paddingHorizontal:10, paddingVertical:6, borderRadius:8, borderWidth:1, borderColor:'#333'}}><Text style={{color:'#888', fontSize:10, fontWeight:'bold'}}>⌨️ OCULTAR</Text></TouchableOpacity>);

  if(!usuarioLogueado){
    return (
      <TouchableWithoutFeedback onPress={ocultarTeclado} accessible={false}>
        <View style={{flex:1, backgroundColor:'#0E0E0E'}}>
          <ScrollView contentContainerStyle={{flexGrow:1}} keyboardShouldPersistTaps="handled">
            <View style={s.login}>
              <View style={{flexDirection:'row', justifyContent:'flex-end', marginBottom:10}}><BotonTeclado/></View>
              <Text style={{color:'#FFF', fontSize:28, fontWeight:'bold', textAlign:'center'}}>ESCUADRON{'\n'}SEGURIDAD</Text>
              <Text style={{color:'#888', fontSize:12, textAlign:'center', marginBottom:24, marginTop:6, letterSpacing:2}}>CONTROL DE ACCESO</Text>
              <TextInput placeholder="Usuario" style={s.inputLogin} value={uUser} onChangeText={setUUser} placeholderTextColor="#777" autoCapitalize="none"/>
              <TextInput placeholder="Clave" style={s.inputLogin} value={uPass} onChangeText={setUPass} secureTextEntry placeholderTextColor="#777"/>
              <TouchableOpacity style={s.botonEntrar} onPress={login}><Text style={{color:'#FFF', textAlign:'center', fontWeight:'bold'}}>ENTRAR</Text></TouchableOpacity>
              <View style={{marginTop:24, backgroundColor:'#111', padding:12, borderRadius:12, borderWidth:1, borderColor:'#222'}}>
                <Text style={{color:'#AAA', fontSize:10, marginBottom:6, fontWeight:'bold'}}>📥 IMPORTAR DESDE ADMIN</Text>
                <TextInput placeholder="Pega codigo admin" style={[s.inputLogin,{height:90, fontSize:10}]} value={codigoLogin} onChangeText={setCodigoLogin} multiline placeholderTextColor="#555" selectTextOnFocus={true}/>
                <TouchableOpacity style={[s.botonEntrar,{backgroundColor:'#007AFF'}]} onPress={importarDesdeLogin}><Text style={{color:'#FFF', textAlign:'center', fontWeight:'bold'}}>📥 IMPORTAR LISTA ADMIN</Text></TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    )
  }

  if(esAdmin){
    return (
      <TouchableWithoutFeedback onPress={ocultarTeclado} accessible={false}>
        <View style={{flex:1, backgroundColor:'#0E0E0E'}}>
          <View style={{flexDirection:'row', justifyContent:'space-between', padding:12, paddingTop:50, alignItems:'center'}}>
            <Text style={{color:'#FFF', fontSize:12, fontWeight:'bold'}}>{usuarioLogueado.rol==='superadmin'?'SÚPER ADMIN':'ADMIN'}: {usuarioLogueado.user}</Text>
            <View style={{flexDirection:'row', gap:8, alignItems:'center'}}><BotonTeclado/><TouchableOpacity onPress={()=>{Keyboard.dismiss(); setUsuarioLogueado(null);}} style={{backgroundColor:'#FF3B30', paddingHorizontal:10, paddingVertical:6, borderRadius:8}}><Text style={{color:'#FFF', fontWeight:'bold', fontSize:11}}>SALIR X</Text></TouchableOpacity></View>
          </View>
          <ScrollView horizontal={true} showsHorizontalScrollIndicator={true} style={{flexGrow:0, height:50}} contentContainerStyle={{paddingHorizontal:12, gap:8, flexDirection:'row', alignItems:'center', paddingRight:50}}>
            <TouchableOpacity onPress={()=>{Keyboard.dismiss(); setTabAdmin('lista');}} style={[s.tabFoto, tabAdmin==='lista'&&s.tabFotoAct]}><Text style={[s.tabFotoTxt, tabAdmin==='lista'&&{color:'#FFF'}]}>LISTA ({listaNegra.length})</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>{Keyboard.dismiss(); setTabAdmin('personal');}} style={[s.tabFoto, tabAdmin==='personal'&&s.tabFotoAct]}><Text style={[s.tabFotoTxt, tabAdmin==='personal'&&{color:'#FFF'}]}>PERSONAL ({personal.length})</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>{Keyboard.dismiss(); setTabAdmin('eventos');}} style={[s.tabFoto, tabAdmin==='eventos'&&s.tabFotoAct]}><Text style={[s.tabFotoTxt, tabAdmin==='eventos'&&{color:'#FFF'}]}>EVENTOS ({eventos.length})</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>{Keyboard.dismiss(); setTabAdmin('historial');}} style={[s.tabFoto, tabAdmin==='historial'&&{backgroundColor:'#FF9500'}]}><Text style={[s.tabFotoTxt, tabAdmin==='historial'&&{color:'#FFF'}]}>HIST ({historial.length})</Text></TouchableOpacity>
            <TouchableOpacity onPress={()=>{Keyboard.dismiss(); setTabAdmin('config');}} style={[s.tabFoto, tabAdmin==='config'&&{backgroundColor:'#007AFF', borderWidth:2, borderColor:'#FFF'}]}><Text style={[s.tabFotoTxt, tabAdmin==='config'&&{color:'#FFF'}]}>CONFIG</Text></TouchableOpacity>
          </ScrollView>

          <ScrollView style={{flex:1, paddingHorizontal:12, marginTop:10}} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag">
            {tabAdmin==='config'&&<>
              <Text style={{color:'#FFF', fontWeight:'bold', fontSize:16, marginTop:10}}>🔐 CAMBIAR CONTRASEÑA SÚPER ADMIN</Text>
              <Text style={{color:'#888', fontSize:11, marginTop:6}}>Clave actual:</Text>
              <Text style={{color:'#1DB954', fontSize:14, fontWeight:'bold', marginBottom:12}}>{superPass}</Text>
              <TextInput placeholder="Escribi nueva clave" style={s.inputFoto} value={nuevoSuperPass} onChangeText={setNuevoSuperPass} placeholderTextColor="#777" secureTextEntry/>
              <TouchableOpacity style={[s.botonAgregar,{backgroundColor:'#007AFF', marginTop:10}]} onPress={cambiarSuperPass}><Text style={{color:'#FFF', textAlign:'center', fontWeight:'bold'}}>🔑 CAMBIAR CLAVE SUPER ADMIN</Text></TouchableOpacity>
            </>}
            {tabAdmin==='lista'&&<><TextInput placeholder="DNI opcional" style={s.inputFoto} value={lnDni} onChangeText={setLnDni} keyboardType="numeric" placeholderTextColor="#777"/><TextInput placeholder="Nombre" style={s.inputFoto} value={lnNombre} onChangeText={setLnNombre} placeholderTextColor="#777"/><TextInput placeholder="Apellido" style={s.inputFoto} value={lnApellido} onChangeText={setLnApellido} placeholderTextColor="#777"/><TextInput placeholder="Motivo Ej: DEUDA" style={s.inputFoto} value={lnMotivo} onChangeText={setLnMotivo} placeholderTextColor="#777"/><View style={{flexDirection:'row', gap:8, marginVertical:10}}><TouchableOpacity onPress={()=>setLnColor('rojo')} style={[s.chipRojo, lnColor==='rojo'&&{backgroundColor:'#FF3B30'}]}><Text style={[s.chipTxt, lnColor==='rojo'&&{color:'#FFF'}]}>ROJO</Text></TouchableOpacity><TouchableOpacity onPress={()=>setLnColor('amarillo')} style={[s.chipRojo, lnColor==='amarillo'&&{backgroundColor:'#FFB020'}]}><Text style={[s.chipTxt, lnColor==='amarillo'&&{color:'#000'}]}>AMARILLO</Text></TouchableOpacity><View style={{flex:1, alignItems:'flex-end'}}><BotonTeclado/></View></View><TouchableOpacity style={s.botonAgregar} onPress={agregarLista}><Text style={{color:'#FFF', textAlign:'center', fontWeight:'bold'}}>AGREGAR</Text></TouchableOpacity>{listaNegra.map(i=><View key={i.id} style={s.filaFoto}><Text style={{color:'#FFF', flex:1, fontSize:12}}>{i.color==='rojo'?'🔴':'🟡'} {i.dni||''} {i.nombre} {i.apellido} - {i.motivo}</Text><TouchableOpacity onPress={()=>setListaNegra(p=>p.filter(x=>x.id!==i.id))}><Text style={{color:'#FF3B30', fontSize:18}}>×</Text></TouchableOpacity></View>)}</>}
            {tabAdmin==='personal'&&<><Text style={{color:'#FFF', fontWeight:'bold'}}>CREAR PERSONAL / ADMIN + DESECHABLE</Text><TextInput placeholder="Usuario ej: garita3" style={s.inputFoto} value={pUser} onChangeText={setPUser} placeholderTextColor="#777" autoCapitalize="none"/><TextInput placeholder="Clave" style={s.inputFoto} value={pPass} onChangeText={setPPass} placeholderTextColor="#777"/><View style={{flexDirection:'row', gap:8, marginVertical:10, flexWrap:'wrap'}}><TouchableOpacity onPress={()=>setPRol('garita')} style={[s.chipRojo, pRol==='garita'&&{backgroundColor:'#1DB954'}]}><Text style={[s.chipTxt, pRol==='garita'&&{color:'#FFF'}]}>GARITA</Text></TouchableOpacity><TouchableOpacity onPress={()=>setPRol('admin')} style={[s.chipRojo, pRol==='admin'&&{backgroundColor:'#007AFF'}]}><Text style={[s.chipTxt, pRol==='admin'&&{color:'#FFF'}]}>ADMIN</Text></TouchableOpacity><TouchableOpacity onPress={()=>setPDesechable(!pDesechable)} style={[s.chipRojo, pDesechable&&{backgroundColor:'#FFB020'}]}><Text style={[s.chipTxt, pDesechable&&{color:'#000', fontWeight:'bold'}]}>{pDesechable?'DESECHABLE: SI ⏰':'DESECHABLE: NO'}</Text></TouchableOpacity></View>{pDesechable&&<><Text style={{color:'#FFB020', fontSize:11, marginBottom:4}}>Vence hoy a las:</Text><TextInput placeholder="08:00" style={[s.inputFoto,{borderColor:'#FFB020', borderWidth:1}]} value={pHoraVence} onChangeText={setPHoraVence} placeholderTextColor="#777"/></>}<TouchableOpacity style={[s.botonAgregar, pRol==='admin'&&!pDesechable&&{backgroundColor:'#007AFF'}, pDesechable&&{backgroundColor:'#FFB020'}]} onPress={agregarPersonal}><Text style={{color:pDesechable?'#000':'#FFF', textAlign:'center', fontWeight:'bold'}}>CREAR {pRol.toUpperCase()} {pDesechable?'(VENCE '+pHoraVence+')':''}</Text></TouchableOpacity>{personal.map(p=><View key={p.id} style={[s.filaFoto, p.rol==='admin'&&{borderColor:'#007AFF'}, p.desechable&&{borderColor:'#FFB020'}]}><Text style={{color:p.desechable?'#FFB020':p.rol==='admin'?'#007AFF':'#FFF', flex:1, fontSize:12}}>{p.desechable?'⏰':p.rol==='admin'?'👑':'👤'} {p.user} ({p.rol}) {p.desechable?'vence '+p.horaVence:''}</Text><TouchableOpacity onPress={()=>setPersonal(pr=>pr.filter(x=>x.id!==p.id))}><Text style={{color:'#FF3B30'}}>×</Text></TouchableOpacity></View>)}</>}
            {tabAdmin==='eventos'&&<>
              <TextInput placeholder="Nombre evento" style={s.inputFoto} value={eNombre} onChangeText={setENombre} placeholderTextColor="#777"/>
              <View style={{flexDirection:'row', gap:8}}><TextInput placeholder="Edad min 18" style={[s.inputFoto,{flex:1}]} value={eMin} onChangeText={setEMin} keyboardType="numeric" placeholderTextColor="#777"/><TextInput placeholder="Edad max 99" style={[s.inputFoto,{flex:1}]} value={eMax} onChangeText={setEMax} keyboardType="numeric" placeholderTextColor="#777"/></View>
              <TouchableOpacity style={s.botonAgregar} onPress={agregarEvento}><Text style={{color:'#FFF', textAlign:'center', fontWeight:'bold'}}>CREAR EVENTO</Text></TouchableOpacity>
              {eventos.map(ev=><View key={ev.id} style={[s.filaFoto, eventoActivoId===ev.id&&{backgroundColor:'#1DB954'}]}>
                <TouchableOpacity style={{flex:1}} onPress={()=>setEventoActivoId(ev.id)}><Text style={{color:'#FFF', flex:1}}>{ev.nombre} - {ev.minEdad} a {ev.maxEdad} {eventoActivoId===ev.id?'✓ ACTIVO':''}</Text></TouchableOpacity>
                <TouchableOpacity onPress={()=>{ Keyboard.dismiss(); setEventos(prev => prev.filter(x=>x.id!==ev.id)); if(eventoActivoId===ev.id) setEventoActivoId(null); }} style={{backgroundColor:'#FF3B30', paddingHorizontal:12, paddingVertical:6, borderRadius:8, marginLeft:8}}><Text style={{color:'#FFF', fontSize:12, fontWeight:'bold'}}>BORRAR</Text></TouchableOpacity>
              </View>)}
              <View style={{marginTop:20, backgroundColor:'#111', padding:12, borderRadius:12, borderWidth:1, borderColor:'#007AFF'}}>
                <Text style={{color:'#007AFF', fontWeight:'bold', fontSize:13}}>📤 EXPORTAR TODO (copia automático)</Text>
                <TouchableOpacity style={[s.botonAgregar,{backgroundColor:'#007AFF', marginTop:10}]} onPress={exportarTodo}><Text style={{color:'#FFF', textAlign:'center', fontWeight:'bold'}}>EXPORTAR Y COPIAR</Text></TouchableOpacity>
                <TextInput style={[s.inputFoto,{height:100, fontSize:9}]} value={codigoTraspaso} onChangeText={setCodigoTraspaso} multiline placeholderTextColor="#555" selectTextOnFocus={true} editable={true}/>
                <Text style={{color:'#AAA', fontSize:10, marginTop:12, fontWeight:'bold'}}>📥 IMPORTAR:</Text>
                <TouchableOpacity style={[s.botonAgregar,{backgroundColor:'#FF9500'}]} onPress={importarTodoAdmin}><Text style={{color:'#FFF', textAlign:'center', fontWeight:'bold'}}>📥 IMPORTAR TODO AHORA</Text></TouchableOpacity>
              </View>
            </>}
            {tabAdmin==='historial'&&<>
              <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center'}}>
                <Text style={{color:'#FFF', fontWeight:'bold'}}>HIST {historial.length}</Text>
                <TouchableOpacity onPress={()=>setHistorial([])}><Text style={{color:'#FF3B30'}}>BORRAR</Text></TouchableOpacity>
              </View>
              <View style={{backgroundColor:'#1E1E1E', padding:12, borderRadius:12, marginTop:10, borderWidth:1, borderColor:'#FF3B30'}}>
                <Text style={{color:'#FFF', fontWeight:'bold', fontSize:12}}>🚫 MANDAR A LISTA NEGRA DESDE HISTORIAL</Text>
                <TextInput placeholder="Motivo: ROBO / PELEA / DEUDA" style={[s.inputFoto,{borderColor:'#FF3B30', borderWidth:1}]} value={motivoBlack} onChangeText={setMotivoBlack} placeholderTextColor="#777"/>
                <View style={{flexDirection:'row', gap:8, marginTop:6}}>
                  <TouchableOpacity onPress={()=>setColorBlack('rojo')} style={[s.chipRojo, colorBlack==='rojo'&&{backgroundColor:'#FF3B30'}]}><Text style={[s.chipTxt, colorBlack==='rojo'&&{color:'#FFF'}]}>🔴 ROJO</Text></TouchableOpacity>
                  <TouchableOpacity onPress={()=>setColorBlack('amarillo')} style={[s.chipRojo, colorBlack==='amarillo'&&{backgroundColor:'#FFB020'}]}><Text style={[s.chipTxt, colorBlack==='amarillo'&&{color:'#000'}]}>🟡 AMARILLO</Text></TouchableOpacity>
                </View>
              </View>
              {historial.map(h=><View key={h.id} style={s.filaFoto}>
                <Text style={{color:'#FFF', fontSize:11, flex:1}}>{h.hora} {h.color==='rojo'?'🔴':h.color==='amarillo'?'🟡':'🟢'} {h.dni} {h.nombre}</Text>
                <TouchableOpacity onPress={()=>mandarAListaNegra(h)} style={{backgroundColor:'#FF3B30', paddingHorizontal:12, paddingVertical:8, borderRadius:8, marginLeft:8}}><Text style={{color:'#FFF', fontSize:10, fontWeight:'bold'}}>→ BLACK</Text></TouchableOpacity>
              </View>)}
            </>}
            <View style={{height:200}}/>
          </ScrollView>
        </View>
      </TouchableWithoutFeedback>
    )
  }

  return (
    <View style={{flex:1, backgroundColor:'#0E0E0E'}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', padding:8, paddingTop:50, backgroundColor:'#1A1A1A', alignItems:'center'}}><Text style={{color:'#FFF', fontSize:10, flex:1}}>{usuarioLogueado.user} | T:{historial.length} {usuarioLogueado.desechable?' ⏰ vence '+usuarioLogueado.horaVence:''}</Text><View style={{flexDirection:'row', gap:6}}><BotonTeclado/><TouchableOpacity onPress={()=>{Keyboard.dismiss(); setUsuarioLogueado(null);}} style={{backgroundColor:'#FF3B30', paddingHorizontal:10, paddingVertical:5, borderRadius:6}}><Text style={{color:'#FFF', fontWeight:'bold', fontSize:11}}>SALIR X</Text></TouchableOpacity></View></View>
      {ultimoEscaneo&&<View style={[s.cartelGrande, ultimoEscaneo.color==='rojo'?s.rojo:ultimoEscaneo.color==='amarillo'?s.amarillo:s.verde]}><Text style={{color:'#FFF', fontSize:32, fontWeight:'bold', textAlign:'center'}}>{textoEstado(ultimoEscaneo.color)}</Text><Text style={{color:'#FFF', textAlign:'center', fontSize:11}}>{ultimoEscaneo.dni} {ultimoEscaneo.nombre} - {ultimoEscaneo.motivo}</Text></View>}
      <Pressable style={{flex:1, backgroundColor:'#000', margin:8, borderRadius:12, overflow:'hidden', borderWidth:2, borderColor: ultimoEscaneo?.color==='rojo'?'red': ultimoEscaneo?.color==='amarillo'?'orange':'#1DB954'}} onPress={ocultarTeclado}>
        {!permission?.granted? <View style={{flex:1, justifyContent:'center', alignItems:'center'}}><TouchableOpacity style={s.botonAgregar} onPress={()=>requestPermission()}><Text style={{color:'#FFF'}}>DAR PERMISO</Text></TouchableOpacity></View> :
        <CameraView style={{flex:1}} facing="back" barcodeScannerSettings={{barcodeTypes:['pdf417','qr','code128','code39','aztec']}} onBarcodeScanned={({data})=>{ const d=data.toString(); const p=d.split('@'); let dni=p[4]||''; if(!dni){ const m=d.match(/\d{7,8}/); if(m) dni=m[0]; } verificar(dni||'S/DNI',p[2]||'',p[1]||''); }} />}
        <View style={s.overlay} pointerEvents="none"><View style={s.recuadro} /></View>
      </Pressable>
      <View style={{padding:8, backgroundColor:'#1A1A1A'}}>
        <Text style={{color:'#888', fontSize:9, marginBottom:4}}>CARGA MANUAL:</Text>
        <View style={{flexDirection:'row', gap:6}}>
          <TextInput placeholder="DNI" style={[s.inputFoto,{flex:1, marginVertical:0, fontSize:12}]} value={busquedaDni} onChangeText={setBusquedaDni} keyboardType="numeric" placeholderTextColor="#666"/>
          <TextInput placeholder="Nombre" style={[s.inputFoto,{flex:1, marginVertical:0, fontSize:12}]} value={busquedaNombreGarita} onChangeText={setBusquedaNombreGarita} placeholderTextColor="#666"/>
          <TextInput placeholder="Apellido" style={[s.inputFoto,{flex:1, marginVertical:0, fontSize:12}]} value={busquedaApellidoGarita} onChangeText={setBusquedaApellidoGarita} placeholderTextColor="#666"/>
          <TouchableOpacity style={{backgroundColor:'#1DB954', borderRadius:10, paddingHorizontal:16, justifyContent:'center'}} onPress={()=>{ if(!busquedaDni&&!busquedaNombreGarita) return; verificar(busquedaDni||'S/DNI',busquedaNombreGarita, busquedaApellidoGarita); setBusquedaDni(''); setBusquedaNombreGarita(''); setBusquedaApellidoGarita(''); Keyboard.dismiss(); }}><Text style={{color:'#FFF', fontWeight:'bold'}}>OK</Text></TouchableOpacity>
        </View>
        <View style={{flexDirection:'row', gap:8, marginTop:8}}><TouchableOpacity style={{backgroundColor:'#333', flex:1, padding:10, borderRadius:10}} onPress={exportarHistorialGarita}><Text style={{color:'#FFF', textAlign:'center', fontSize:11, fontWeight:'bold'}}>📤 EXPORTAR Y COPIAR AUTO ({historial.length})</Text></TouchableOpacity><BotonTeclado/></View>
        {codigoGarita? <TextInput style={[s.inputFoto,{height:60, fontSize:9, marginTop:8}]} value={codigoGarita} onChangeText={setCodigoGarita} multiline selectTextOnFocus={true} editable={true}/> : null}
      </View>
    </View>
  )
}
const s=StyleSheet.create({
  login:{flex:1, justifyContent:'center', padding:22, paddingTop:80},
  inputLogin:{backgroundColor:'#1E1E1E', color:'#FFF', padding:14, borderRadius:12, marginVertical:6},
  botonEntrar:{backgroundColor:'#1DB954', padding:14, borderRadius:12, marginTop:8},
  tabFoto:{backgroundColor:'#2A2A2A', paddingVertical:8, paddingHorizontal:14, borderRadius:20},
  tabFotoAct:{backgroundColor:'#1DB954'},
  tabFotoTxt:{color:'#777', fontSize:11, fontWeight:'bold'},
  inputFoto:{backgroundColor:'#1E1E1E', color:'#FFF', padding:14, borderRadius:12, marginVertical:6, fontSize:13},
  chipRojo:{backgroundColor:'#2A2A2A', paddingVertical:6, paddingHorizontal:14, borderRadius:20},
  chipTxt:{color:'#888', fontSize:10, fontWeight:'bold'},
  botonAgregar:{backgroundColor:'#1DB954', padding:14, borderRadius:12, marginVertical:6},
  filaFoto:{flexDirection:'row', backgroundColor:'#1E1E1E', padding:12, marginVertical:4, borderRadius:10, alignItems:'center', borderWidth:1, borderColor:'#222'},
  cartelGrande:{padding:12, margin:8, borderRadius:12}, verde:{backgroundColor:'#1DB954'}, rojo:{backgroundColor:'#FF3B30'}, amarillo:{backgroundColor:'#FFB020'},
  overlay:{position:'absolute', left:0, right:0, top:0, bottom:0, justifyContent:'center', alignItems:'center'},
  recuadro:{width:'88%', height:130, borderWidth:2, borderColor:'#1DB954', borderRadius:12, borderStyle:'dashed', backgroundColor:'rgba(29,185,84,0.05)'}
});