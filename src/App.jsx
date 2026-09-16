import { useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Clock3,
  Dumbbell,
  Flame,
  Grid2X2,
  HeartPulse,
  Home,
  Menu,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Sparkles,
  Target,
  Trophy,
  UserRound,
  X,
} from 'lucide-react'

const navItems = [
  { label: 'Visão geral', icon: Home },
  { label: 'Meus treinos', icon: Dumbbell },
  { label: 'Exercícios', icon: Activity },
  { label: 'Progresso', icon: Trophy },
]

const week = [
  { day: 'SEG', date: '12', status: 'done' },
  { day: 'TER', date: '13', status: 'done' },
  { day: 'QUA', date: '14', status: 'active' },
  { day: 'QUI', date: '15', status: 'rest' },
  { day: 'SEX', date: '16', status: 'planned' },
  { day: 'SAB', date: '17', status: 'rest' },
  { day: 'DOM', date: '18', status: 'rest' },
]

const workouts = [
  { title: 'Força & potência', subtitle: 'Peito, ombros e tríceps', time: '45 min', level: 'Intermediário', progress: 72, tone: 'dark' },
  { title: 'Full body', subtitle: 'Corpo inteiro', time: '32 min', level: 'Iniciante', progress: 38, tone: 'light' },
  { title: 'Mobilidade', subtitle: 'Alongamento e core', time: '20 min', level: 'Todos os níveis', progress: 0, tone: 'outline' },
]

const exercises = [
  { name: 'Supino reto', sets: '4 séries', weight: '42 kg', icon: 'SR' },
  { name: 'Desenvolvimento', sets: '3 séries', weight: '18 kg', icon: 'DS' },
  { name: 'Tríceps na polia', sets: '3 séries', weight: '24 kg', icon: 'TP' },
]

function App() {
  const [activeNav, setActiveNav] = useState('Visão geral')
  const [showModal, setShowModal] = useState(false)
  const [showNotice, setShowNotice] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleStartWorkout = () => {
    setShowNotice(true)
    window.setTimeout(() => setShowNotice(false), 3200)
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={20} strokeWidth={2.8} /></div>
          <span>fit<span>tracker</span></span>
        </div>
        <div className="workspace-switcher">
          <div className="avatar avatar-small">RM</div>
          <div><strong>Rafael Martins</strong><small>Plano premium</small></div>
          <ChevronDown size={15} />
        </div>
        <nav className="main-nav" aria-label="Navegação principal">
          <span className="nav-label">MENU PRINCIPAL</span>
          {navItems.map(({ label, icon: Icon }) => (
            <button className={`nav-item ${activeNav === label ? 'selected' : ''}`} key={label} onClick={() => { setActiveNav(label); setMenuOpen(false) }}>
              <Icon size={18} /><span>{label}</span>{label === 'Progresso' && <span className="nav-badge">2</span>}
            </button>
          ))}
          <span className="nav-label nav-label-spaced">CONTA</span>
          <button className="nav-item"><Settings size={18} /><span>Configurações</span></button>
          <button className="nav-item"><HeartPulse size={18} /><span>Saúde e metas</span></button>
        </nav>
        <div className="sidebar-bottom">
          <div className="upgrade-card">
            <Sparkles size={17} />
            <strong>Desbloqueie seu potencial</strong>
            <p>Tenha acesso a planos personalizados.</p>
            <button>Conhecer Premium <ArrowUpRight size={14} /></button>
          </div>
          <button className="profile-row"><div className="avatar">RM</div><span><strong>Rafael Martins</strong><small>Ver perfil</small></span><MoreHorizontal size={17} /></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={21} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>Visão geral</strong></div>
          <div className="top-actions">
            <button className="icon-button search-button" aria-label="Pesquisar"><Search size={18} /></button>
            <button className="icon-button notification-button" aria-label="Notificações"><Bell size={18} /><i /></button>
            <div className="avatar">RM</div>
          </div>
        </header>

        <div className="page-wrap">
          <section className="welcome-row">
            <div><p className="eyebrow">QUARTA-FEIRA, 14 DE MAIO DE 2025</p><h1>Bom dia, Rafael <span>✦</span></h1><p className="muted">Pronto para transformar sua próxima sessão?</p></div>
            <button className="primary-button" onClick={() => setShowModal(true)}><Plus size={18} /> Novo treino</button>
          </section>

          <section className="metrics-grid">
            <article className="metric-card featured"><div className="metric-head"><span>Sequência atual</span><Flame size={18} /></div><div className="metric-value">12 <small>dias</small></div><div className="metric-foot"><span className="trend">↗ +3 dias</span> <span>vs. semana passada</span></div><div className="sparkline" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div></article>
            <article className="metric-card"><div className="metric-head"><span>Treinos este mês</span><Target size={18} /></div><div className="metric-value">08 <small>/ 12</small></div><div className="progress-bar"><span style={{ width: '66%' }} /></div><div className="metric-foot"><span>4 treinos restantes</span><span>66%</span></div></article>
            <article className="metric-card"><div className="metric-head"><span>Tempo total</span><Clock3 size={18} /></div><div className="metric-value">06<small>h 42m</small></div><div className="metric-foot"><span className="trend">↗ +12%</span> <span>vs. mês passado</span></div></article>
            <article className="metric-card"><div className="metric-head"><span>Calorias queimadas</span><Activity size={18} /></div><div className="metric-value">3.240 <small>kcal</small></div><div className="metric-foot"><span className="trend">↗ +8%</span> <span>ótimo ritmo</span></div></article>
          </section>

          <section className="content-grid">
            <div className="main-column">
              <div className="section-heading"><div><h2>Seu plano da semana</h2><p>Continue de onde você parou.</p></div><button className="text-button">Ver calendário <ArrowUpRight size={15} /></button></div>
              <div className="week-strip">{week.map(item => <button className={`day-cell ${item.status}`} key={item.date}><span>{item.day}</span><strong>{item.date}</strong>{item.status === 'done' ? <i>✓</i> : item.status === 'active' ? <i className="dot" /> : <i className="empty" />}</button>)}</div>
              <div className="section-heading workout-heading"><div><h2>Treinos recomendados</h2><p>Baseados nos seus objetivos e histórico.</p></div><button className="icon-button"><MoreHorizontal size={19} /></button></div>
              <div className="workout-grid">{workouts.map(workout => <article className={`workout-card ${workout.tone}`} key={workout.title}><div className="workout-card-top"><span className="workout-tag">{workout.tone === 'dark' ? 'SEU TREINO DE HOJE' : 'RECOMENDADO'}</span><button className="card-more"><MoreHorizontal size={17} /></button></div><div className="workout-illustration"><Dumbbell size={44} strokeWidth={1.2} /></div><div className="workout-info"><h3>{workout.title}</h3><p>{workout.subtitle}</p><div className="workout-meta"><span><Clock3 size={14} /> {workout.time}</span><span><Activity size={14} /> {workout.level}</span></div></div>{workout.progress > 0 && <div className="workout-progress"><div><span>Progresso</span><strong>{workout.progress}%</strong></div><div className="progress-bar"><span style={{ width: `${workout.progress}%` }} /></div></div>}<button className="workout-action" onClick={handleStartWorkout}>{workout.progress > 0 ? 'Continuar treino' : 'Começar treino'} <ArrowUpRight size={16} /></button></article>)}</div>
            </div>
            <aside className="right-column">
              <div className="section-heading"><div><h2>Próximo objetivo</h2><p>Foco e consistência.</p></div><Target size={20} /></div>
              <div className="goal-card"><div className="goal-ring"><strong>68</strong><span>%</span></div><div><h3>Construir força</h3><p>Meta mensal</p></div><button aria-label="Mais opções"><MoreHorizontal size={17} /></button><div className="goal-stats"><span><strong>8</strong> de 12 treinos</span><span>até 31 mai</span></div></div>
              <div className="section-heading exercise-heading"><div><h2>Exercícios recentes</h2><p>Seu histórico de performance.</p></div><button className="text-button">Ver todos <ArrowUpRight size={15} /></button></div>
              <div className="exercise-list">{exercises.map(exercise => <div className="exercise-row" key={exercise.name}><div className="exercise-icon">{exercise.icon}</div><div className="exercise-name"><strong>{exercise.name}</strong><span>{exercise.sets}</span></div><div className="exercise-weight"><strong>{exercise.weight}</strong><span>último</span></div><ChevronRight size={16} /></div>)}</div>
              <div className="tip-card"><div className="tip-icon"><Sparkles size={18} /></div><div><span>DICA DO DIA</span><p>Descanse entre 60 e 90 segundos para maximizar seus ganhos de força.</p></div></div>
            </aside>
          </section>
        </div>
      </main>

      {showNotice && <div className="toast"><div className="toast-check">✓</div><div><strong>Treino iniciado</strong><span>Boa sessão, Rafael. Você consegue!</span></div><button onClick={() => setShowNotice(false)} aria-label="Fechar"><X size={16} /></button></div>}
      {showModal && <div className="modal-backdrop" onClick={() => setShowModal(false)}><div className="modal" onClick={event => event.stopPropagation()}><button className="modal-close" onClick={() => setShowModal(false)} aria-label="Fechar modal"><X size={18} /></button><div className="modal-icon"><Dumbbell size={21} /></div><p className="eyebrow">NOVO PLANO</p><h2>Monte seu próximo treino</h2><p className="muted">Escolha um foco para começar com uma sugestão personalizada.</p><div className="goal-options"><button><Flame size={18} /><span><strong>Força</strong><small>Ganhar potência e massa</small></span><ChevronRight size={16} /></button><button><HeartPulse size={18} /><span><strong>Condicionamento</strong><small>Mais resistência no dia a dia</small></span><ChevronRight size={16} /></button><button><Sparkles size={18} /><span><strong>Mobilidade</strong><small>Movimente-se melhor</small></span><ChevronRight size={16} /></button></div><button className="primary-button modal-button" onClick={() => { setShowModal(false); handleStartWorkout() }}>Criar treino <ArrowUpRight size={16} /></button></div></div>}
    </div>
  )
}

export default App
