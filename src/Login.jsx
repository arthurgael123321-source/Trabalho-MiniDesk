import { useState } from 'react'
import { Activity, Eye, EyeOff, LogIn, UserPlus } from 'lucide-react'
import { registerUser, loginUser } from './storage'

function Login({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const switchMode = () => {
    setMode(current => (current === 'login' ? 'register' : 'login'))
    setError('')
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    setError('')

    if (mode === 'register') {
      if (!name.trim() || password.length < 4) {
        setError('Preencha seu nome e uma senha com pelo menos 4 caracteres.')
        return
      }
      const result = registerUser({ name, email, password })
      if (result.error) {
        setError(result.error)
        return
      }
      onAuthenticated(result.user)
      return
    }

    const result = loginUser({ email, password })
    if (result.error) {
      setError(result.error)
      return
    }
    onAuthenticated(result.user)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand auth-brand">
          <div className="brand-mark"><Activity size={20} strokeWidth={2.8} /></div>
          <span>fit<span>tracker</span></span>
        </div>
        <p className="eyebrow">{mode === 'login' ? 'ACESSE SUA CONTA' : 'CRIE SUA CONTA'}</p>
        <h1>{mode === 'login' ? 'Bem-vindo de volta' : 'Comece sua jornada'}</h1>
        <p className="muted">{mode === 'login' ? 'Entre para ver seus treinos e seu progresso.' : 'Seus dados ficam salvos neste navegador.'}</p>

        <form className="auth-form" onSubmit={handleSubmit}>
          {mode === 'register' && (
            <label>Nome
              <input type="text" value={name} onChange={event => setName(event.target.value)} placeholder="Seu nome" autoComplete="name" />
            </label>
          )}
          <label>Email
            <input type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="voce@email.com" autoComplete="email" required />
          </label>
          <label>Senha
            <div className="password-field">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} placeholder="••••••••" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} required />
              <button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button>
            </div>
          </label>
          {error && <p className="auth-error">{error}</p>}
          <button className="primary-button auth-submit" type="submit">
            {mode === 'login' ? <><LogIn size={16} /> Entrar</> : <><UserPlus size={16} /> Criar conta</>}
          </button>
        </form>

        <p className="auth-switch">
          {mode === 'login' ? 'Ainda não tem conta?' : 'Já tem uma conta?'}
          <button type="button" onClick={switchMode}>{mode === 'login' ? 'Cadastre-se' : 'Entrar'}</button>
        </p>
      </div>
    </div>
  )
}

export default Login
