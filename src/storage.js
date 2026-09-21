const USERS_KEY = 'feettrack.users'
const SESSION_KEY = 'feettrack.session'
const dataKey = (email) => `feettrack.data.${email.toLowerCase()}`

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

export function getUsers() {
  return readJSON(USERS_KEY, [])
}

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
}

export function findUserByEmail(email) {
  return getUsers().find(user => user.email.toLowerCase() === email.toLowerCase())
}

export function registerUser({ name, email, password }) {
  if (findUserByEmail(email)) {
    return { error: 'Já existe uma conta com esse email.' }
  }
  const user = { name: name.trim(), email: email.trim().toLowerCase(), password }
  saveUsers([...getUsers(), user])
  saveUserData(user.email, createDefaultUserData())
  setSession(user.email)
  return { user: { name: user.name, email: user.email } }
}

// Senhas ficam em texto puro no localStorage: adequado para este protótipo (sem backend), não para produção.
export function loginUser({ email, password }) {
  const user = findUserByEmail(email)
  if (!user || user.password !== password) {
    return { error: 'Email ou senha inválidos.' }
  }
  setSession(user.email)
  return { user: { name: user.name, email: user.email } }
}

export function getSession() {
  return localStorage.getItem(SESSION_KEY)
}

export function setSession(email) {
  localStorage.setItem(SESSION_KEY, email)
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY)
}

export function updateUserProfile(email, updates) {
  const users = getUsers()
  const index = users.findIndex(user => user.email.toLowerCase() === email.toLowerCase())
  if (index === -1) return null
  users[index] = { ...users[index], ...updates }
  saveUsers(users)
  return users[index]
}

export function getUserData(email) {
  return readJSON(dataKey(email), null)
}

export function saveUserData(email, data) {
  localStorage.setItem(dataKey(email), JSON.stringify(data))
}

export function createDefaultUserData() {
  return {
    plan: 'free',
    planCycle: null,
    supportTickets: [],
    goal: { title: 'Construir força', current: 8, target: 12, deadline: '31 mai' },
    stats: { streakDays: 12, totalMinutes: 402, calories: 3240 },
    week: [
      { day: 'SEG', date: '12', status: 'done' },
      { day: 'TER', date: '13', status: 'done' },
      { day: 'QUA', date: '14', status: 'active' },
      { day: 'QUI', date: '15', status: 'rest' },
      { day: 'SEX', date: '16', status: 'planned' },
      { day: 'SAB', date: '17', status: 'rest' },
      { day: 'DOM', date: '18', status: 'rest' },
    ],
    workouts: [
      { id: 'w1', title: 'Força & potência', subtitle: 'Peito, ombros e tríceps', time: 45, level: 'Intermediário', progress: 72, tone: 'dark', category: 'Força', calories: 380 },
      { id: 'w2', title: 'HIIT cardio', subtitle: 'Corrida e intervalos', time: 28, level: 'Intermediário', progress: 0, tone: 'light', category: 'Cardio', calories: 310 },
      { id: 'w3', title: 'Full body', subtitle: 'Corpo inteiro', time: 32, level: 'Iniciante', progress: 38, tone: 'light', category: 'Full body', calories: 260 },
      { id: 'w4', title: 'Mobilidade', subtitle: 'Alongamento e core', time: 20, level: 'Todos os níveis', progress: 0, tone: 'outline', category: 'Mobilidade', calories: 120 },
    ],
    exercises: [
      { id: 'e1', name: 'Supino reto', sets: '4 séries', weight: '42 kg', icon: 'SR' },
      { id: 'e2', name: 'Desenvolvimento', sets: '3 séries', weight: '18 kg', icon: 'DS' },
      { id: 'e3', name: 'Tríceps na polia', sets: '3 séries', weight: '24 kg', icon: 'TP' },
    ],
    lastWorkout: { title: 'Full body', date: 'Ontem à noite', duration: '32 min', calories: '260 kcal' },
  }
}
