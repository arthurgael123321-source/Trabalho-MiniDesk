import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Clock3,
  Crown,
  Download,
  Dumbbell,
  Flame,
  Grid2X2,
  HeartPulse,
  Home,
  ListChecks,
  Lock,
  LogOut,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Save,
  Search,
  Send,
  Settings,
  Sparkles,
  Target,
  Timer,
  Trash2,
  Trophy,
  UserRound,
  X,
} from 'lucide-react'
import Login from './Login'
import {
  clearSession,
  createDefaultUserData,
  findUserByEmail,
  getSession,
  getUserData,
  saveUserData,
  updateUserProfile,
} from './storage'

const navItems = [
  { label: 'Visão geral', icon: Home, view: 'overview' },
  { label: 'Meus treinos', icon: Dumbbell, view: 'workouts' },
  { label: 'Exercícios', icon: Activity, view: 'exercises' },
  { label: 'Progresso', icon: Trophy, view: 'progress' },
]

const accountItems = [
  { label: 'Configurações', icon: Settings, view: 'settings' },
  { label: 'Saúde e metas', icon: HeartPulse, view: 'goals' },
  { label: 'Premium', icon: Crown, view: 'premium' },
]

const VIEW_LABELS = {
  overview: 'Visão geral',
  workouts: 'Meus treinos',
  exercises: 'Exercícios',
  progress: 'Progresso',
  settings: 'Configurações',
  goals: 'Saúde e metas',
  premium: 'Premium',
}

const FREE_WORKOUT_LIMIT = 6
const FREE_EXERCISE_LIMIT = 10

const PREMIUM_PLANS = [
  {
    id: 'free',
    title: 'Gratuito',
    price: 'R$ 0',
    period: '/sempre',
    description: 'Para quem está começando a treinar.',
    features: [`Até ${FREE_WORKOUT_LIMIT} treinos salvos`, `Até ${FREE_EXERCISE_LIMIT} exercícios registrados`, 'Acompanhamento semanal', 'Metas mensais'],
  },
  {
    id: 'monthly',
    title: 'Premium mensal',
    price: 'R$ 19,90',
    period: '/mês',
    description: 'Recursos avançados, cancele quando quiser.',
    features: ['Treinos e exercícios ilimitados', 'Treino personalizado gerado com seu histórico', 'Métricas avançadas de progresso', 'Suporte prioritário (resposta em até 2h)'],
  },
  {
    id: 'annual',
    title: 'Premium anual',
    price: 'R$ 14,90',
    period: '/mês',
    description: 'Economize pagando anualmente.',
    features: ['Tudo do Premium mensal', 'Exportação de relatórios em arquivo', '2 meses grátis pagando à vista'],
    badge: 'MAIS POPULAR',
    highlight: true,
  },
]

const shortcuts = [
  { label: 'Força', icon: Flame },
  { label: 'Mobilidade', icon: Sparkles },
  { label: 'Full body', icon: Dumbbell },
]

const WORKOUT_PRESETS = {
  'Força': { title: 'Treino de força', subtitle: 'Foco em potência muscular', time: 40, level: 'Iniciante', calories: 300, tone: 'light' },
  'Mobilidade': { title: 'Treino de mobilidade', subtitle: 'Alongamento guiado', time: 20, level: 'Todos os níveis', calories: 110, tone: 'outline' },
  'Full body': { title: 'Treino full body', subtitle: 'Corpo inteiro em uma sessão', time: 35, level: 'Intermediário', calories: 320, tone: 'light' },
}

const REST_DURATION = 60

const notifications = [
  { title: 'Treino sugerido', body: 'Baseado no seu histórico, que tal trabalhar força hoje?' },
  { title: 'Meta semanal', body: 'Você está perto de bater sua meta da semana!' },
]

function getInitials(name) {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map(part => part[0]?.toUpperCase() || '').join('') || '?'
}

function progressWeight(weight) {
  const match = String(weight).match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return weight
  const value = Number(match[1].replace(',', '.'))
  const unit = String(weight).slice(match.index + match[0].length).trim()
  const increment = /kg/i.test(unit) ? 2.5 : Math.max(value * 0.05, 1)
  const nextValue = Math.round((value + increment) * 10) / 10
  return `${String(nextValue).replace('.', ',')}${unit ? ` ${unit}` : ''}`
}

function getSetCount(value) {
  const match = String(value).match(/\d+/)
  return match ? Number(match[0]) : 3
}

function normalizeUserData(data) {
  if (!data) return createDefaultUserData()
  const base = { plan: 'free', planCycle: null, supportTickets: [], history: [], ...data }
  const exercises = base.exercises || []
  return {
    ...base,
    workouts: (base.workouts || []).filter(item => item.category?.toLowerCase() !== 'cardio').map(item => {
      const checklist = (item.checklist || []).map(checkItem => {
        const exercise = exercises.find(candidate => candidate.id === checkItem.exerciseId)
        return {
          ...checkItem,
          name: exercise?.name || checkItem.name,
          sets: Number(checkItem.sets) || getSetCount(exercise?.sets),
          restSeconds: Number(checkItem.restSeconds) || 60,
        }
      })
      return {
        checklist,
        ...item,
        progress: checklist.length > 0
          ? Math.round((checklist.filter(exercise => exercise.done).length / checklist.length) * 100)
          : item.progress || 0,
      }
    }),
  }
}

function App() {
  const [authChecked, setAuthChecked] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [userData, setUserData] = useState(null)

  const [view, setView] = useState('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [toast, setToast] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [notifOpen, setNotifOpen] = useState(false)
  const [hasNotifications, setHasNotifications] = useState(true)
  const [activeSessionId, setActiveSessionId] = useState(null)
  const [checklistEditorId, setChecklistEditorId] = useState(null)
  const [editingWorkoutId, setEditingWorkoutId] = useState(null)
  const [exerciseTimer, setExerciseTimer] = useState(null)
  const [editingExerciseId, setEditingExerciseId] = useState(null)

  useEffect(() => {
    const email = getSession()
    if (email) {
      const user = findUserByEmail(email)
      if (user) {
        setCurrentUser({ name: user.name, email: user.email })
        setUserData(normalizeUserData(getUserData(user.email)))
      } else {
        clearSession()
      }
    }
    setAuthChecked(true)
  }, [])

  useEffect(() => {
    if (currentUser && userData) {
      saveUserData(currentUser.email, userData)
    }
  }, [currentUser, userData])

  useEffect(() => {
    setExerciseTimer(null)
  }, [activeSessionId])

  useEffect(() => {
    if (!exerciseTimer || exerciseTimer.remaining <= 0) return undefined
    const timer = window.setTimeout(() => setExerciseTimer(value => value ? { ...value, remaining: value.remaining - 1 } : null), 1000)
    return () => window.clearTimeout(timer)
  }, [exerciseTimer])

  if (!authChecked) return null

  if (!currentUser || !userData) {
    return <Login onAuthenticated={(user) => {
      setCurrentUser(user)
      setUserData(normalizeUserData(getUserData(user.email)))
      setView('overview')
    }} />
  }

  const triggerToast = (title, message) => {
    setToast({ title, message })
    window.setTimeout(() => setToast(null), 3200)
  }

  const handleLogout = () => {
    clearSession()
    setCurrentUser(null)
    setUserData(null)
    setView('overview')
    setMenuOpen(false)
  }

  const buildHistoryEntry = (workout, exercises = userData.exercises) => ({
    id: `h${Date.now()}`,
    title: workout.title,
    category: workout.category,
    date: new Date().toLocaleString('pt-BR'),
    duration: `${workout.time} min`,
    calories: `${workout.calories} kcal`,
    progression: (workout.checklist || [])
      .map(item => exercises.find(exercise => exercise.id === item.exerciseId))
      .filter(Boolean)
      .map(exercise => `${exercise.name}: ${progressWeight(exercise.weight)}`),
  })

  const completeWorkout = (workout) => {
    if (!workout || !workout.checklist?.length || workout.checklist.some(item => !item.done)) return
    setUserData(prev => ({
      ...prev,
      workouts: prev.workouts.map(item => item.id === workout.id ? { ...item, progress: 100, checklist: workout.checklist, completedSessions: (item.completedSessions || 0) + 1, lastCompletedAt: new Date().toISOString() } : item),
      week: prev.week.map(day => day.status === 'active' ? { ...day, status: 'done' } : day),
      lastWorkout: { title: workout.title, date: 'Agora mesmo', duration: `${workout.time} min`, calories: `${workout.calories} kcal` },
      history: [buildHistoryEntry(workout, prev.exercises), ...(prev.history || [])].slice(0, 40),
      exercises: prev.exercises.map(exercise => (workout.checklist.some(item => item.exerciseId === exercise.id)
        ? { ...exercise, weight: progressWeight(exercise.weight) }
        : exercise)),
      stats: {
        ...prev.stats,
        streakDays: prev.week.some(day => day.status === 'active') ? prev.stats.streakDays + 1 : prev.stats.streakDays,
        totalMinutes: prev.stats.totalMinutes + workout.time,
        calories: prev.stats.calories + workout.calories,
      },
      goal: { ...prev.goal, current: Math.min(prev.goal.current + 1, prev.goal.target) },
    }))
    triggerToast('Treino concluído!', `Mandou bem, ${currentUser.name.split(' ')[0]}. Continue assim.`)
  }

  const startWorkoutSession = (id) => {
    const workout = userData.workouts.find(item => item.id === id)
    if (!workout) return
    if (!workout.checklist || workout.checklist.length === 0) {
      triggerToast('Configure seu treino', 'Adicione pelo menos um exercício na checklist antes de começar.')
      return
    }
    if (workout.progress >= 100) {
      setUserData(prev => ({
        ...prev,
        workouts: prev.workouts.map(item => item.id === id
          ? { ...item, progress: 0, checklist: item.checklist.map(exercise => ({ ...exercise, done: false })) }
          : item),
      }))
    }
    setActiveSessionId(id)
  }

  const toggleExerciseInChecklist = (workoutId, exercise) => {
    setUserData(prev => ({
      ...prev,
      workouts: prev.workouts.map(item => {
        if (item.id !== workoutId) return item
        const current = item.checklist || []
        const exists = current.some(chk => chk.exerciseId === exercise.id)
        const checklist = exists
          ? current.filter(chk => chk.exerciseId !== exercise.id)
          : [...current, { exerciseId: exercise.id, name: exercise.name, sets: getSetCount(exercise.sets), restSeconds: 60, done: false }]
        const progress = checklist.length > 0
          ? Math.round((checklist.filter(chk => chk.done).length / checklist.length) * 100)
          : item.progress
        return { ...item, checklist, progress }
      }),
    }))
  }

  const updateWorkoutExercise = (workoutId, exerciseId, updates) => {
    setUserData(prev => ({
      ...prev,
      workouts: prev.workouts.map(workout => workout.id === workoutId
        ? { ...workout, checklist: (workout.checklist || []).map(item => item.exerciseId === exerciseId ? { ...item, ...updates } : item) }
        : workout),
    }))
  }

  const startExerciseTimer = (workoutId, item) => {
    if (exerciseTimer?.workoutId === workoutId && exerciseTimer.exerciseId === item.exerciseId && exerciseTimer.remaining > 0) {
      setExerciseTimer(null)
      return
    }
    setExerciseTimer({ workoutId, exerciseId: item.exerciseId, remaining: Number(item.restSeconds) || 60 })
  }

  const toggleSessionExercise = (workoutId, exerciseId) => {
    const workout = userData.workouts.find(item => item.id === workoutId)
    if (!workout) return
    const target = workout.checklist.find(chk => chk.exerciseId === exerciseId)
    const turningOn = Boolean(target && !target.done)
    const checklist = workout.checklist.map(chk => chk.exerciseId === exerciseId ? { ...chk, done: !chk.done } : chk)
    const progress = Math.round((checklist.filter(chk => chk.done).length / checklist.length) * 100)
    setUserData(prev => ({
      ...prev,
      workouts: prev.workouts.map(item => item.id === workoutId ? { ...item, checklist, progress } : item),
    }))
    if (progress >= 100 && workout.progress < 100) {
      completeWorkout({ ...workout, checklist })
      setExerciseTimer(null)
      setActiveSessionId(null)
      triggerToast('Treino concluído!', `Você completou toda a checklist de "${workout.title}". Mandou bem, ${currentUser.name.split(' ')[0]}!`)
    } else {
      setExerciseTimer(turningOn ? { workoutId, exerciseId, remaining: Number(target?.restSeconds) || REST_DURATION } : null)
    }
  }

  const createWorkout = (categoryLabel) => {
    const preset = WORKOUT_PRESETS[categoryLabel]
    if (!preset) return
    if (userData.plan !== 'premium' && userData.workouts.length >= FREE_WORKOUT_LIMIT) {
      setShowModal(false)
      triggerToast('Limite do plano gratuito', `Você atingiu o limite de ${FREE_WORKOUT_LIMIT} treinos. Assine o Premium para treinos ilimitados.`)
      return
    }
    const workout = { id: `w${Date.now()}`, category: categoryLabel, progress: 0, checklist: [], ...preset }
    setUserData(prev => ({ ...prev, workouts: [workout, ...prev.workouts] }))
    setShowModal(false)
    triggerToast('Treino criado', `"${preset.title}" foi adicionado à sua lista.`)
  }

  const generatePersonalizedWorkout = () => {
    if (userData.plan !== 'premium') {
      setView('premium')
      triggerToast('Recurso Premium', 'Assine o Premium para gerar treinos personalizados com base no seu histórico.')
      return
    }
    const categories = Object.keys(WORKOUT_PRESETS)
    const counts = categories.map(cat => ({ cat, count: userData.workouts.filter(item => item.category === cat).length }))
    counts.sort((a, b) => a.count - b.count)
    const targetCategory = counts[0].cat
    const preset = WORKOUT_PRESETS[targetCategory]
    const workout = {
      id: `w${Date.now()}`,
      category: targetCategory,
      progress: 0,
      checklist: [],
      ...preset,
      title: `${preset.title} personalizado`,
      subtitle: `Sugerido com base na sua meta "${userData.goal.title}"`,
    }
    setUserData(prev => ({ ...prev, workouts: [workout, ...prev.workouts] }))
    triggerToast('Treino personalizado gerado', `"${workout.title}" foi criado com base no seu histórico de treinos.`)
  }

  const deleteWorkout = (id) => {
    setUserData(prev => ({ ...prev, workouts: prev.workouts.filter(item => item.id !== id) }))
  }

  const addExercise = (event) => {
    event.preventDefault()
    const form = event.target
    const data = new FormData(form)
    const name = data.get('name').trim()
    const sets = data.get('sets').trim()
    const weight = data.get('weight').trim()
    if (!name || !sets || !weight) return
    if (userData.plan !== 'premium' && userData.exercises.length >= FREE_EXERCISE_LIMIT) {
      triggerToast('Limite do plano gratuito', `Você atingiu o limite de ${FREE_EXERCISE_LIMIT} exercícios. Assine o Premium para registros ilimitados.`)
      return
    }
    const exercise = { id: `e${Date.now()}`, name, sets, weight, icon: name.slice(0, 2).toUpperCase() }
    setUserData(prev => ({ ...prev, exercises: [exercise, ...prev.exercises] }))
    form.reset()
  }

  const deleteExercise = (id) => {
    setUserData(prev => ({
      ...prev,
      exercises: prev.exercises.filter(item => item.id !== id),
      workouts: prev.workouts.map(workout => {
        const checklist = (workout.checklist || []).filter(item => item.exerciseId !== id)
        return {
          ...workout,
          checklist,
          progress: checklist.length > 0
            ? Math.round((checklist.filter(item => item.done).length / checklist.length) * 100)
            : 0,
        }
      }),
    }))
    triggerToast('Exercício removido', 'Ele também foi retirado dos treinos que usavam esse exercício.')
  }

  const updateWorkout = (event) => {
    event.preventDefault()
    const data = new FormData(event.target)
    const title = data.get('title').trim()
    const subtitle = data.get('subtitle').trim()
    const category = data.get('category').trim()
    const time = Number(data.get('time'))
    const level = data.get('level').trim()
    const calories = Number(data.get('calories'))
    if (!title || !subtitle || !category || !time || !level || !calories) return
    if (category.toLowerCase() === 'cardio') {
      triggerToast('Categoria indisponível', 'Este aplicativo está configurado apenas para treinos sem cardio.')
      return
    }
    setUserData(prev => ({
      ...prev,
      workouts: prev.workouts.map(item => item.id === editingWorkoutId
        ? { ...item, title, subtitle, category, time, level, calories }
        : item),
    }))
    setEditingWorkoutId(null)
    triggerToast('Treino atualizado', 'Nome, duração e intensidade foram salvos.')
  }

  const updateExercise = (event) => {
    event.preventDefault()
    const data = new FormData(event.target)
    const name = data.get('name').trim()
    const sets = data.get('sets').trim()
    const weight = data.get('weight').trim()
    if (!name || !sets || !weight) return
    setUserData(prev => ({
      ...prev,
      exercises: prev.exercises.map(item => item.id === editingExerciseId ? { ...item, name, sets, weight, icon: name.slice(0, 2).toUpperCase() } : item),
      workouts: prev.workouts.map(workout => ({
        ...workout,
        checklist: (workout.checklist || []).map(chk => chk.exerciseId === editingExerciseId ? { ...chk, name } : chk),
      })),
    }))
    setEditingExerciseId(null)
    triggerToast('Exercício atualizado', 'As alterações foram salvas.')
  }

  const updateGoal = (event) => {
    event.preventDefault()
    const data = new FormData(event.target)
    const title = data.get('title').trim()
    const target = Number(data.get('target'))
    const deadline = data.get('deadline').trim()
    if (!title || !target) return
    setUserData(prev => ({ ...prev, goal: { ...prev.goal, title, target, deadline, current: Math.min(prev.goal.current, target) } }))
    triggerToast('Meta atualizada', 'Sua meta mensal foi salva.')
  }

  const updateProfileName = (event) => {
    event.preventDefault()
    const data = new FormData(event.target)
    const name = data.get('name').trim()
    if (!name) return
    updateUserProfile(currentUser.email, { name })
    setCurrentUser(prev => ({ ...prev, name }))
    triggerToast('Perfil atualizado', 'Seu nome foi salvo.')
  }

  const subscribePlan = (planId) => {
    const plan = PREMIUM_PLANS.find(item => item.id === planId)
    if (!plan || plan.id === 'free') return
    setUserData(prev => ({ ...prev, plan: 'premium', planCycle: planId }))
    triggerToast('Assinatura confirmada', `Bem-vindo ao ${plan.title}!`)
  }

  const cancelPlan = () => {
    if (userData.plan !== 'premium') return
    setUserData(prev => ({ ...prev, plan: 'free', planCycle: null }))
    triggerToast('Assinatura cancelada', 'Você voltou para o plano gratuito.')
  }

  const exportReport = () => {
    if (!(userData.plan === 'premium' && userData.planCycle === 'annual')) return
    const report = {
      geradoEm: new Date().toISOString(),
      usuario: currentUser.name,
      email: currentUser.email,
      meta: userData.goal,
      estatisticas: userData.stats,
      treinos: userData.workouts,
      exercicios: userData.exercises,
      semana: userData.week,
    }
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `feettrack-relatorio-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    triggerToast('Relatório exportado', 'O download do seu relatório começou.')
  }

  const submitSupportTicket = (event) => {
    event.preventDefault()
    const data = new FormData(event.target)
    const message = data.get('message').trim()
    if (!message) return
    const ticket = {
      id: `t${Date.now()}`,
      message,
      date: new Date().toLocaleString('pt-BR'),
      status: userData.plan === 'premium' ? 'Prioritário' : 'Padrão',
    }
    setUserData(prev => ({ ...prev, supportTickets: [ticket, ...(prev.supportTickets || [])] }))
    event.target.reset()
    triggerToast('Mensagem enviada', userData.plan === 'premium' ? 'Nosso suporte prioritário responde em até 2h.' : 'Nossa equipe responde em até 48h.')
  }

  const handleDayClick = (day) => {
    const messages = {
      done: `Treino concluído em ${day.day} (${day.date}).`,
      active: 'Seu treino de hoje está pronto. Bora começar!',
      planned: `Treino planejado para ${day.day} (${day.date}).`,
      rest: `${day.day} (${day.date}) é dia de descanso.`,
    }
    triggerToast(day.day, messages[day.status])
  }

  const toggleNotifications = () => {
    setNotifOpen(value => !value)
    setHasNotifications(false)
  }

  const query = searchQuery.trim().toLowerCase()
  const matchesQuery = (text) => !query || text.toLowerCase().includes(query)

  const categoryWorkouts = selectedCategory ? userData.workouts.filter(item => item.category === selectedCategory) : userData.workouts
  const overviewWorkouts = categoryWorkouts.filter(item => matchesQuery(item.title))
  const allWorkouts = userData.workouts.filter(item => matchesQuery(item.title))
  const allExercises = userData.exercises.filter(item => matchesQuery(item.name))
  const recentExercises = userData.exercises.slice(0, 3)

  const categoryBreakdown = Object.keys(WORKOUT_PRESETS).map(cat => {
    const items = userData.workouts.filter(item => item.category === cat)
    return {
      category: cat,
      count: items.length,
      minutes: items.reduce((sum, item) => sum + item.time, 0),
      calories: items.reduce((sum, item) => sum + item.calories, 0),
    }
  }).filter(item => item.count > 0)
  const avgProgress = userData.workouts.length > 0
    ? Math.round(userData.workouts.reduce((sum, item) => sum + item.progress, 0) / userData.workouts.length)
    : 0

  const weeklyTarget = userData.week.filter(day => day.status !== 'rest').length
  const weeklyCompleted = userData.week.filter(day => day.status === 'done').length
  const goalPercent = Math.round((userData.goal.current / userData.goal.target) * 100)
  const initials = getInitials(currentUser.name)
  const firstName = currentUser.name.split(' ')[0]
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const todayLabel = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()

  return (
    <div className="app-shell">
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={20} strokeWidth={2.8} /></div>
          <span>fit<span>tracker</span></span>
        </div>
        <div className="workspace-switcher">
          <div className="avatar avatar-small">{initials}</div>
          <div><strong>{currentUser.name}</strong><small>{userData.plan === 'premium' ? 'Plano Premium' : 'Plano gratuito'}</small></div>
          <ChevronDown size={15} />
        </div>
        <nav className="main-nav" aria-label="Navegação principal">
          <span className="nav-label">MENU PRINCIPAL</span>
          {navItems.map(({ label, icon: Icon, view: itemView }) => (
            <button className={`nav-item ${view === itemView ? 'selected' : ''}`} key={label} onClick={() => { setView(itemView); setMenuOpen(false) }}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
          <span className="nav-label nav-label-spaced">CONTA</span>
          {accountItems.map(({ label, icon: Icon, view: itemView }) => (
            <button className={`nav-item ${view === itemView ? 'selected' : ''}`} key={label} onClick={() => { setView(itemView); setMenuOpen(false) }}>
              <Icon size={18} /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          {userData.plan === 'premium' ? (
            <div className="upgrade-card premium-active">
              <Crown size={17} />
              <strong>Você é Premium ✦</strong>
              <p>Aproveite todos os recursos avançados.</p>
              <button onClick={() => { setView('premium'); setMenuOpen(false) }}>Gerenciar assinatura <ArrowUpRight size={14} /></button>
            </div>
          ) : (
            <div className="upgrade-card">
              <Sparkles size={17} />
              <strong>Desbloqueie seu potencial</strong>
              <p>Tenha acesso a planos personalizados.</p>
              <button onClick={() => { setView('premium'); setMenuOpen(false) }}>Conhecer Premium <ArrowUpRight size={14} /></button>
            </div>
          )}
          <button className="profile-row" onClick={() => { setView('settings'); setMenuOpen(false) }}><div className="avatar">{initials}</div><span><strong>{currentUser.name}</strong><small>Ver perfil</small></span><MoreHorizontal size={17} /></button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Abrir menu" onClick={() => setMenuOpen(!menuOpen)}><Menu size={21} /></button>
          <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{VIEW_LABELS[view]}</strong></div>
          <div className="top-actions">
            {searchOpen && <input className="search-input" autoFocus value={searchQuery} onChange={event => setSearchQuery(event.target.value)} placeholder="Buscar treinos ou exercícios..." />}
            <button className="icon-button search-button" aria-label="Pesquisar" onClick={() => { setSearchOpen(value => !value); setSearchQuery('') }}><Search size={18} /></button>
            <div className="notification-wrap">
              <button className="icon-button notification-button" aria-label="Notificações" onClick={toggleNotifications}><Bell size={18} />{hasNotifications && <i />}</button>
              {notifOpen && (
                <div className="notif-panel">
                  {notifications.map(item => <p key={item.title}><strong>{item.title}</strong>{item.body}</p>)}
                </div>
              )}
            </div>
            <button className="avatar avatar-button" onClick={() => setView('settings')} aria-label="Ir para configurações">{initials}</button>
          </div>
        </header>

        <div className="page-wrap">
          {view === 'overview' && (
            <>
              <section className="welcome-row">
                <div><p className="eyebrow">{todayLabel}</p><h1>{greeting}, {firstName} <span>✦</span></h1><p className="muted">Pronto para transformar sua próxima sessão?</p></div>
                <button className="primary-button" onClick={() => setShowModal(true)}><Plus size={18} /> Novo treino</button>
              </section>

              <section className="shortcuts-row">
                <span className="shortcuts-label"><Grid2X2 size={13} /> Atalhos rápidos</span>
                <div className="shortcuts-list">{shortcuts.map(({ label, icon: Icon }) => <button className={`shortcut-chip ${selectedCategory === label ? 'active' : ''}`} key={label} onClick={() => setSelectedCategory(current => current === label ? null : label)}><Icon size={15} /> {label}</button>)}</div>
              </section>

              <section className="metrics-grid">
                <article className="metric-card featured"><div className="metric-head"><span>Sequência atual</span><Flame size={18} /></div><div className="metric-value">{userData.stats.streakDays} <small>dias</small></div><div className="metric-foot"><span>Continue treinando para manter o ritmo</span></div><div className="sparkline" aria-hidden="true"><i /><i /><i /><i /><i /><i /><i /></div></article>
                <article className="metric-card"><div className="metric-head"><span>Treinos este mês</span><Target size={18} /></div><div className="metric-value">{String(userData.goal.current).padStart(2, '0')} <small>/ {userData.goal.target}</small></div><div className="progress-bar"><span style={{ width: `${goalPercent}%` }} /></div><div className="metric-foot"><span>{Math.max(userData.goal.target - userData.goal.current, 0)} treinos restantes</span><span>{goalPercent}%</span></div></article>
                <article className="metric-card"><div className="metric-head"><span>Tempo total</span><Clock3 size={18} /></div><div className="metric-value">{Math.floor(userData.stats.totalMinutes / 60)}<small>h {userData.stats.totalMinutes % 60}m</small></div><div className="metric-foot"><span>Desde que você começou</span></div></article>
                <article className="metric-card"><div className="metric-head"><span>Calorias queimadas</span><Activity size={18} /></div><div className="metric-value">{userData.stats.calories.toLocaleString('pt-BR')} <small>kcal</small></div><div className="metric-foot"><span>Baseado nos treinos concluídos</span></div></article>
              </section>

              <section className="content-grid">
                <div className="main-column">
                  <div className="section-heading"><div><h2>Seu plano da semana</h2><p>Continue de onde você parou.</p></div><button className="text-button" onClick={() => setView('progress')}>Ver calendário <ArrowUpRight size={15} /></button></div>
                  <div className="week-strip">{userData.week.map(item => <button className={`day-cell ${item.status}`} key={item.date} onClick={() => handleDayClick(item)}><span>{item.day}</span><strong>{item.date}</strong>{item.status === 'done' ? <i>✓</i> : item.status === 'active' ? <i className="dot" /> : <i className="empty" />}</button>)}</div>
                  <div className="week-summary">
                    <div className="week-summary-item"><span>Treinos esta semana</span><strong>{weeklyCompleted}<small> / {weeklyTarget}</small></strong></div>
                    <div className="week-summary-item"><span><CalendarDays size={12} /> Último treino realizado</span>{userData.lastWorkout ? <strong>{userData.lastWorkout.title} <small>· {userData.lastWorkout.date}</small></strong> : <strong className="empty-text">Nenhum treino realizado ainda</strong>}</div>
                  </div>
                  <div className="section-heading workout-heading">
                    <div><h2>Treinos recomendados</h2><p>{selectedCategory ? `Filtrando por ${selectedCategory}.` : 'Baseados nos seus objetivos e histórico.'}</p></div>
                    {selectedCategory ? <button className="text-button" onClick={() => setSelectedCategory(null)}><X size={14} /> Limpar filtro</button> : <button className="icon-button" onClick={() => setView('workouts')}><MoreHorizontal size={19} /></button>}
                  </div>
                  {overviewWorkouts.length > 0 ? (
                    <div className="workout-grid">{overviewWorkouts.map(workout => <article className={`workout-card ${workout.tone}`} key={workout.id}><div className="workout-card-top"><span className="workout-tag">{workout.tone === 'dark' ? 'SEU TREINO DE HOJE' : 'RECOMENDADO'}</span><div className="card-top-actions"><button className="card-more" onClick={() => setEditingWorkoutId(workout.id)} aria-label="Editar treino"><Pencil size={15} /></button><button className="card-more" onClick={() => deleteWorkout(workout.id)} aria-label="Remover treino"><Trash2 size={15} /></button></div></div><div className="workout-illustration"><Dumbbell size={44} strokeWidth={1.2} /></div><div className="workout-info"><h3>{workout.title}</h3><p>{workout.subtitle}</p><div className="workout-meta"><span><Clock3 size={14} /> {workout.time} min</span><span><Activity size={14} /> {workout.level}</span></div>{workout.checklist?.length > 0 && <div className="workout-checklist-hint"><ListChecks size={12} /> {workout.checklist.filter(chk => chk.done).length}/{workout.checklist.length} exercícios</div>}</div><button className="workout-config-button" onClick={() => setChecklistEditorId(workout.id)}><ListChecks size={14} /> {workout.checklist?.length ? 'Editar exercícios' : 'Adicionar exercícios'}</button>{workout.progress > 0 && <div className="workout-progress"><div><span>Progresso</span><strong>{workout.progress}%</strong></div><div className="progress-bar"><span style={{ width: `${workout.progress}%` }} /></div></div>}<button className="workout-action" onClick={() => startWorkoutSession(workout.id)}>{workout.progress >= 100 ? 'Refazer treino' : workout.progress > 0 ? 'Continuar treino' : 'Começar treino'} <ArrowUpRight size={16} /></button></article>)}</div>
                  ) : userData.workouts.length > 0 ? (
                    <div className="empty-state">
                      <Grid2X2 size={30} />
                      <h3>Nenhum treino encontrado</h3>
                      <p>Experimente outro atalho ou limpe o filtro para ver todos os treinos.</p>
                      <button className="primary-button" onClick={() => { setSelectedCategory(null); setSearchQuery('') }}>Ver todos os treinos</button>
                    </div>
                  ) : (
                    <div className="empty-state">
                      <UserRound size={30} />
                      <h3>Nenhum treino por aqui ainda</h3>
                      <p>Crie seu primeiro treino e comece a acompanhar sua evolução.</p>
                      <button className="primary-button" onClick={() => setShowModal(true)}><Plus size={16} /> Criar primeiro treino</button>
                    </div>
                  )}
                </div>
                <aside className="right-column">
                  <div className="section-heading"><div><h2>Resumo do progresso</h2><p>Sua evolução recente.</p></div></div>
                  <div className="progress-summary">
                    <div><span>Sequência atual</span><strong>{userData.stats.streakDays} dias</strong></div>
                    <div><span>Treinos no mês</span><strong>{userData.goal.current} / {userData.goal.target}</strong></div>
                    <div><span>Tempo total</span><strong>{Math.floor(userData.stats.totalMinutes / 60)}h {userData.stats.totalMinutes % 60}m</strong></div>
                  </div>
                  <div className="section-heading"><div><h2>Próximo objetivo</h2><p>Foco e consistência.</p></div><Target size={20} /></div>
                  <div className="goal-card"><div className="goal-ring"><strong>{goalPercent}</strong><span>%</span></div><div><h3>{userData.goal.title}</h3><p>Meta mensal</p></div><button aria-label="Mais opções" onClick={() => setView('goals')}><MoreHorizontal size={17} /></button><div className="goal-stats"><span><strong>{userData.goal.current}</strong> de {userData.goal.target} treinos</span><span>até {userData.goal.deadline}</span></div></div>
                  <div className="section-heading exercise-heading"><div><h2>Exercícios recentes</h2><p>Seu histórico de performance.</p></div><button className="text-button" onClick={() => setView('exercises')}>Ver todos <ArrowUpRight size={15} /></button></div>
                  <div className="exercise-list">{recentExercises.length > 0 ? recentExercises.map(exercise => <div className="exercise-row" key={exercise.id}><div className="exercise-icon">{exercise.icon}</div><div className="exercise-name"><strong>{exercise.name}</strong><span>{exercise.sets}</span></div><div className="exercise-weight"><strong>{exercise.weight}</strong><span>último</span></div><ChevronRight size={16} /></div>) : <div className="empty-state small"><p>Nenhum exercício registrado ainda.</p></div>}</div>
                  <div className="tip-card"><div className="tip-icon"><Sparkles size={18} /></div><div><span>DICA DO DIA</span><p>Descanse entre 60 e 90 segundos para maximizar seus ganhos de força.</p></div></div>
                </aside>
              </section>
            </>
          )}

          {view === 'workouts' && (
            <section>
              <div className="section-heading">
                <div>
                  <h2>Meus treinos</h2>
                  <p>{userData.plan === 'premium' ? 'Treinos ilimitados no seu plano Premium.' : `Gerencie seus treinos (${userData.workouts.length}/${FREE_WORKOUT_LIMIT} usados no plano gratuito).`}</p>
                </div>
                <div className="heading-actions">
                  <button className="secondary-button" onClick={generatePersonalizedWorkout}>
                    <Sparkles size={15} /> Gerar personalizado {userData.plan !== 'premium' && <Lock size={12} />}
                  </button>
                  <button className="primary-button" onClick={() => setShowModal(true)}><Plus size={16} /> Novo treino</button>
                </div>
              </div>
              {allWorkouts.length > 0 ? (
                <div className="workout-grid">{allWorkouts.map(workout => <article className={`workout-card ${workout.tone}`} key={workout.id}><div className="workout-card-top"><span className="workout-tag">{workout.category}</span><div className="card-top-actions"><button className="card-more" onClick={() => setEditingWorkoutId(workout.id)} aria-label="Editar treino"><Pencil size={15} /></button><button className="card-more" onClick={() => setChecklistEditorId(workout.id)} aria-label="Editar exercícios do treino"><ListChecks size={15} /></button><button className="card-more" onClick={() => deleteWorkout(workout.id)} aria-label="Remover treino"><Trash2 size={15} /></button></div></div><div className="workout-illustration"><Dumbbell size={44} strokeWidth={1.2} /></div><div className="workout-info"><h3>{workout.title}</h3><p>{workout.subtitle}</p><div className="workout-meta"><span><Clock3 size={14} /> {workout.time} min</span><span><Activity size={14} /> {workout.level}</span></div>{workout.checklist?.length > 0 && <div className="workout-checklist-hint"><ListChecks size={12} /> {workout.checklist.filter(chk => chk.done).length}/{workout.checklist.length} exercícios</div>}</div><button className="workout-config-button" onClick={() => setChecklistEditorId(workout.id)}><ListChecks size={14} /> {workout.checklist?.length ? 'Editar exercícios' : 'Adicionar exercícios'}</button><div className="workout-progress"><div><span>Progresso</span><strong>{workout.progress}%</strong></div><div className="progress-bar"><span style={{ width: `${workout.progress}%` }} /></div></div><button className="workout-action" onClick={() => startWorkoutSession(workout.id)}>{workout.progress >= 100 ? 'Refazer treino' : workout.progress > 0 ? 'Continuar treino' : 'Começar treino'} <ArrowUpRight size={16} /></button></article>)}</div>
              ) : (
                <div className="empty-state">
                  <UserRound size={30} />
                  <h3>Nenhum treino encontrado</h3>
                  <p>Crie um novo treino ou ajuste sua busca.</p>
                  <button className="primary-button" onClick={() => setShowModal(true)}><Plus size={16} /> Criar treino</button>
                </div>
              )}
            </section>
          )}

          {view === 'exercises' && (
            <section>
              <div className="section-heading"><div><h2>Exercícios</h2><p>Seu catálogo de exercícios.</p></div></div>
              <form className="inline-form" onSubmit={addExercise}>
                <input name="name" placeholder="Nome do exercício" required />
                <input name="sets" placeholder="Ex: 4 séries" required />
                <input name="weight" placeholder="Ex: 40 kg" required />
                <button className="primary-button" type="submit"><Plus size={16} /> Adicionar</button>
              </form>
              <div className="exercise-list wide">
                {allExercises.length > 0 ? allExercises.map(exercise => (
                  <div className="exercise-row" key={exercise.id}>
                    <div className="exercise-icon">{exercise.icon}</div>
                    <div className="exercise-name"><strong>{exercise.name}</strong><span>{exercise.sets}</span></div>
                    <div className="exercise-weight"><strong>{exercise.weight}</strong><span>registrado</span></div>
                    <div className="card-top-actions">
                      <button className="card-more" onClick={() => setEditingExerciseId(exercise.id)} aria-label="Editar exercício"><Pencil size={14} /></button>
                      <button className="card-more" onClick={() => deleteExercise(exercise.id)} aria-label="Remover exercício"><Trash2 size={15} /></button>
                    </div>
                  </div>
                )) : <div className="empty-state small"><p>Nenhum exercício encontrado.</p></div>}
              </div>
            </section>
          )}

          {view === 'progress' && (
            <section>
              <div className="section-heading"><div><h2>Progresso</h2><p>Seu histórico e evolução.</p></div></div>
              <div className="metrics-grid">
                <article className="metric-card featured"><div className="metric-head"><span>Sequência atual</span><Flame size={18} /></div><div className="metric-value">{userData.stats.streakDays} <small>dias</small></div></article>
                <article className="metric-card"><div className="metric-head"><span>Treinos este mês</span><Target size={18} /></div><div className="metric-value">{String(userData.goal.current).padStart(2, '0')} <small>/ {userData.goal.target}</small></div><div className="progress-bar"><span style={{ width: `${goalPercent}%` }} /></div></article>
                <article className="metric-card"><div className="metric-head"><span>Tempo total</span><Clock3 size={18} /></div><div className="metric-value">{Math.floor(userData.stats.totalMinutes / 60)}<small>h {userData.stats.totalMinutes % 60}m</small></div></article>
                <article className="metric-card"><div className="metric-head"><span>Calorias queimadas</span><Activity size={18} /></div><div className="metric-value">{userData.stats.calories.toLocaleString('pt-BR')} <small>kcal</small></div></article>
              </div>
              <div className="week-strip">{userData.week.map(item => <button className={`day-cell ${item.status}`} key={item.date} onClick={() => handleDayClick(item)}><span>{item.day}</span><strong>{item.date}</strong>{item.status === 'done' ? <i>✓</i> : item.status === 'active' ? <i className="dot" /> : <i className="empty" />}</button>)}</div>
              <div className="goal-card standalone"><div className="goal-ring"><strong>{goalPercent}</strong><span>%</span></div><div><h3>{userData.goal.title}</h3><p>Meta mensal</p></div><div className="goal-stats"><span><strong>{userData.goal.current}</strong> de {userData.goal.target} treinos</span><span>até {userData.goal.deadline}</span></div></div>

              <div className="section-heading"><div><h2>Métricas avançadas</h2><p>Detalhamento por categoria de treino.</p></div>{userData.plan !== 'premium' && <Crown size={16} />}</div>
              {userData.plan === 'premium' ? (
                categoryBreakdown.length > 0 ? (
                  <div className="advanced-metrics-grid">
                    {categoryBreakdown.map(item => (
                      <div className="advanced-metric-card" key={item.category}>
                        <span>{item.category}</span>
                        <strong>{item.count} treino{item.count > 1 ? 's' : ''}</strong>
                        <div className="advanced-metric-foot"><span>{item.minutes} min</span><span>{item.calories} kcal</span></div>
                      </div>
                    ))}
                    <div className="advanced-metric-card highlight">
                      <span>Progresso médio</span>
                      <strong>{avgProgress}%</strong>
                      <div className="advanced-metric-foot"><span>Em todos os treinos</span></div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state small"><p>Complete treinos para ver suas métricas avançadas.</p></div>
                )
              ) : (
                <div className="locked-card">
                  <Lock size={22} />
                  <h3>Métricas avançadas são exclusivas do Premium</h3>
                  <p>Veja o detalhamento por categoria, progresso médio e muito mais.</p>
                  <button className="primary-button" onClick={() => setView('premium')}>Ver planos Premium</button>
                </div>
              )}

              <div className="section-heading"><div><h2>Histórico de treinos</h2><p>Suas últimas sessões concluídas.</p></div></div>
              {userData.history?.length > 0 ? (
                <div className="history-list">
                  {userData.history.map(entry => (
                    <div className="history-row" key={entry.id}>
                      <div className="history-icon"><Check size={14} /></div>
                      <div className="history-info"><strong>{entry.title}</strong><span>{entry.category} · {entry.date}</span></div>
                      <div className="history-meta"><span>{entry.duration}</span><span>{entry.calories}</span></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state small"><p>Nenhum treino concluído ainda. Complete um treino para ver seu histórico aqui.</p></div>
              )}
            </section>
          )}

          {view === 'settings' && (
            <section className="narrow">
              <div className="section-heading"><div><h2>Configurações</h2><p>Gerencie sua conta.</p></div></div>
              <form className="settings-form" onSubmit={updateProfileName}>
                <label>Nome<input name="name" defaultValue={currentUser.name} /></label>
                <label>Email<input value={currentUser.email} disabled /></label>
                <button className="primary-button" type="submit"><Save size={16} /> Salvar alterações</button>
              </form>
              <button className="logout-button" onClick={handleLogout}><LogOut size={16} /> Sair da conta</button>

              <div className="section-heading">
                <div>
                  <h2>Suporte</h2>
                  <p>{userData.plan === 'premium' ? 'Atendimento prioritário — resposta em até 2h.' : 'Atendimento padrão — resposta em até 48h.'}</p>
                </div>
                {userData.plan === 'premium' && <span className="priority-badge">PRIORITÁRIO</span>}
              </div>
              <form className="settings-form" onSubmit={submitSupportTicket}>
                <label>Mensagem<textarea name="message" rows={3} placeholder="Como podemos ajudar?" required /></label>
                <button className="primary-button" type="submit"><Send size={16} /> Enviar mensagem</button>
              </form>
              {userData.supportTickets?.length > 0 && (
                <div className="ticket-list">
                  {userData.supportTickets.map(ticket => (
                    <div className="ticket-row" key={ticket.id}>
                      <div><strong>{ticket.status}</strong><span>{ticket.date}</span></div>
                      <p>{ticket.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {view === 'goals' && (
            <section className="narrow">
              <div className="section-heading"><div><h2>Saúde e metas</h2><p>Defina sua meta mensal.</p></div></div>
              <form className="settings-form" onSubmit={updateGoal}>
                <label>Título da meta<input name="title" defaultValue={userData.goal.title} /></label>
                <label>Meta de treinos no mês<input name="target" type="number" min="1" defaultValue={userData.goal.target} /></label>
                <label>Prazo<input name="deadline" defaultValue={userData.goal.deadline} /></label>
                <button className="primary-button" type="submit"><Save size={16} /> Salvar meta</button>
              </form>
              <div className="goal-card standalone"><div className="goal-ring"><strong>{goalPercent}</strong><span>%</span></div><div><h3>{userData.goal.title}</h3><p>Meta mensal</p></div><div className="goal-stats"><span><strong>{userData.goal.current}</strong> de {userData.goal.target} treinos</span><span>até {userData.goal.deadline}</span></div></div>
            </section>
          )}

          {view === 'premium' && (
            <section className="premium-page">
              <div className="section-heading"><div><h2>Planos Premium</h2><p>Desbloqueie recursos avançados e leve seus treinos pro próximo nível.</p></div></div>
              {userData.plan === 'premium' && (
                <div className="premium-status-card">
                  <div className="premium-status-icon"><Crown size={18} /></div>
                  <div><h3>Você é Premium</h3><p>Ciclo atual: {userData.planCycle === 'annual' ? 'Anual' : 'Mensal'} · Obrigado por apoiar o FitTracker.</p></div>
                  {userData.planCycle === 'annual' && <button className="secondary-button light" onClick={exportReport}><Download size={14} /> Exportar relatório</button>}
                </div>
              )}
              {userData.plan === 'premium' && userData.planCycle !== 'annual' && (
                <p className="upsell-hint">Assine o plano anual para desbloquear a exportação de relatórios.</p>
              )}
              <div className="plans-grid">
                {PREMIUM_PLANS.map(plan => {
                  const isCurrent = plan.id === 'free' ? userData.plan !== 'premium' : userData.plan === 'premium' && userData.planCycle === plan.id
                  return (
                    <article className={`plan-card ${plan.highlight ? 'highlight' : ''} ${isCurrent ? 'current' : ''}`} key={plan.id}>
                      {plan.badge && <span className="plan-badge">{plan.badge}</span>}
                      <h3>{plan.title}</h3>
                      <div className="plan-price"><strong>{plan.price}</strong><span>{plan.period}</span></div>
                      <p className="plan-desc">{plan.description}</p>
                      <ul className="plan-features">
                        {plan.features.map(feature => <li key={feature}><Check size={13} /> {feature}</li>)}
                      </ul>
                      <button
                        className="plan-button"
                        disabled={isCurrent}
                        onClick={() => plan.id === 'free' ? cancelPlan() : subscribePlan(plan.id)}
                      >
                        {isCurrent ? 'Plano atual' : plan.id === 'free' ? 'Voltar ao gratuito' : `Assinar ${plan.title.split(' ')[1]}`}
                      </button>
                    </article>
                  )
                })}
              </div>
            </section>
          )}
        </div>
      </main>

      {toast && <div className="toast"><div className="toast-check">✓</div><div><strong>{toast.title}</strong><span>{toast.message}</span></div><button onClick={() => setToast(null)} aria-label="Fechar"><X size={16} /></button></div>}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={event => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowModal(false)} aria-label="Fechar modal"><X size={18} /></button>
            <div className="modal-icon"><Dumbbell size={21} /></div>
            <p className="eyebrow">NOVO PLANO</p>
            <h2>Monte seu próximo treino</h2>
            <p className="muted">Escolha um foco para começar com uma sugestão personalizada.</p>
            <div className="goal-options">
              <button onClick={() => createWorkout('Força')}><Flame size={18} /><span><strong>Força</strong><small>Ganhar potência e massa</small></span><ChevronRight size={16} /></button>
              <button onClick={() => createWorkout('Mobilidade')}><Sparkles size={18} /><span><strong>Mobilidade</strong><small>Movimente-se melhor</small></span><ChevronRight size={16} /></button>
              <button onClick={() => createWorkout('Full body')}><Dumbbell size={18} /><span><strong>Full body</strong><small>Corpo inteiro em uma sessão</small></span><ChevronRight size={16} /></button>
            </div>
          </div>
        </div>
      )}
      {editingExerciseId && (() => {
        const exercise = userData.exercises.find(item => item.id === editingExerciseId)
        if (!exercise) return null
        return (
          <div className="modal-backdrop" onClick={() => setEditingExerciseId(null)}>
            <div className="modal" onClick={event => event.stopPropagation()}>
              <button className="modal-close" onClick={() => setEditingExerciseId(null)} aria-label="Fechar modal"><X size={18} /></button>
              <div className="modal-icon"><Pencil size={21} /></div>
              <p className="eyebrow">EDITAR EXERCÍCIO</p>
              <h2>{exercise.name}</h2>
              <form className="settings-form" onSubmit={updateExercise}>
                <label>Nome<input name="name" defaultValue={exercise.name} required /></label>
                <label>Séries<input name="sets" defaultValue={exercise.sets} required /></label>
                <label>Carga<input name="weight" defaultValue={exercise.weight} required /></label>
                <button className="primary-button" type="submit"><Save size={16} /> Salvar alterações</button>
              </form>
            </div>
          </div>
        )
      })()}
      {editingWorkoutId && (() => {
        const workout = userData.workouts.find(item => item.id === editingWorkoutId)
        if (!workout) return null
        return (
          <div className="modal-backdrop" onClick={() => setEditingWorkoutId(null)}>
            <div className="modal" onClick={event => event.stopPropagation()}>
              <button className="modal-close" onClick={() => setEditingWorkoutId(null)} aria-label="Fechar modal"><X size={18} /></button>
              <div className="modal-icon"><Pencil size={21} /></div>
              <p className="eyebrow">EDITAR TREINO</p>
              <h2>{workout.title}</h2>
              <form className="settings-form" onSubmit={updateWorkout}>
                <label>Nome<input name="title" defaultValue={workout.title} required /></label>
                <label>Descrição<input name="subtitle" defaultValue={workout.subtitle} required /></label>
                <label>Categoria<input name="category" defaultValue={workout.category} required /></label>
                <label>Duração em minutos<input name="time" type="number" min="1" defaultValue={workout.time} required /></label>
                <label>Nível<input name="level" defaultValue={workout.level} required /></label>
                <label>Calorias estimadas<input name="calories" type="number" min="1" defaultValue={workout.calories} required /></label>
                <button className="primary-button" type="submit"><Save size={16} /> Salvar treino</button>
              </form>
            </div>
          </div>
        )
      })()}
      {checklistEditorId && (() => {
        const workout = userData.workouts.find(item => item.id === checklistEditorId)
        if (!workout) return null
        return (
          <div className="modal-backdrop" onClick={() => setChecklistEditorId(null)}>
            <div className="modal" onClick={event => event.stopPropagation()}>
              <button className="modal-close" onClick={() => setChecklistEditorId(null)} aria-label="Fechar modal"><X size={18} /></button>
              <div className="modal-icon"><ListChecks size={21} /></div>
              <p className="eyebrow">CHECKLIST</p>
              <h2>Exercícios de "{workout.title}"</h2>
              <p className="muted">Adicione exercícios da lista e configure as séries e o timer de cada um.</p>
              {userData.exercises.length > 0 ? (
                <div className="checklist-picker">
                  {userData.exercises.map(exercise => {
                    const selected = (workout.checklist || []).find(chk => chk.exerciseId === exercise.id)
                    const checked = Boolean(selected)
                    return (
                      <div className={`checklist-picker-row ${checked ? 'checked' : ''}`} key={exercise.id}>
                        <input type="checkbox" checked={checked} onChange={() => toggleExerciseInChecklist(workout.id, exercise)} aria-label={`Adicionar ${exercise.name}`} />
                        <span className="checklist-picker-name"><strong>{exercise.name}</strong><small>{exercise.weight}</small></span>
                        {checked && <>
                          <label className="exercise-setting">Séries<input type="number" min="1" max="99" value={selected.sets} onChange={event => updateWorkoutExercise(workout.id, exercise.id, { sets: Number(event.target.value) || 1 })} /></label>
                          <label className="exercise-setting">Timer (s)<input type="number" min="5" max="3600" value={selected.restSeconds} onChange={event => updateWorkoutExercise(workout.id, exercise.id, { restSeconds: Number(event.target.value) || 5 })} /></label>
                        </>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="empty-state small"><p>Você ainda não tem exercícios cadastrados. Adicione em "Exercícios" primeiro.</p></div>
              )}
            </div>
          </div>
        )
      })()}
      {activeSessionId && (() => {
        const workout = userData.workouts.find(item => item.id === activeSessionId)
        if (!workout) return null
        const doneCount = workout.checklist.filter(chk => chk.done).length
        return (
          <div className="modal-backdrop" onClick={() => setActiveSessionId(null)}>
            <div className="modal" onClick={event => event.stopPropagation()}>
              <button className="modal-close" onClick={() => setActiveSessionId(null)} aria-label="Fechar modal"><X size={18} /></button>
              <div className="modal-icon"><Dumbbell size={21} /></div>
              <p className="eyebrow">SESSÃO DE TREINO</p>
              <h2>{workout.title}</h2>
              <p className="muted">Faça as séries configuradas, use o timer de cada exercício e marque quando concluir.</p>
              <div className="progress-bar session-progress"><span style={{ width: `${workout.progress}%` }} /></div>
              <div className="session-checklist">
                {workout.checklist.map(item => {
                  const detail = userData.exercises.find(exercise => exercise.id === item.exerciseId)
                  const timerActive = exerciseTimer?.workoutId === workout.id && exerciseTimer.exerciseId === item.exerciseId
                  const timerValue = timerActive ? exerciseTimer.remaining : item.restSeconds
                  return (
                    <div className={`session-check-row ${item.done ? 'done' : ''}`} key={item.exerciseId}>
                      <input type="checkbox" checked={item.done} onChange={() => toggleSessionExercise(workout.id, item.exerciseId)} />
                      <span className="session-check-name">
                        <strong>{item.name}</strong>
                        {detail && <small>{detail.weight}</small>}
                      </span>
                      <label className="exercise-setting session-setting">Séries<input type="number" min="1" max="99" value={item.sets || 1} onChange={event => updateWorkoutExercise(workout.id, item.exerciseId, { sets: Number(event.target.value) || 1 })} /></label>
                      <button type="button" className={`exercise-timer-button ${timerActive && exerciseTimer.remaining <= 0 ? 'finished' : ''}`} onClick={() => startExerciseTimer(workout.id, item)}><Timer size={13} /> {timerActive ? `${String(Math.floor(Math.max(timerValue, 0) / 60)).padStart(2, '0')}:${String(Math.max(timerValue, 0) % 60).padStart(2, '0')}` : 'Iniciar'}</button>
                    </div>
                  )
                })}
              </div>
              {workout.progress >= 100 ? (
                <div className="session-complete"><Check size={16} /> Treino concluído!</div>
              ) : (
                <p className="session-hint">{doneCount} de {workout.checklist.length} exercícios concluídos.</p>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default App
