import { useState, useEffect, useRef } from 'react';
import {
  Plus, Mail, MessageSquare, Users, Briefcase, BarChart3, ArrowRightLeft,
  Check, X, HelpCircle, Download, Archive, Pencil, Trash2, Info, Leaf, Cpu, HeartHandshake, Building2
} from 'lucide-react';

// ---------------------------------------------------------------------
// Référentiel ECOTONE
// ---------------------------------------------------------------------
const ZONES = {
  vivante:   { label: 'Vivante',   color: '#0E7C7B', bg: '#E4F2F1', icon: Leaf },
  technique: { label: 'Technique', color: '#2541B2', bg: '#E8EAFC', icon: Cpu },
  sociale:   { label: 'Sociale',   color: '#B5650A', bg: '#FBEBD6', icon: HeartHandshake },
};
const TYPES_MISSION = ['FORMATION', 'FACILITATION', 'COACHING', 'CONSEIL', 'AUTRE'];
const URGENCES = ['Faible', 'Normale', 'Haute', 'Critique'];
const URGENCE_COLOR = { Faible: '#6B7280', Normale: '#2541B2', Haute: '#B5650A', Critique: '#C0392B' };
const STATUTS_MISSION = ['Brouillon', 'Publiée', 'En cours', 'Clôturée', 'Archivée'];
const STATUTS_REPONSE = { interesse: 'Intéressé', pas_dispo: 'Pas disponible', plus_info: "J'en veux plus" };
const STATUT_REPONSE_COLOR = { interesse: '#0E7C7B', pas_dispo: '#9CA3AF', plus_info: '#2541B2' };
const uid = () => Math.random().toString(36).slice(2, 9);

const SEED_CLIENTS = ['SMBTP', 'FRANCE TRAVAIL', 'TETRANERGY', 'CCIR', 'STARTWAVE', 'APM'].map(nom => ({ id: uid(), nom, notes: '' }));

const SEED_CONSULTANTS = [
  { id: uid(), nom: 'Shantala R.', email: 'shantala@example.com', tel: '+262 692 00 00 01',
    zones: ['vivante', 'sociale'], expertises: ['Posture créateur', 'Effectuation', 'Lippitt-Knoster'], disponible: true },
  { id: uid(), nom: 'Julien Resnais', email: 'julien.resnais@example.com', tel: '+262 692 00 00 02',
    zones: ['technique'], expertises: ['IA', 'Automatisation', 'Data'], disponible: true },
  { id: uid(), nom: 'Hawa Payet', email: 'hawa.payet@example.com', tel: '+262 692 00 00 03',
    zones: ['sociale', 'vivante'], expertises: ['Gouvernance vivante', 'QVT', 'Intelligence collective'], disponible: false },
];

const SEED_MISSIONS = [
  { id: uid(), titre: 'Facilitation atelier posture créateur', client: SEED_CLIENTS[0].nom,
    description: 'Animation d\'un atelier collectif sur la posture de créateur et l\'effectuation.',
    zones: ['sociale'], type: 'FACILITATION', tags: ['Posture créateur', 'Effectuation'],
    dureeH: 7, lieu: 'St Pierre', urgence: 'Normale', statut: 'Publiée', notifs: [] },
  { id: uid(), titre: 'Diagnostic automatisation atelier', client: SEED_CLIENTS[2].nom,
    description: 'Cartographie des flux et identification des gains d\'automatisation possibles.',
    zones: ['technique'], type: 'CONSEIL', tags: ['Automatisation', 'Data', 'Process'],
    dureeH: 14, lieu: 'Sud', urgence: 'Haute', statut: 'Publiée', notifs: [] },
  { id: uid(), titre: 'Coaching gouvernance vivante', client: SEED_CLIENTS[5].nom,
    description: 'Accompagnement du collectif dirigeant vers une gouvernance plus distribuée.',
    zones: ['sociale', 'vivante'], type: 'COACHING', tags: ['Gouvernance', 'Intelligence collective'],
    dureeH: 21, lieu: 'A distance', urgence: 'Normale', statut: 'Brouillon', notifs: [] },
];

// ---------------------------------------------------------------------
// UI helpers
// ---------------------------------------------------------------------
function ZoneChip({ z }) {
  const Z = ZONES[z];
  if (!Z) return null;
  const Icon = Z.icon;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
      style={{ background: Z.bg, color: Z.color }}>
      <Icon size={12} strokeWidth={2.5} /> {Z.label}
    </span>
  );
}

function Tag({ children }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 mr-1 mb-1">
      {children}
    </span>
  );
}

function Badge({ children, color }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: color + '1A', color }}>
      {children}
    </span>
  );
}

function Field({ label, children }) {
  return (
    <label className="block mb-3">
      <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1">{label}</span>
      {children}
    </label>
  );
}

const inputCls = "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0E7C7B] focus:border-transparent";

function Button({ children, onClick, variant = 'primary', icon: Icon, type = 'button', className = '' }) {
  const base = "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors";
  const styles = {
    primary: { background: '#0E7C7B', color: '#fff' },
    secondary: { background: '#fff', color: '#1F2933', border: '1px solid #D1D5DB' },
    ghost: { background: 'transparent', color: '#6B7280' },
    danger: { background: '#FEE2E2', color: '#B91C1C' },
  };
  return (
    <button type={type} onClick={onClick} className={`${base} ${className}`} style={styles[variant]}>
      {Icon && <Icon size={15} />}
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------
// App
// ---------------------------------------------------------------------
export default function App() {
  const [tab, setTab] = useState('missions');
  const [missions, setMissions] = useState(SEED_MISSIONS);
  const [consultants, setConsultants] = useState(SEED_CONSULTANTS);
  const [clients, setClients] = useState(SEED_CLIENTS);
  const [reponses, setReponses] = useState([]);
  const [pont, setPont] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [showMissionForm, setShowMissionForm] = useState(false);
  const [showConsultantForm, setShowConsultantForm] = useState(false);
  const [showClientForm, setShowClientForm] = useState(false);
  const [publicView, setPublicView] = useState(null); // { missionId, consultantId }
  const [activeConsultant, setActiveConsultant] = useState('');
  const [toast, setToast] = useState('');

  // ---- persistence via localStorage ----
  useEffect(() => {
    const keys = ['missions', 'consultants', 'clients', 'reponses', 'pont'];
    const setters = [setMissions, setConsultants, setClients, setReponses, setPont];
    for (let i = 0; i < keys.length; i++) {
      try {
        const raw = localStorage.getItem(`ecotone:${keys[i]}`);
        if (raw) setters[i](JSON.parse(raw));
      } catch (e) { /* données corrompues ou absentes : on garde les données par défaut */ }
    }
    setLoaded(true);
  }, []);

  function persist(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* stockage plein ou indisponible */ }
  }

  useEffect(() => { if (loaded) persist('ecotone:missions', JSON.stringify(missions)); }, [missions, loaded]);
  useEffect(() => { if (loaded) persist('ecotone:consultants', JSON.stringify(consultants)); }, [consultants, loaded]);
  useEffect(() => { if (loaded) persist('ecotone:clients', JSON.stringify(clients)); }, [clients, loaded]);
  useEffect(() => { if (loaded) persist('ecotone:reponses', JSON.stringify(reponses)); }, [reponses, loaded]);
  useEffect(() => { if (loaded) persist('ecotone:pont', JSON.stringify(pont)); }, [pont, loaded]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(''), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  // ---- derived ----
  const matchingConsultants = (mission) =>
    consultants.filter(c => c.disponible && c.zones.some(z => mission.zones.includes(z)));

  // ---- mission actions ----
  function addMission(m) {
    const matches = matchingConsultants(m);
    const notifs = matches.flatMap(c => [
      { id: uid(), consultantId: c.id, canal: 'email', date: new Date().toISOString() },
      { id: uid(), consultantId: c.id, canal: 'sms', date: new Date().toISOString() },
    ]);
    const mission = { ...m, id: uid(), notifs };
    setMissions(prev => [mission, ...prev]);
    setShowMissionForm(false);
    setToast(`Mission publiée — ${matches.length} consultant(s) notifié(s) par email + SMS`);
  }

  function setMissionStatut(id, statut) {
    setMissions(prev => prev.map(m => m.id === id ? { ...m, statut } : m));
  }
  function deleteMission(id) {
    setMissions(prev => prev.filter(m => m.id !== id));
    setReponses(prev => prev.filter(r => r.missionId !== id));
  }

  // ---- consultant actions ----
  function addConsultant(c) {
    setConsultants(prev => [...prev, { ...c, id: uid() }]);
    setShowConsultantForm(false);
  }
  function toggleDispo(id) {
    setConsultants(prev => prev.map(c => c.id === id ? { ...c, disponible: !c.disponible } : c));
  }

  // ---- clients (entreprises) ----
  function addClient(c) {
    const client = { ...c, id: uid() };
    setClients(prev => [...prev, client]);
    return client;
  }
  function removeClient(id) {
    setClients(prev => prev.filter(c => c.id !== id));
  }

  // ---- réponses ----
  function respond(missionId, consultantId, statut) {
    setReponses(prev => {
      const exists = prev.find(r => r.missionId === missionId && r.consultantId === consultantId);
      if (exists) return prev.map(r => r === exists ? { ...r, statut, date: new Date().toISOString(), validee: false } : r);
      return [...prev, { id: uid(), missionId, consultantId, statut, date: new Date().toISOString(), validee: false }];
    });
  }

  // ---- pont vers facturation ----
  function validerVersPont(reponse) {
    const mission = missions.find(m => m.id === reponse.missionId);
    const consultant = consultants.find(c => c.id === reponse.consultantId);
    if (!mission || !consultant) return;
    setReponses(prev => prev.map(r => r.id === reponse.id ? { ...r, validee: true } : r));
    setPont(prev => [...prev, {
      id: uid(), missionId: mission.id, consultantId: consultant.id,
      date: '', prestataire: consultant.nom, client: mission.client,
      type: mission.type, programme: mission.titre,
      detail: mission.description, bloc: mission.tags.join(', '),
      lieu: mission.lieu, nbHeures: mission.dureeH, tarifHoraire: '',
      tva: 0, facture: '', commentaire: `Issu d'ECOTONE — mission #${mission.id}`,
    }]);
    setToast('Prestation ajoutée au pont vers le tableau de bord');
  }

  function updatePontRow(id, field, value) {
    setPont(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  }
  function removePontRow(id) {
    setPont(prev => prev.filter(p => p.id !== id));
  }

  function exportCSV() {
    const headers = ['Date','Jour','Mois','Année','Prestataire','Client','Type de mission','Programme / Module',
      'Détail séance','Bloc de compétences','Lieu','Heure début','Heure fin','Nb heures',
      'Tarif horaire vente HT (€)','Montant HT (€)','Taux TVA','Montant TTC (€)',
      'Coût horaire prestataire HT (€)','Coût prestataire HT (€)','Marge HT (€)','Taux de marge','N° Facture','Commentaire'];
    const rows = pont.map(p => [
      p.date, '', '', '', p.prestataire, p.client, p.type, p.programme, p.detail, p.bloc, p.lieu,
      '', '', p.nbHeures, p.tarifHoraire, '', p.tva, '', '', '', '', '', p.facture, p.commentaire
    ]);
    const csv = [headers, ...rows].map(r =>
      r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(';')
    ).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ecotone_export_prestations.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ---- KPIs ----
  const missionsActives = missions.filter(m => ['Publiée', 'En cours'].includes(m.statut)).length;
  const totalNotifs = missions.reduce((s, m) => s + m.notifs.length, 0);
  const tauxReponse = totalNotifs > 0
    ? Math.round((reponses.length / (totalNotifs / 2)) * 100)
    : 0;
  const consultantsEngages = [...new Set(reponses.filter(r => r.statut === 'interesse').map(r => r.consultantId))].length;

  const TABS = [
    { id: 'missions', label: 'Missions', icon: Briefcase },
    { id: 'annuaire', label: 'Annuaire consultants', icon: Users },
    { id: 'clients', label: 'Entreprises clientes', icon: Building2 },
    { id: 'espace', label: 'Espace consultant (test)', icon: MessageSquare },
    { id: 'dashboard', label: 'Tableau de bord admin', icon: BarChart3 },
    { id: 'pont', label: 'Pont vers facturation', icon: ArrowRightLeft },
  ];

  // ---- vue publique simulée (lien reçu par le consultant) ----
  if (publicView) {
    const m = missions.find(mm => mm.id === publicView.missionId);
    const c = consultants.find(cc => cc.id === publicView.consultantId);
    if (m && c) {
      return <PublicMissionPage mission={m} consultant={c} reponses={reponses} respond={respond} onClose={() => setPublicView(null)} />;
    }
  }

  return (
    <div className="min-h-screen" style={{ background: '#F7F9F8', fontFamily: 'ui-sans-serif, system-ui' }}>
      {/* Header */}
      <div style={{ background: '#1F2933' }} className="px-6 py-5">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-9 rounded-md overflow-hidden" style={{ width: 54 }}>
              <div style={{ background: ZONES.vivante.color, width: '33.3%' }} />
              <div style={{ background: ZONES.technique.color, width: '33.3%' }} />
              <div style={{ background: ZONES.sociale.color, width: '33.3%' }} />
            </div>
            <div>
              <h1 className="text-white font-bold text-xl tracking-tight">ECOTONE</h1>
              <p className="text-gray-400 text-xs">Prototype V1 — mise en relation Carbon Conseil ↔ consultants à impact</p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div className="border-b border-gray-200 bg-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 flex gap-1 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            const active = tab === t.id;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap"
                style={{ borderColor: active ? '#0E7C7B' : 'transparent', color: active ? '#0E7C7B' : '#6B7280' }}>
                <Icon size={15} /> {t.label}
                {t.id === 'pont' && pont.length > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold" style={{ background: '#0E7C7B', color: '#fff' }}>{pont.length}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        {tab === 'missions' && (
          <MissionsTab
            missions={missions} consultants={consultants}
            clients={clients} addClient={addClient}
            matchingConsultants={matchingConsultants}
            showForm={showMissionForm} setShowForm={setShowMissionForm}
            addMission={addMission} setMissionStatut={setMissionStatut} deleteMission={deleteMission}
            setPublicView={setPublicView}
          />
        )}
        {tab === 'annuaire' && (
          <AnnuaireTab consultants={consultants} reponses={reponses}
            showForm={showConsultantForm} setShowForm={setShowConsultantForm}
            addConsultant={addConsultant} toggleDispo={toggleDispo} />
        )}
        {tab === 'clients' && (
          <ClientsTab clients={clients} missions={missions}
            showForm={showClientForm} setShowForm={setShowClientForm}
            addClient={addClient} removeClient={removeClient} />
        )}
        {tab === 'espace' && (
          <EspaceConsultantTab consultants={consultants} missions={missions} reponses={reponses}
            activeConsultant={activeConsultant} setActiveConsultant={setActiveConsultant}
            respond={respond} setPublicView={setPublicView} />
        )}
        {tab === 'dashboard' && (
          <DashboardTab missions={missions} consultants={consultants} reponses={reponses}
            missionsActives={missionsActives} totalNotifs={totalNotifs}
            tauxReponse={tauxReponse} consultantsEngages={consultantsEngages}
            validerVersPont={validerVersPont} />
        )}
        {tab === 'pont' && (
          <PontTab pont={pont} updatePontRow={updatePontRow} removePontRow={removePontRow} exportCSV={exportCSV} />
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 bg-[#1F2933] text-white px-4 py-3 rounded-lg shadow-lg text-sm flex items-center gap-2">
          <Check size={16} style={{ color: '#0E7C7B' }} /> {toast}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// MISSIONS
// ---------------------------------------------------------------------
function MissionsTab({ missions, matchingConsultants, clients, addClient, showForm, setShowForm, addMission, setMissionStatut, deleteMission, setPublicView }) {
  const [form, setForm] = useState({
    titre: '', client: clients[0]?.nom || '', description: '', zones: [], type: TYPES_MISSION[0],
    tags: '', dureeH: '', lieu: '', urgence: 'Normale', statut: 'Publiée',
  });
  const [nouveauClient, setNouveauClient] = useState('');

  function submit(e) {
    e.preventDefault();
    if (!form.titre || form.zones.length === 0) return;
    let client = form.client;
    if (form.client === '__new__') {
      if (!nouveauClient.trim()) return;
      addClient({ nom: nouveauClient.trim(), notes: '' });
      client = nouveauClient.trim();
    }
    addMission({ ...form, client, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), dureeH: Number(form.dureeH) || 0 });
    setForm({ titre: '', client: clients[0]?.nom || '', description: '', zones: [], type: TYPES_MISSION[0], tags: '', dureeH: '', lieu: '', urgence: 'Normale', statut: 'Publiée' });
    setNouveauClient('');
  }

  function toggleZone(z) {
    setForm(f => ({ ...f, zones: f.zones.includes(z) ? f.zones.filter(x => x !== z) : [...f.zones, z] }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#1F2933]">Missions</h2>
        <Button onClick={() => setShowForm(s => !s)} icon={Plus}>{showForm ? 'Fermer' : 'Nouvelle mission'}</Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 grid grid-cols-2 gap-4">
          <Field label="Titre de la mission">
            <input className={inputCls} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Ex : Facilitation atelier RCOV" required />
          </Field>
          <Field label="Client">
            <select className={inputCls} value={form.client} onChange={e => setForm({ ...form, client: e.target.value })}>
              {clients.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
              <option value="__new__">+ Nouvelle entreprise...</option>
            </select>
            {form.client === '__new__' && (
              <input className={`${inputCls} mt-2`} value={nouveauClient} onChange={e => setNouveauClient(e.target.value)}
                placeholder="Nom de la nouvelle entreprise" required />
            )}
          </Field>
          <div className="col-span-2">
            <Field label="Description">
              <textarea className={inputCls} rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Contexte, objectifs, livrables attendus..." />
            </Field>
          </div>
          <div className="col-span-2">
            <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Zone(s) ECOTONE</span>
            <div className="flex gap-2">
              {Object.entries(ZONES).map(([k, z]) => {
                const Icon = z.icon; const active = form.zones.includes(k);
                return (
                  <button key={k} type="button" onClick={() => toggleZone(k)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border"
                    style={{ background: active ? z.bg : '#fff', color: active ? z.color : '#6B7280', borderColor: active ? z.color : '#D1D5DB' }}>
                    <Icon size={14} /> {z.label}
                  </button>
                );
              })}
            </div>
          </div>
          <Field label="Type de mission (facturation)">
            <select className={inputCls} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
              {TYPES_MISSION.map(t => <option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Compétences recherchées (séparées par des virgules)">
            <input className={inputCls} value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="Ex : IA, Data, Automatisation" />
          </Field>
          <Field label="Durée estimée (heures)">
            <input type="number" className={inputCls} value={form.dureeH} onChange={e => setForm({ ...form, dureeH: e.target.value })} placeholder="Ex : 14" />
          </Field>
          <Field label="Lieu / distanciel">
            <input className={inputCls} value={form.lieu} onChange={e => setForm({ ...form, lieu: e.target.value })} placeholder="Ex : St Pierre / A distance" />
          </Field>
          <Field label="Niveau d'urgence">
            <select className={inputCls} value={form.urgence} onChange={e => setForm({ ...form, urgence: e.target.value })}>
              {URGENCES.map(u => <option key={u}>{u}</option>)}
            </select>
          </Field>
          <Field label="Statut">
            <select className={inputCls} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
              {STATUTS_MISSION.map(s => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <div className="col-span-2 flex justify-end">
            <Button type="submit">Publier la mission</Button>
          </div>
        </form>
      )}

      <div className="grid gap-3">
        {missions.length === 0 && <p className="text-sm text-gray-500">Aucune mission pour le moment.</p>}
        {missions.map(m => {
          const matches = matchingConsultants(m);
          return (
            <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-bold text-[#1F2933]">{m.titre}</h3>
                    <Badge color="#6B7280">{m.client}</Badge>
                    <Badge color={URGENCE_COLOR[m.urgence]}>{m.urgence}</Badge>
                    <Badge color={m.statut === 'Publiée' ? '#0E7C7B' : m.statut === 'Brouillon' ? '#9CA3AF' : '#2541B2'}>{m.statut}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{m.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {m.zones.map(z => <ZoneChip key={z} z={z} />)}
                    {m.tags.map(t => <Tag key={t}>{t}</Tag>)}
                  </div>
                  <div className="text-xs text-gray-500 flex gap-4 flex-wrap">
                    <span>{m.dureeH ? `${m.dureeH} h estimées` : 'Durée non précisée'}</span>
                    <span>{m.lieu || 'Lieu non précisé'}</span>
                    <span><Type type={m.type} /></span>
                  </div>
                  {m.statut === 'Publiée' && (
                    <div className="mt-2 text-xs text-gray-500">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="flex items-center gap-1"><Mail size={12} /> {matches.length} email(s)</span>
                        <span className="flex items-center gap-1"><MessageSquare size={12} /> {matches.length} SMS</span>
                        {matches.length === 0 && <span>aucun consultant correspondant</span>}
                      </div>
                      {matches.map(c => (
                        <div key={c.id} className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] text-gray-400">
                            ecotone.carbonconseil.com/m/{m.id}.{c.id}
                          </span>
                          <span>→ {c.nom}</span>
                          <button onClick={() => setPublicView({ missionId: m.id, consultantId: c.id })}
                            className="text-[11px] underline text-[#0E7C7B]">
                            Tester ce lien
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <select value={m.statut} onChange={e => setMissionStatut(m.id, e.target.value)}
                    className="text-xs border border-gray-300 rounded px-2 py-1">
                    {STATUTS_MISSION.map(s => <option key={s}>{s}</option>)}
                  </select>
                  <button onClick={() => deleteMission(m.id)} className="text-gray-400 hover:text-red-500 p-1">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Type({ type }) {
  return <span className="font-medium" style={{ color: '#1F2933' }}>{type}</span>;
}

// ---------------------------------------------------------------------
// FICHE MISSION PUBLIQUE (ce que reçoit un consultant via son lien)
// ---------------------------------------------------------------------
function PublicMissionPage({ mission, consultant, reponses, respond, onClose }) {
  const rep = reponses.find(r => r.missionId === mission.id && r.consultantId === consultant.id);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#F7F9F8', fontFamily: 'ui-sans-serif, system-ui' }}>
      <div style={{ background: '#1F2933' }} className="px-6 py-4">
        <div className="max-w-xl mx-auto flex items-center gap-3">
          <div className="flex h-7 rounded overflow-hidden" style={{ width: 42 }}>
            <div style={{ background: ZONES.vivante.color, width: '33.3%' }} />
            <div style={{ background: ZONES.technique.color, width: '33.3%' }} />
            <div style={{ background: ZONES.sociale.color, width: '33.3%' }} />
          </div>
          <div>
            <div className="text-white font-bold text-sm tracking-tight">ECOTONE · Carbon Conseil</div>
            <div className="text-gray-400 text-xs">Proposition de mission pour {consultant.nom}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="max-w-xl w-full bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {mission.zones.map(z => <ZoneChip key={z} z={z} />)}
            <Badge color={URGENCE_COLOR[mission.urgence]}>Urgence : {mission.urgence}</Badge>
          </div>
          <h1 className="text-xl font-bold text-[#1F2933] mb-1">{mission.titre}</h1>
          <div className="text-sm text-gray-500 mb-4">Client : {mission.client} · {mission.type}</div>
          <p className="text-sm text-gray-700 mb-5 leading-relaxed">{mission.description || 'Pas de description complémentaire.'}</p>

          <div className="grid grid-cols-2 gap-3 text-sm mb-4">
            <div>
              <div className="text-xs uppercase text-gray-400 font-semibold mb-0.5">Durée estimée</div>
              <div className="text-[#1F2933]">{mission.dureeH ? `${mission.dureeH} h` : 'À préciser'}</div>
            </div>
            <div>
              <div className="text-xs uppercase text-gray-400 font-semibold mb-0.5">Lieu</div>
              <div className="text-[#1F2933]">{mission.lieu || 'À préciser'}</div>
            </div>
          </div>

          {mission.tags.length > 0 && (
            <div className="mb-6">
              <div className="text-xs uppercase text-gray-400 font-semibold mb-1">Compétences recherchées</div>
              <div className="flex flex-wrap">{mission.tags.map(t => <Tag key={t}>{t}</Tag>)}</div>
            </div>
          )}

          {!rep && (
            <>
              <p className="text-sm font-medium text-[#1F2933] mb-3">Cette mission vous intéresse-t-elle ?</p>
              <div className="flex gap-2 flex-wrap">
                <Button icon={Check} onClick={() => respond(mission.id, consultant.id, 'interesse')}>Intéressé</Button>
                <Button variant="secondary" icon={X} onClick={() => respond(mission.id, consultant.id, 'pas_dispo')}>Pas disponible</Button>
                <Button variant="secondary" icon={HelpCircle} onClick={() => respond(mission.id, consultant.id, 'plus_info')}>J'en veux plus</Button>
              </div>
            </>
          )}

          {rep && (
            <div className="rounded-lg p-4 text-sm" style={{ background: STATUT_REPONSE_COLOR[rep.statut] + '1A', color: STATUT_REPONSE_COLOR[rep.statut] }}>
              <div className="font-semibold mb-1">Merci, votre réponse a été transmise à Carbon Conseil.</div>
              <div>Vous avez indiqué : {STATUTS_REPONSE[rep.statut]}</div>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-5">
            Vous recevez cette proposition car votre profil correspond aux zones et compétences de cette mission.
          </p>
        </div>
      </div>

      <div className="text-center pb-6">
        <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 underline">
          ← Quitter l'aperçu et revenir à l'administration (mode test)
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// ENTREPRISES CLIENTES
// ---------------------------------------------------------------------
function ClientsTab({ clients, missions, showForm, setShowForm, addClient, removeClient }) {
  const [form, setForm] = useState({ nom: '', notes: '' });

  function submit(e) {
    e.preventDefault();
    if (!form.nom.trim()) return;
    addClient({ nom: form.nom.trim(), notes: form.notes.trim() });
    setForm({ nom: '', notes: '' });
    setShowForm(false);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#1F2933]">Entreprises clientes</h2>
        <Button onClick={() => setShowForm(s => !s)} icon={Plus}>{showForm ? 'Fermer' : 'Nouvelle entreprise'}</Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 grid grid-cols-2 gap-4">
          <Field label="Nom de l'entreprise">
            <input className={inputCls} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} placeholder="Ex : NOUVELLE ENTREPRISE" required />
          </Field>
          <Field label="Notes (secteur, contact...)">
            <input className={inputCls} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Optionnel" />
          </Field>
          <div className="col-span-2 flex justify-end"><Button type="submit">Ajouter</Button></div>
        </form>
      )}

      <div className="grid gap-3">
        {clients.map(c => {
          const nbMissions = missions.filter(m => m.client === c.nom).length;
          return (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="font-bold text-[#1F2933]">{c.nom}</h3>
                {c.notes && <p className="text-sm text-gray-500 mt-1">{c.notes}</p>}
                <div className="text-xs text-gray-500 mt-2">{nbMissions} mission(s) enregistrée(s)</div>
              </div>
              <button onClick={() => removeClient(c.id)} className="text-gray-400 hover:text-red-500 p-1" title="Retirer">
                <Trash2 size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// ANNUAIRE
// ---------------------------------------------------------------------
function AnnuaireTab({ consultants, reponses, showForm, setShowForm, addConsultant, toggleDispo }) {
  const [form, setForm] = useState({ nom: '', email: '', tel: '', zones: [], expertises: '', disponible: true });

  function submit(e) {
    e.preventDefault();
    if (!form.nom) return;
    addConsultant({ ...form, expertises: form.expertises.split(',').map(s => s.trim()).filter(Boolean) });
    setForm({ nom: '', email: '', tel: '', zones: [], expertises: '', disponible: true });
  }
  function toggleZone(z) {
    setForm(f => ({ ...f, zones: f.zones.includes(z) ? f.zones.filter(x => x !== z) : [...f.zones, z] }));
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-[#1F2933]">Annuaire consultants</h2>
        <Button onClick={() => setShowForm(s => !s)} icon={Plus}>{showForm ? 'Fermer' : 'Nouveau consultant'}</Button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-xl p-5 mb-6 grid grid-cols-2 gap-4">
          <Field label="Nom"><input className={inputCls} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required /></Field>
          <Field label="Email"><input className={inputCls} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></Field>
          <Field label="Téléphone"><input className={inputCls} value={form.tel} onChange={e => setForm({ ...form, tel: e.target.value })} /></Field>
          <Field label="Disponibilité">
            <select className={inputCls} value={form.disponible ? '1' : '0'} onChange={e => setForm({ ...form, disponible: e.target.value === '1' })}>
              <option value="1">Disponible</option><option value="0">Non disponible</option>
            </select>
          </Field>
          <div className="col-span-2">
            <span className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Zone(s) ECOTONE</span>
            <div className="flex gap-2">
              {Object.entries(ZONES).map(([k, z]) => {
                const Icon = z.icon; const active = form.zones.includes(k);
                return (
                  <button key={k} type="button" onClick={() => toggleZone(k)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium border"
                    style={{ background: active ? z.bg : '#fff', color: active ? z.color : '#6B7280', borderColor: active ? z.color : '#D1D5DB' }}>
                    <Icon size={14} /> {z.label}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="col-span-2">
            <Field label="Expertises (séparées par des virgules)">
              <input className={inputCls} value={form.expertises} onChange={e => setForm({ ...form, expertises: e.target.value })} placeholder="Ex : Lippitt-Knoster, RCOV, Biomimétisme" />
            </Field>
          </div>
          <div className="col-span-2 flex justify-end"><Button type="submit">Ajouter au vivier</Button></div>
        </form>
      )}

      <div className="grid gap-3">
        {consultants.map(c => {
          const hist = reponses.filter(r => r.consultantId === c.id);
          return (
            <div key={c.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-[#1F2933]">{c.nom}</h3>
                  {c.zones.map(z => <ZoneChip key={z} z={z} />)}
                  <Badge color={c.disponible ? '#0E7C7B' : '#9CA3AF'}>{c.disponible ? 'Disponible' : 'Non disponible'}</Badge>
                </div>
                <div className="text-xs text-gray-500 mb-2">{c.email}{c.tel ? ` · ${c.tel}` : ''}</div>
                <div className="flex flex-wrap gap-1 mb-1">{c.expertises.map(t => <Tag key={t}>{t}</Tag>)}</div>
                <div className="text-xs text-gray-500">{hist.length} réponse(s) enregistrée(s)</div>
              </div>
              <button onClick={() => toggleDispo(c.id)} className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 hover:bg-gray-50">
                {c.disponible ? 'Marquer indisponible' : 'Marquer disponible'}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// ESPACE CONSULTANT (simulation)
// ---------------------------------------------------------------------
function EspaceConsultantTab({ consultants, missions, reponses, activeConsultant, setActiveConsultant, respond, setPublicView }) {
  const consultant = consultants.find(c => c.id === activeConsultant);
  const mesReponses = reponses.filter(r => r.consultantId === activeConsultant);
  const missionsPourMoi = consultant
    ? missions.filter(m => m.statut === 'Publiée' && m.zones.some(z => consultant.zones.includes(z)))
    : [];

  return (
    <div>
      <h2 className="text-lg font-bold text-[#1F2933] mb-1">Espace consultant — vue de test</h2>
      <p className="text-sm text-gray-500 mb-4 flex items-center gap-1"><Info size={14} /> Sélectionnez un consultant pour simuler ce qu'il reçoit et comment il répond.</p>
      <select className={`${inputCls} max-w-xs mb-6`} value={activeConsultant} onChange={e => setActiveConsultant(e.target.value)}>
        <option value="">— Choisir un consultant —</option>
        {consultants.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
      </select>

      {!consultant && <p className="text-sm text-gray-500">Aucun consultant sélectionné.</p>}

      {consultant && (
        <div className="grid gap-3">
          {missionsPourMoi.length === 0 && <p className="text-sm text-gray-500">Aucune mission publiée ne correspond actuellement à vos zones.</p>}
          {missionsPourMoi.map(m => {
            const rep = mesReponses.find(r => r.missionId === m.id);
            return (
              <div key={m.id} className="bg-white border border-gray-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-bold text-[#1F2933]">{m.titre}</h3>
                  <Badge color="#6B7280">{m.client}</Badge>
                  {m.zones.map(z => <ZoneChip key={z} z={z} />)}
                </div>
                <p className="text-sm text-gray-600 mb-2">{m.description}</p>
                <div className="text-xs text-gray-500 mb-3">{m.dureeH} h estimées · {m.lieu}</div>
                <div className="mb-3">
                  <button onClick={() => setPublicView({ missionId: m.id, consultantId: consultant.id })}
                    className="text-xs underline text-[#0E7C7B]">
                    Voir la page reçue par email / SMS →
                  </button>
                </div>
                <div className="flex gap-2">
                  <Button variant={rep?.statut === 'interesse' ? 'primary' : 'secondary'} icon={Check} onClick={() => respond(m.id, consultant.id, 'interesse')}>Intéressé</Button>
                  <Button variant={rep?.statut === 'pas_dispo' ? 'primary' : 'secondary'} icon={X} onClick={() => respond(m.id, consultant.id, 'pas_dispo')}>Pas disponible</Button>
                  <Button variant={rep?.statut === 'plus_info' ? 'primary' : 'secondary'} icon={HelpCircle} onClick={() => respond(m.id, consultant.id, 'plus_info')}>J'en veux plus</Button>
                </div>
                {rep && <div className="mt-2 text-xs" style={{ color: STATUT_REPONSE_COLOR[rep.statut] }}>Réponse enregistrée : {STATUTS_REPONSE[rep.statut]}</div>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// DASHBOARD ADMIN
// ---------------------------------------------------------------------
function DashboardTab({ missions, consultants, reponses, missionsActives, totalNotifs, tauxReponse, consultantsEngages, validerVersPont }) {
  const [filtreZone, setFiltreZone] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');

  const rows = reponses.filter(r => {
    const m = missions.find(mm => mm.id === r.missionId);
    if (!m) return false;
    if (filtreZone && !m.zones.includes(filtreZone)) return false;
    if (filtreStatut && r.statut !== filtreStatut) return false;
    return true;
  });

  const perfParZone = Object.entries(ZONES).map(([k, z]) => {
    const ms = missions.filter(m => m.zones.includes(k));
    const reps = reponses.filter(r => ms.some(m => m.id === r.missionId));
    const positives = reps.filter(r => r.statut === 'interesse').length;
    return { zone: k, label: z.label, color: z.color, missions: ms.length, reponses: reps.length, positives };
  });

  return (
    <div>
      <h2 className="text-lg font-bold text-[#1F2933] mb-4">Tableau de bord administrateur</h2>

      <div className="grid grid-cols-4 gap-3 mb-6">
        <Kpi label="Missions actives" value={missionsActives} />
        <Kpi label="Notifications envoyées" value={totalNotifs} />
        <Kpi label="Taux de réponse" value={`${tauxReponse}%`} />
        <Kpi label="Consultants engagés" value={consultantsEngages} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        {perfParZone.map(p => (
          <div key={p.zone} className="bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2"><ZoneChip z={p.zone} /></div>
            <div className="text-sm text-gray-600">{p.missions} mission(s) · {p.reponses} réponse(s)</div>
            <div className="text-xs text-gray-500 mt-1">{p.positives} marquée(s) "Intéressé"</div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-2">
        <h3 className="font-bold text-[#1F2933]">Réponses des consultants</h3>
        <div className="flex gap-2">
          <select className="text-xs border border-gray-300 rounded px-2 py-1" value={filtreZone} onChange={e => setFiltreZone(e.target.value)}>
            <option value="">Toutes les zones</option>
            {Object.entries(ZONES).map(([k, z]) => <option key={k} value={k}>{z.label}</option>)}
          </select>
          <select className="text-xs border border-gray-300 rounded px-2 py-1" value={filtreStatut} onChange={e => setFiltreStatut(e.target.value)}>
            <option value="">Tous les statuts</option>
            {Object.entries(STATUTS_REPONSE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Mission</th><th className="px-4 py-2">Consultant</th>
              <th className="px-4 py-2">Zones</th><th className="px-4 py-2">Réponse</th>
              <th className="px-4 py-2">Date</th><th className="px-4 py-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={6} className="px-4 py-4 text-center text-gray-400">Aucune réponse pour le moment.</td></tr>}
            {rows.map(r => {
              const m = missions.find(mm => mm.id === r.missionId);
              const c = consultants.find(cc => cc.id === r.consultantId);
              return (
                <tr key={r.id} className="border-t border-gray-100">
                  <td className="px-4 py-2 font-medium text-[#1F2933]">{m?.titre}</td>
                  <td className="px-4 py-2">{c?.nom}</td>
                  <td className="px-4 py-2"><div className="flex gap-1">{m?.zones.map(z => <ZoneChip key={z} z={z} />)}</div></td>
                  <td className="px-4 py-2"><Badge color={STATUT_REPONSE_COLOR[r.statut]}>{STATUTS_REPONSE[r.statut]}</Badge></td>
                  <td className="px-4 py-2 text-gray-500">{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                  <td className="px-4 py-2">
                    {r.statut === 'interesse' && !r.validee && (
                      <Button variant="secondary" icon={ArrowRightLeft} onClick={() => validerVersPont(r)}>Valider → prestation</Button>
                    )}
                    {r.validee && <span className="text-xs text-gray-400">Envoyé au pont</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4">
      <div className="text-2xl font-bold" style={{ color: '#0E7C7B' }}>{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

// ---------------------------------------------------------------------
// PONT VERS FACTURATION
// ---------------------------------------------------------------------
function PontTab({ pont, updatePontRow, removePontRow, exportCSV }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-[#1F2933] mb-1">Pont vers le tableau de bord d'activité</h2>
      <p className="text-sm text-gray-500 mb-4 max-w-3xl">
        Chaque ligne ci-dessous correspond à une réponse "Intéressé" validée par l'administrateur.
        Complétez la date, le nombre d'heures, le tarif horaire et le N° de facture, puis exportez en CSV.
        Collez ensuite ces valeurs dans les colonnes correspondantes (A, E à K, N, O, Q, W, X) de l'onglet
        <strong> PRESTATIONS</strong> du tableau de bord Carbon Conseil — les colonnes calculées (montants, marge...) se mettront à jour automatiquement.
      </p>

      {pont.length === 0 && <p className="text-sm text-gray-500">Aucune prestation en attente. Validez une réponse "Intéressé" depuis le tableau de bord admin.</p>}

      {pont.length > 0 && (
        <>
          <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto mb-4">
            <table className="w-full text-sm min-w-[1100px]">
              <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-3 py-2">Date</th><th className="px-3 py-2">Prestataire</th>
                  <th className="px-3 py-2">Client</th><th className="px-3 py-2">Type</th>
                  <th className="px-3 py-2">Programme</th><th className="px-3 py-2">Lieu</th>
                  <th className="px-3 py-2">Nb heures</th><th className="px-3 py-2">Tarif h. HT (€)</th>
                  <th className="px-3 py-2">N° Facture</th><th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {pont.map(p => (
                  <tr key={p.id} className="border-t border-gray-100">
                    <td className="px-3 py-2"><input type="date" className="border border-gray-300 rounded px-2 py-1 text-xs" value={p.date} onChange={e => updatePontRow(p.id, 'date', e.target.value)} /></td>
                    <td className="px-3 py-2 font-medium">{p.prestataire}</td>
                    <td className="px-3 py-2">{p.client}</td>
                    <td className="px-3 py-2">{p.type}</td>
                    <td className="px-3 py-2 max-w-[200px] truncate" title={p.programme}>{p.programme}</td>
                    <td className="px-3 py-2">{p.lieu}</td>
                    <td className="px-3 py-2"><input type="number" className="border border-gray-300 rounded px-2 py-1 text-xs w-20" value={p.nbHeures} onChange={e => updatePontRow(p.id, 'nbHeures', e.target.value)} /></td>
                    <td className="px-3 py-2"><input type="number" className="border border-gray-300 rounded px-2 py-1 text-xs w-24" value={p.tarifHoraire} onChange={e => updatePontRow(p.id, 'tarifHoraire', e.target.value)} placeholder="€/h" /></td>
                    <td className="px-3 py-2"><input className="border border-gray-300 rounded px-2 py-1 text-xs w-32" value={p.facture} onChange={e => updatePontRow(p.id, 'facture', e.target.value)} placeholder="F2026-..." /></td>
                    <td className="px-3 py-2"><button onClick={() => removePontRow(p.id)} className="text-gray-400 hover:text-red-500"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button onClick={exportCSV} icon={Download}>Exporter CSV (format PRESTATIONS)</Button>
        </>
      )}
    </div>
  );
}
