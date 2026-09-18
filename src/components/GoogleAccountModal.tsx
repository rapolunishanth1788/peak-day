import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, User, Plus, ArrowRight, ShieldCheck, Check, Globe, Sparkles } from 'lucide-react';
import { auth, googleProvider } from '../services/firebase';
import { signInWithPopup } from 'firebase/auth';

interface GoogleAccount {
  name: string;
  email: string;
  avatarText: string;
  bgColor: string;
  isDefault?: boolean;
}

interface GoogleAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAccount: (account: { name: string; email: string }) => void;
}

export const GoogleAccountModal: React.FC<GoogleAccountModalProps> = ({
  isOpen,
  onClose,
  onSelectAccount,
}) => {
  // Device-logged-in Google accounts saved on this device
  const [accounts, setAccounts] = useState<GoogleAccount[]>(() => {
    try {
      const saved = localStorage.getItem('peakday_saved_google_accounts');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      // Ignore
    }
    return [];
  });

  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [loadingAccountEmail, setLoadingAccountEmail] = useState<string | null>(null);
  const [popupError, setPopupError] = useState<string | null>(null);

  const handleChoose = (acc: { name: string; email: string }) => {
    setLoadingAccountEmail(acc.email);
    setTimeout(() => {
      onSelectAccount(acc);
      setLoadingAccountEmail(null);
      onClose();
    }, 500);
  };

  const handleFirebasePopup = async () => {
    setPopupError(null);
    setLoadingAccountEmail('popup');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user && result.user.email) {
        onSelectAccount({
          email: result.user.email,
          name: result.user.displayName || result.user.email.split('@')[0],
        });
        onClose();
      }
    } catch (err: any) {
      console.warn('Firebase popup sign-in note:', err);
      if (err.code === 'auth/popup-blocked' || err.code === 'auth/operation-not-supported-in-this-environment') {
        setPopupError('Browser blocked popup in preview. Please select one of your device Google accounts below.');
      } else if (err.code === 'auth/popup-closed-by-user') {
        // User closed popup
      } else {
        setPopupError(err.message || 'Popup sign-in not available in iframe. Please choose an account below.');
      }
    } finally {
      setLoadingAccountEmail(null);
    }
  };

  const handleAddNewAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail.trim()) return;
    const resolvedName = customName.trim() || customEmail.split('@')[0];
    const newAcc: GoogleAccount = {
      name: resolvedName,
      email: customEmail.trim().toLowerCase(),
      avatarText: resolvedName.charAt(0).toUpperCase(),
      bgColor: 'bg-[#34a853]',
    };
    setAccounts((prev) => [newAcc, ...prev]);
    setIsAddingAccount(false);
    handleChoose(newAcc);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-md rounded-2xl bg-[#0f172a] border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.7)] text-slate-100 overflow-hidden"
          >
            {/* Google Header */}
            <div className="p-6 pb-4 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <svg className="w-6 h-6" viewBox="0 0 24 24">
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
                  <span className="text-sm font-semibold text-white tracking-wide">Sign in with Google</span>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4">
                <h3 className="text-lg font-bold text-white">Choose an account</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  to continue to <span className="text-blue-400 font-semibold">Peak Day Platform</span>
                </p>
              </div>
            </div>

            {/* Account List */}
            <div className="p-4 space-y-2 max-h-80 overflow-y-auto">
              {!isAddingAccount ? (
                <>
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">
                    Google Accounts on this Device
                  </div>

                  {accounts.map((acc) => {
                    const isLoading = loadingAccountEmail === acc.email;
                    return (
                      <button
                        key={acc.email}
                        onClick={() => handleChoose(acc)}
                        disabled={!!loadingAccountEmail}
                        className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 hover:border-blue-500/50 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-full ${acc.bgColor} text-white font-bold flex items-center justify-center text-sm shadow-md shrink-0`}
                          >
                            {acc.avatarText}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-white truncate">{acc.name}</span>
                              {acc.isDefault && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-400 truncate">{acc.email}</div>
                          </div>
                        </div>

                        {isLoading ? (
                          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
                        )}
                      </button>
                    );
                  })}

                  {popupError && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>{popupError}</span>
                    </div>
                  )}

                  {/* Add another Google account option */}
                  <button
                    onClick={() => setIsAddingAccount(true)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-800/60 border border-transparent hover:border-slate-700 transition-all text-left mt-2 text-slate-300 hover:text-white"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                      <Plus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-medium">Use another Google account</div>
                      <div className="text-xs text-slate-400">Sign in with a different Gmail address</div>
                    </div>
                  </button>

                  {/* Direct Google OAuth Popup option */}
                  <button
                    onClick={handleFirebasePopup}
                    disabled={!!loadingAccountEmail}
                    className="w-full flex items-center justify-center gap-2.5 p-2.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-300 text-xs font-medium transition-all"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Open Google Sign-In in browser popup</span>
                  </button>
                </>
              ) : (
                /* Form to enter another Google account */
                <form onSubmit={handleAddNewAccount} className="space-y-3 p-2">
                  <div className="text-xs font-semibold text-slate-300">Enter Google Account Details</div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Google Email (Gmail)</label>
                    <input
                      type="email"
                      placeholder="yourname@gmail.com"
                      value={customEmail}
                      onChange={(e) => setCustomEmail(e.target.value)}
                      required
                      autoFocus
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Your Full Name (Optional)</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Johnson"
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingAccount(false)}
                      className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold"
                    >
                      Continue
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Google Security Notice Footer */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                To continue, Google securely shares your name, email address, and profile with Peak Day.
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
