import { useState } from "react"
import { useAuthStore } from "../../stores/authStore"
import { InkFrame } from "../shared/InkFrame"
import { PaperTexture } from "../shared/PaperTexture"

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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,var(--color-velvet),var(--color-velvet-deep))] px-4">
      <PaperTexture />

      {/* угловые орнаменты: один и тот же рисунок, зеркалим по осям под остальные три угла */}
      <InkFrame variant="corner" className="absolute left-6 top-6 h-16 w-16 text-on-velvet-muted/70" />
      <InkFrame variant="corner" className="absolute right-6 top-6 h-16 w-16 -scale-x-100 text-on-velvet-muted/70" />
      <InkFrame variant="corner" className="absolute bottom-6 left-6 h-16 w-16 -scale-y-100 text-on-velvet-muted/70" />
      <InkFrame variant="corner" className="absolute bottom-6 right-6 h-16 w-16 -scale-x-100 -scale-y-100 text-on-velvet-muted/70" />

      <div className="relative w-full max-w-sm text-center">
        <h1 className="font-display text-4xl text-on-velvet">Love Map</h1>

        <form onSubmit={handleSubmit} className="mt-10 text-left">
          <label className="block">
            <span className="sr-only">Email</span>
            <input
              type="email"
              className="w-full border-b border-on-velvet-muted/40 bg-transparent py-2 text-on-velvet placeholder:text-on-velvet-muted focus:border-on-velvet focus:outline-none"
              placeholder="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="mt-5 block">
            <span className="sr-only">Пароль</span>
            <input
              type="password"
              className="w-full border-b border-on-velvet-muted/40 bg-transparent py-2 text-on-velvet placeholder:text-on-velvet-muted focus:border-on-velvet focus:outline-none"
              placeholder="Пароль"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>

          {formError && <p className="mt-3 text-sm text-danger-soft">{formError}</p>}

          <button
            type="submit"
            className="mt-8 w-full rounded-control bg-primary py-2 text-on-primary disabled:bg-primary-disabled"
            disabled={submitting}
          >
            {submitting ? 'Секунду...' : isRegister ? 'Зарегистрироваться' : 'Войти'}
          </button>

          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="mt-5 flex w-full flex-col items-center text-sm text-on-velvet-muted"
          >
            <span>{isRegister ? 'Уже есть аккаунт? Войти' : 'Нет аккаунта? Регистрация'}</span>
            <InkFrame variant="underline" className="mt-1 h-3 w-44 text-on-velvet-muted" />
          </button>
        </form>
      </div>
    </div>
  )
}

export default AuthPage
