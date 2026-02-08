import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, User, Mail, Lock, Building, Briefcase, ArrowRight, Fingerprint, FileCheck, Users, GitBranch, FolderTree, CheckCircle2 } from 'lucide-react'
import useAuth from '../hooks/useAuth'
import { ROLE_LABELS } from '../utils/roles'
import { Button } from '../components/common/Button'
import { Input, Select } from '../components/common/Input'

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
      setError(err.response?.data?.msg || err.message || 'Registration failed')
      console.error('Registration error details:', err)
    } finally {
      setLoading(false)
    }
  }

  const features = [
    {
      icon: Fingerprint,
      title: 'SHA-256 Hashing',
      description: 'Automatic cryptographic verification of all digital evidence',
      gradient: 'from-blue-500 to-cyan-500'
    },
    {
      icon: FileCheck,
      title: 'Immutable Audit Trail',
      description: 'Complete chain of custody tracking with hash chaining',
      gradient: 'from-purple-500 to-pink-500'
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: '6 specialized roles for legal and forensic teams',
      gradient: 'from-orange-500 to-red-500'
    },
    {
      icon: GitBranch,
      title: 'Custody Transfers',
      description: 'Secure evidence handoff workflow with approval system',
      gradient: 'from-green-500 to-emerald-500'
    },
    {
      icon: FolderTree,
      title: 'Case Management',
      description: 'Organize and link evidence to legal cases seamlessly',
      gradient: 'from-indigo-500 to-blue-500'
    },
    {
      icon: CheckCircle2,
      title: 'Integrity Verification',
      description: 'Real-time hash comparison and validation',
      gradient: 'from-teal-500 to-cyan-500'
    }
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Section - Feature Showcase (60%) */}
      <div className="lg:w-[60%] w-full relative bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6 lg:p-12 flex flex-col justify-center overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-cyan-500 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 max-w-2xl mx-auto w-full">
          {/* Header */}
          <div className="mb-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500 to-cyan-400 flex items-center justify-center shadow-2xl shadow-blue-500/50">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold text-white tracking-tight">
                Digital Chain of Custody
              </h1>
            </div>
            <p className="text-sm text-blue-100 leading-relaxed">
              Secure integrity of digital evidence for legal and forensic proceedings
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-tr ${feature.gradient} flex items-center justify-center mb-2 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-sm font-semibold text-white mb-1">
                  {feature.title}
                </h3>
                <p className="text-xs text-blue-100/80 leading-snug">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>

          {/* Footer Badge */}
          <div className="mt-4 flex items-center gap-2 text-blue-200/60 text-xs">
            <Shield className="w-3 h-3" />
            <span>Trusted by law enforcement and legal professionals worldwide</span>
          </div>
        </div>
      </div>

      {/* Right Section - Registration Form (40%) */}
      <div className="lg:w-[40%] w-full bg-bg-secondary flex items-center justify-center p-6 lg:p-8 relative">
        {/* Subtle Background Gradients */}
        <div className="absolute top-[-20%] right-[-20%] w-96 h-96 bg-blue-100/30 rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-[-20%] left-[-20%] w-96 h-96 bg-cyan-100/30 rounded-full blur-3xl opacity-60" />

        <div className="w-full max-w-md relative z-10 my-auto">
          {/* Registration Card */}
          <div className="bg-white/80 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-2xl p-6">
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-primary-600 to-cyan-600 mb-3 shadow-lg shadow-primary-500/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-xl font-bold text-text-primary tracking-tight">Create Account</h2>
              <p className="text-text-secondary mt-1 text-sm">Join the Digital Chain of Custody Network</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 px-3 py-2 rounded-xl text-sm flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {error}
                </div>
              )}

              <div className="space-y-3">
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

                <div className="grid grid-cols-2 gap-3">
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
          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} DCoC Secure Systems. Authorized access only.
          </div>
        </div>
      </div>
    </div>
  )
}
