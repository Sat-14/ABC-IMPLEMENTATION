import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { Button } from '../components/common/Button'
import { Input } from '../components/common/Input'
import { Card } from '../components/common/Card'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-bg-secondary">
      {/* Ambient Background - Subtle Light Mode Gradients */}
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] bg-cyan-100/50 rounded-full blur-3xl opacity-60" />

      <Card className="w-full max-w-md relative z-10 border-border-subtle bg-white/80 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-600 to-cyan-600 mb-4 shadow-lg shadow-primary-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Welcome Back</h1>
          <p className="text-text-secondary mt-2 text-sm">Sign in to Digital Chain of Custody</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <div className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="name@agency.gov"
              icon={Mail}
              autoComplete="email"
              className="bg-white"
            />

            <div className="space-y-1.5">
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                icon={Lock}
                autoComplete="current-password"
                className="bg-white"
              />
              <div className="flex justify-end">
                <Link to="/forgot-password" className="text-xs text-primary-600 hover:text-primary-700 font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full shadow-lg shadow-primary-500/20"
            isLoading={loading}
            size="lg"
          >
            Sign In
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-center text-sm text-text-tertiary">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Create Account
            </Link>
          </p>
        </form>
      </Card>

      <div className="absolute bottom-6 text-center text-xs text-text-tertiary">
        &copy; {new Date().getFullYear()} DCoC Secure Systems. Authorized access only.
      </div>
    </div>
  )
}
