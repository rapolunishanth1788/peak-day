import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  CheckCircle2, 
  Dumbbell, 
  GraduationCap, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  User as UserIcon,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { MountainLogo } from './MountainLogo';
import { MountainBackground } from './MountainBackground';
import { GoogleAccountModal } from './GoogleAccountModal';
import { api } from '../services/api';
import { User } from '../types';

interface AuthPageProps {
  onAuthSuccess: (user: User) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // User Onboarding details
  const [occupation, setOccupation] = useState<'student' | 'job' | 'both'>('student');
  const [age, setAge] = useState<string>('');
  const [primaryGoals, setPrimaryGoals] = useState<string>('');
  const [studyingFor, setStudyingFor] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resetSent, setResetSent] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!password) {
      setError('Please enter your password');
      return;
    }

    if (isRegister) {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (password.length < 6) {
        setError('Password must contain at least 6 characters');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        const res = await api.register(name, email, password, {
          occupation,
          age: age ? parseInt(age, 10) : undefined,
          primaryGoals: primaryGoals.trim(),
          studyingFor: studyingFor.trim(),
        });
        onAuthSuccess(res.user);
      } else {
        const res = await api.login(email, password);
        onAuthSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    setIsGoogleModalOpen(true);
  };

  const handleSelectGoogleAccount = async (account: { name: string; email: string }) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.loginWithGoogle(account.email, account.name);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#070b14] text-slate-100 flex items-center justify-center p-4 sm:p-6 lg:p-10 overflow-hidden font-sans">
      <MountainBackground variant="login" showSummitFlag={true} />

      {/* Google Accounts Selection Modal */}
      <GoogleAccountModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center">
        {/* Left Column: Branding, Motivation & Features */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
          <div className="space-y-6">
            <div className="flex flex-col space-y-1 relative">
              {/* Continuous rotating subtle halo */}
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
                className="absolute -top-6 -left-6 w-32 h-32 rounded-full border border-blue-500/10 pointer-events-none"
              />
              <MountainLogo size="lg" />
              <p className="text-xs sm:text-sm tracking-widest text-slate-400 font-medium pl-1 flex items-center gap-2">
                <span>Plan</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>Track</span>
                <span className="w-1 h-1 rounded-full bg-slate-600" />
                <span>Achieve</span>
              </p>
            </div>

            <div className="space-y-3">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
                Better Habits. <br />
                {/* Continuous animated gradient text */}
                <motion.span 
                  animate={{ 
                    filter: ['hue-rotate(0deg)', 'hue-rotate(45deg)', 'hue-rotate(0deg)'],
                  }}
                  transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                  className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent inline-block"
                >
                  Bigger Goals.
                </motion.span>
              </h1>
              <p className="text-slate-400 text-sm sm:text-base max-w-lg leading-relaxed font-normal">
                Your all-in-one platform to manage your schedule, tasks, workouts and academics — and become the best version of yourself.
              </p>
            </div>

            {/* 4 Feature highlight pills with continuous subtle floating animation */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md pt-2">
              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-blue-500/40 transition-colors shadow-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center text-blue-400">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Organize Your</div>
                  <div className="text-sm font-semibold text-white">Schedule</div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.6, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-emerald-500/40 transition-colors shadow-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-500/15 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Manage Your</div>
                  <div className="text-sm font-semibold text-white">Daily Tasks</div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 4.3, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-cyan-500/40 transition-colors shadow-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center text-cyan-400">
                  <Dumbbell className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Track Your</div>
                  <div className="text-sm font-semibold text-white">Workouts</div>
                </div>
              </motion.div>

              <motion.div 
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 4.8, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm hover:border-purple-500/40 transition-colors shadow-sm"
              >
                <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center text-purple-400">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] text-slate-400 font-medium">Monitor Your</div>
                  <div className="text-sm font-semibold text-white">Academics</div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Handwriting Quote */}
          <div className="pt-4 lg:pt-8">
            <p className="font-handwriting text-2xl sm:text-3xl text-slate-400/90 tracking-wide rotate-[-2deg]">
              Small steps every day, <br />
              lead to big results.
            </p>
          </div>
        </div>

        {/* Right Column: Authentication Card with continuous ambient breathing aura */}
        <div className="lg:col-span-5 w-full relative">
          {/* Continuous breathing glow aura */}
          <motion.div 
            animate={{ 
              opacity: [0.35, 0.65, 0.35],
              scale: [0.98, 1.02, 0.98]
            }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-purple-600/20 blur-xl pointer-events-none"
          />

          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="relative w-full rounded-2xl bg-[#0e1424]/90 border border-slate-800/90 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-md p-6 sm:p-8"
          >
            <div className="text-center space-y-2 mb-6">
              <div className="flex justify-center mb-3">
                <MountainLogo size="md" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                {isRegister ? 'Create an Account' : 'Welcome back!'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                {isRegister 
                  ? 'Join Peak Day to master your student productivity' 
                  : 'Sign in to continue your journey.'}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs sm:text-sm space-y-1.5 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-rose-400" />
                  <span>{error}</span>
                </div>
                {error.includes('No account found') && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegister(true);
                      setError(null);
                    }}
                    className="ml-6 text-xs text-blue-400 hover:text-blue-300 font-semibold underline block"
                  >
                    Click here to create your account now →
                  </button>
                )}
              </div>
            )}

            {resetSent && (
              <div className="mb-4 p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs sm:text-sm flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
                <span>Password reset instructions have been dispatched to your email.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">Full Name</label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="e.g. Alex Morgan"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#131b2e] border border-slate-700/70 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        required={isRegister}
                      />
                    </div>
                  </div>

                  {/* Student or Job details */}
                  <div className="bg-slate-900/70 p-3 rounded-xl border border-slate-800 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">Are you a student or working in a job?</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['student', 'job', 'both'] as const).map((occ) => (
                          <button
                            key={occ}
                            type="button"
                            onClick={() => setOccupation(occ)}
                            className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize border transition-all ${
                              occupation === occ
                                ? 'bg-blue-600 border-blue-500 text-white shadow-sm'
                                : 'bg-slate-800/80 border-slate-700/70 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {occ === 'both' ? 'Both (Working Student)' : occ === 'job' ? 'Job / Work' : 'Student'}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Age</label>
                        <input
                          type="number"
                          placeholder="e.g. 21"
                          min="10"
                          max="99"
                          value={age}
                          onChange={(e) => setAge(e.target.value)}
                          className="w-full bg-[#131b2e] border border-slate-700/70 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-400 mb-1">Studying / Preparing For</label>
                        <input
                          type="text"
                          placeholder="e.g. B.Tech, GATE, Exams"
                          value={studyingFor}
                          onChange={(e) => setStudyingFor(e.target.value)}
                          className="w-full bg-[#131b2e] border border-slate-700/70 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">Your Key Daily Goals</label>
                      <input
                        type="text"
                        placeholder="e.g. Score high GPA, stick to workout routine, master coding"
                        value={primaryGoals}
                        onChange={(e) => setPrimaryGoals(e.target.value)}
                        className="w-full bg-[#131b2e] border border-slate-700/70 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="student@university.edu"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700/70 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#131b2e] border border-slate-700/70 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {isRegister && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full bg-[#131b2e] border border-slate-700/70 rounded-xl pl-10 pr-10 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      required={isRegister}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}

              {!isRegister && (
                <div className="flex items-center justify-between text-xs pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-300">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-800 text-blue-500 focus:ring-0 focus:ring-offset-0"
                    />
                    <span>Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setResetSent(true)}
                    className="text-blue-400 hover:text-blue-300 hover:underline transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{isRegister ? 'Create Account' : 'Login'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-800" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#0e1424] px-2 text-slate-500 font-medium">or</span>
              </div>
            </div>

            {/* Google Sign In Button */}
            <button
              type="button"
              onClick={handleGoogleSignInClick}
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700/80 hover:bg-slate-800/80 text-white text-sm font-medium flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-[0.99]"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7s.1-2 .4-2.7L1.9 6.4C.7 8.8 0 10.3 0 12s.7 3.2 1.9 5.6l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.2 7.5 23 12 23z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Toggle Login / Register */}
            <div className="mt-5 text-center text-xs text-slate-400">
              <span>{isRegister ? 'Already have an account? ' : "Don't have an account? "}</span>
              <button
                type="button"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setError(null);
                }}
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline ml-1"
              >
                {isRegister ? 'Sign in' : 'Sign up'}
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
