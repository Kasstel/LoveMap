import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { InkFrame } from "../shared/InkFrame"
import { PaperTexture } from "../shared/PaperTexture"
import { VelvetField } from "../shared/VelvetField"
import { VelvetButton } from "../shared/VelvetButton"

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
    <div className="bg-velvet-page relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <PaperTexture variant="velvet" />
      
      {/* угловые орнаменты: один и тот же рисунок, зеркалим по осям под остальные три угла */}
      <InkFrame variant="corner" className="absolute left-6 top-6 h-16 w-16 text-on-velvet-muted/70" />
      <InkFrame variant="corner" className="absolute right-6 top-6 h-16 w-16 -scale-x-100 text-on-velvet-muted/70" />
      <InkFrame variant="corner" className="absolute bottom-6 left-6 h-16 w-16 -scale-y-100 text-on-velvet-muted/70" />
      <InkFrame variant="corner" className="absolute bottom-6 right-6 h-16 w-16 -scale-x-100 -scale-y-100 text-on-velvet-muted/70" />

      <div className="relative w-full max-w-sm text-center">
        <h1 className="font-display text-4xl text-on-velvet">Love Map</h1>

        <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-4 text-left">
          <VelvetField
            label="Почта"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <VelvetField
            label="Пароль"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          {formError && <p className="text-sm text-danger-soft">{formError}</p>}

          <VelvetButton type="submit" className="mt-8" disabled={submitting}>
            {submitting ? 'Секунду...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
          </VelvetButton>

          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="mt-5 flex w-full flex-col items-center text-sm text-on-velvet-muted"
          >
            <span>{isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}</span>
            
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthPage
