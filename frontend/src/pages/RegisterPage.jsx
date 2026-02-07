import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, User, Mail, Lock, Building, Briefcase, ArrowRight } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { ROLE_LABELS } from '../utils/roles'
import { Button } from '../components/common/Button'
import { Input, Select } from '../components/common/Input'
import { Card } from '../components/common/Card'

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '',
    email: '',
    password: '',
    role: 'investigator',
    department: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  if (isAuthenticated) {
    navigate('/dashboard', { replace: true })
    return null
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await register(form)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden bg-bg-secondary">
      {/* Ambient Background - Light Mode */}
      <div className="absolute top-[-20%] right-[-20%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-3xl opacity-60" />
      <div className="absolute bottom-[-20%] left-[-20%] w-[50%] h-[50%] bg-cyan-100/50 rounded-full blur-3xl opacity-60" />

      <Card className="w-full max-w-lg relative z-10 border-border-subtle bg-white/80 shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-primary-600 to-cyan-600 mb-4 shadow-lg shadow-primary-500/20">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">Create Account</h1>
          <p className="text-text-secondary mt-2 text-sm">Join the Digital Chain of Custody Network</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <Input
                label="Full Name"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                required
                placeholder="Officer Jane Doe"
                icon={User}
                className="bg-white"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <Input
                label="Email Address"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="name@agency.gov"
                icon={Mail}
                className="bg-white"
              />
            </div>

            <div className="col-span-1 md:col-span-2">
              <Input
                label="Password"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                minLength={6}
                placeholder="Min. 6 characters"
                icon={Lock}
                className="bg-white"
              />
            </div>

            <Select
              label="Role"
              name="role"
              value={form.role}
              onChange={handleChange}
              icon={Briefcase}
              className="bg-white"
            >
              {Object.entries(ROLE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </Select>

            <Input
              label="Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              placeholder="Unit / Division"
              icon={Building}
              className="bg-white"
            />
          </div>

          <Button
            type="submit"
            className="w-full shadow-lg shadow-primary-500/20"
            isLoading={loading}
            size="lg"
          >
            Create Account
            <ArrowRight className="w-4 h-4" />
          </Button>

          <p className="text-center text-sm text-text-tertiary">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-semibold transition-colors">
              Sign In
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
