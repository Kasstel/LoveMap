import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"

// TODO: форма login / register — пишем вместе следующим шагом
function AuthPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [formError, setFormError] = useState<string|null>(null)
  const [submitting, setSubmitting] = useState(false)

  const signIn = useAuthStore((state)=> state.signIn)
  const signUp = useAuthStore((state)=> state.signUp)

  async function handleSubmit(e: React.SubmitEvent<HTMLFormElement>){
    e.preventDefault()
    setFormError(null)
    setSubmitting(true)

    try{
      if (isRegister){
        await signUp(email, password)
      }
      else{
        await signIn(email, password)
      }
    }
    catch(error){
      setFormError(error instanceof Error ? error.message : 'Не получилось войти')
    }
    finally{
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-tint">
      <div className="w-full max-w-sm rounded-panel bg-surface p-8 shadow-panel">
        <h1 className="font-display text-2xl font-semibold text-primary">Love Map</h1>
        <form onSubmit={handleSubmit}>
            <input type="email" className="mt-3 w-full rounded-control border border-line px-3 py-2"
placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)}></input>
            <input type="password" className="mt-3 w-full rounded-control border border-line px-3 py-2"
placeholder="Password" value={password} onChange={(event) => setPassword(event.target.value)}></input>
            {formError && <p className="text-danger">{formError}</p>}
            <button type="submit" className="mt-4 w-full rounded-control bg-primary py-2 text-on-primary disabled:bg-primary-disabled" disabled={submitting}>
              {submitting ? 'Секунду...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
            </button>
            <button
              type="button"
              onClick={() => setIsRegister(!isRegister)}
              className="mt-3 w-full text-sm text-primary-muted"
            >
              {isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}
            </button>
        </form>
      </div>
    </div>
  )
}

export default AuthPage
