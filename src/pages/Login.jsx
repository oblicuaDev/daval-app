import logo from '../logo-daval.jpeg';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, LogIn, Eye, EyeOff, UserPlus,
  Building2, User, MapPin, ArrowLeft, ArrowRight, CheckCircle2, X,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { companiesApi } from '../api/modules/companies.js';
import { usersApi } from '../api/modules/users.js';

const REGISTER_STEPS = [
  { id: 'empresa',  label: 'Empresa',  icon: Building2 },
  { id: 'usuario',  label: 'Usuario',  icon: User },
  { id: 'sucursal', label: 'Sucursal', icon: MapPin },
];

const INITIAL = {
  companyName: '', nit: '', companyEmail: '', companyPhone: '',
  userName: '', userEmail: '', password: '', confirmPassword: '',
  sucursalName: '', city: '', address: '',
};

function FieldInput({ label, ...props }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-400 mb-1.5">{label}</label>
      <input {...props} className="input" />
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail]               = useState('');
  const [password, setPassword]         = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(0);
  const [registerForm, setRegisterForm] = useState(INITIAL);
  const [registerError, setRegisterError] = useState('');
  const [registering, setRegistering]   = useState(false);
  const [showRegPass, setShowRegPass]   = useState(false);
  const [welcomeName, setWelcomeName]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        if (result.role === 'admin')        navigate('/admin');
        else if (result.role === 'advisor') navigate('/asesor');
        else if (result.role === 'client')  navigate('/cliente');
      } else {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      }
    } catch {
      setError('Credenciales incorrectas. Verifica tu email y contraseña.');
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setRegisterError('');
    setRegisterForm(prev => ({ ...prev, [field]: value }));
  }

  function closeRegister() {
    setShowRegister(false);
    setRegisterStep(0);
    setRegisterForm(INITIAL);
    setRegisterError('');
    setShowRegPass(false);
  }

  function validateStep(step = registerStep) {
    const f = registerForm;
    if (step === 0) {
      if (!f.companyName || !f.nit || !f.companyEmail || !f.companyPhone)
        return 'Completa la información de la empresa.';
    }
    if (step === 1) {
      if (!f.userName || !f.userEmail || !f.password || !f.confirmPassword)
        return 'Completa los datos del usuario.';
      if (f.password.length < 6) return 'La contraseña debe tener mínimo 6 caracteres.';
      if (f.password !== f.confirmPassword) return 'Las contraseñas no coinciden.';
    }
    if (step === 2) {
      if (!f.sucursalName || !f.city || !f.address)
        return 'Completa los datos de la sucursal.';
    }
    return '';
  }

  function handleNext() {
    const msg = validateStep();
    if (msg) { setRegisterError(msg); return; }
    setRegisterStep(s => Math.min(s + 1, REGISTER_STEPS.length - 1));
  }

  async function handleRegisterSubmit(e) {
    e.preventDefault();
    const msg = REGISTER_STEPS.map((_, i) => validateStep(i)).find(Boolean);
    if (msg) { setRegisterError(msg); return; }

    setRegistering(true);
    setRegisterError('');
    try {
      const company = await companiesApi.create({
        name:  registerForm.companyName.trim(),
        nit:   registerForm.nit.trim(),
        email: registerForm.companyEmail.trim(),
        phone: registerForm.companyPhone.trim(),
      });

      const branch = await companiesApi.createBranch(company.id, {
        name:    registerForm.sucursalName.trim(),
        city:    registerForm.city.trim(),
        address: registerForm.address.trim(),
      });

      await usersApi.create({
        name:     registerForm.userName.trim(),
        email:    registerForm.userEmail.trim(),
        password: registerForm.password,
        role:     'client',
        branchId: branch.id,
      });

      await login(registerForm.userEmail.trim(), registerForm.password);
      setWelcomeName(registerForm.userName.trim());
      closeRegister();
    } catch (err) {
      setRegisterError(err?.response?.data?.message || 'Error al crear la cuenta. Intenta nuevamente.');
    } finally {
      setRegistering(false);
    }
  }

  const CurrentStepIcon = REGISTER_STEPS[registerStep].icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4 relative overflow-hidden">

      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-brand-900/10 blur-[120px]" />
      </div>

      <div className="relative w-full max-w-[380px] animate-scale-in">

        <div className="text-center mb-7">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-card mb-4 overflow-hidden">
            <img src={logo} alt="DAVAL" className="w-full h-full object-contain p-1" />
          </div>
          <h1 className="text-lg font-semibold text-zinc-100 tracking-tight">Distribuciones DAVAL</h1>
          <p className="text-xs text-zinc-600 mt-0.5">Sistema de gestión comercial</p>
        </div>

        <div className="card p-7 shadow-elevated">
          <h2 className="text-sm font-semibold text-zinc-300 mb-5">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-3.5 h-3.5 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="usuario@empresa.com"
                  className="input pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 w-3.5 h-3.5 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="input pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 bg-red-950/50 border border-red-800/50 text-red-300 text-xs px-3 py-2.5 rounded-lg animate-fade-in">
                <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-1">
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-5 pt-5 border-t border-zinc-800/60">
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="btn-secondary w-full text-xs"
            >
              <UserPlus className="w-3.5 h-3.5" />
              Registrarme como cliente
            </button>
          </div>
        </div>

        <p className="text-center text-[10px] text-zinc-700 mt-5">
          Distribuciones DAVAL · Colombia
        </p>
      </div>

      {/* Register modal */}
      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-modal overflow-hidden animate-scale-in">

            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-brand-900/60 border border-brand-800/50 flex items-center justify-center">
                  <CurrentStepIcon className="w-4 h-4 text-brand-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-zinc-100">Registro de cliente</p>
                  <p className="text-[10px] text-zinc-600">{REGISTER_STEPS[registerStep].label}</p>
                </div>
              </div>
              <button onClick={closeRegister} className="btn-ghost p-1.5 text-zinc-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 pt-5">
              <div className="grid grid-cols-3 gap-2">
                {REGISTER_STEPS.map((step, i) => {
                  const StepIcon = step.icon;
                  const isActive = i === registerStep;
                  const isDone   = i < registerStep;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 rounded-lg border px-3 py-2 transition-all duration-200 ${
                        isActive ? 'border-brand-700/60 bg-brand-950/50 text-brand-300'
                        : isDone ? 'border-emerald-800/50 bg-emerald-950/40 text-emerald-400'
                        : 'border-zinc-800 bg-zinc-900/50 text-zinc-600'
                      }`}
                    >
                      {isDone
                        ? <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                        : <StepIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      }
                      <span className="text-xs font-medium truncate">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-4">
              {registerStep === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <FieldInput label="Nombre de la empresa *" value={registerForm.companyName}
                      onChange={e => updateField('companyName', e.target.value)}
                      placeholder="Ferretería El Perno S.A.S." />
                  </div>
                  <FieldInput label="NIT *" value={registerForm.nit}
                    onChange={e => updateField('nit', e.target.value)} placeholder="900.000.000-0" />
                  <FieldInput label="Teléfono *" value={registerForm.companyPhone}
                    onChange={e => updateField('companyPhone', e.target.value)} placeholder="300-000-0000" />
                  <div className="sm:col-span-2">
                    <FieldInput label="Correo de la empresa *" type="email" value={registerForm.companyEmail}
                      onChange={e => updateField('companyEmail', e.target.value)} placeholder="compras@empresa.com" />
                  </div>
                </div>
              )}

              {registerStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <FieldInput label="Nombre del usuario *" value={registerForm.userName}
                      onChange={e => updateField('userName', e.target.value)} placeholder="Nombre completo" />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldInput label="Correo de acceso *" type="email" value={registerForm.userEmail}
                      onChange={e => updateField('userEmail', e.target.value)} placeholder="usuario@empresa.com" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-400 mb-1.5">Contraseña *</label>
                    <div className="relative">
                      <input type={showRegPass ? 'text' : 'password'} value={registerForm.password}
                        onChange={e => updateField('password', e.target.value)}
                        placeholder="••••••••" className="input pr-10" />
                      <button type="button" onClick={() => setShowRegPass(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-400 transition-colors">
                        {showRegPass ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                  <FieldInput label="Confirmar contraseña *"
                    type={showRegPass ? 'text' : 'password'} value={registerForm.confirmPassword}
                    onChange={e => updateField('confirmPassword', e.target.value)} placeholder="••••••••" />
                </div>
              )}

              {registerStep === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <FieldInput label="Nombre de la sucursal *" value={registerForm.sucursalName}
                      onChange={e => updateField('sucursalName', e.target.value)} placeholder="Principal" />
                  </div>
                  <FieldInput label="Ciudad *" value={registerForm.city}
                    onChange={e => updateField('city', e.target.value)} placeholder="Bogotá" />
                  <FieldInput label="Dirección *" value={registerForm.address}
                    onChange={e => updateField('address', e.target.value)} placeholder="Cra 10 # 5-23" />
                </div>
              )}

              {registerError && (
                <div className="flex items-start gap-2 bg-red-950/50 border border-red-800/50 text-red-300 text-xs px-3 py-2.5 rounded-lg animate-fade-in">
                  <X className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  {registerError}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => registerStep === 0 ? closeRegister() : setRegisterStep(s => s - 1)}
                  className="btn-secondary text-xs px-4"
                  disabled={registering}
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {registerStep === 0 ? 'Cancelar' : 'Atrás'}
                </button>

                {registerStep < REGISTER_STEPS.length - 1 ? (
                  <button type="button" onClick={handleNext} className="btn-primary text-xs px-4">
                    Continuar
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={registering}
                    className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-600 text-white font-semibold rounded-lg px-4 py-2.5 text-xs transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {registering ? (
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    {registering ? 'Creando...' : 'Crear cuenta'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Welcome modal */}
      {welcomeName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl shadow-modal p-7 text-center animate-scale-in">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950/60 border border-emerald-800/50 flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
            </div>
            <h2 className="text-lg font-bold text-zinc-50 mb-2 tracking-tight">¡Bienvenido, {welcomeName}!</h2>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Tu cuenta ha sido creada. Ahora puedes solicitar cotizaciones de manera autónoma antes del cierre de tu ruta.
            </p>
            <button
              type="button"
              onClick={() => { setWelcomeName(''); navigate('/cliente'); }}
              className="btn-primary w-full mt-6 text-sm"
            >
              <ClipboardList className="w-4 h-4" />
              Ir al catálogo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
