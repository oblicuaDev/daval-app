import logo from '../logo-daval.jpeg';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Lock, LogIn, Eye, EyeOff, UserPlus,
  Building2, User, MapPin, ArrowLeft, ArrowRight, CheckCircle2, X,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

const REGISTER_STEPS = [
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'usuario', label: 'Usuario', icon: User },
  { id: 'sucursal', label: 'Sucursal', icon: MapPin },
];

const INITIAL_REGISTER_FORM = {
  companyName: '',
  nit: '',
  companyEmail: '',
  companyPhone: '',
  userName: '',
  userEmail: '',
  password: '',
  confirmPassword: '',
  sucursalName: '',
  city: '',
  address: '',
};

export default function Login() {
  const navigate = useNavigate();
  const { login, users, registerUser } = useAuth();
  const { companies, setCompanies } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [registerStep, setRegisterStep] = useState(0);
  const [registerForm, setRegisterForm] = useState(INITIAL_REGISTER_FORM);
  const [registerError, setRegisterError] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [welcomeUserName, setWelcomeUserName] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const result = login(email, password);
      if (result.success) {
        if (result.role === 'admin') navigate('/admin');
        else if (result.role === 'advisor') navigate('/asesor');
        else if (result.role === 'client') navigate('/cliente');
      } else {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.');
      }
      setLoading(false);
    }, 400);
  }

  function updateRegisterField(field, value) {
    setRegisterError('');
    setRegisterForm(prev => ({ ...prev, [field]: value }));
  }

  function closeRegister() {
    setShowRegister(false);
    setRegisterStep(0);
    setRegisterForm(INITIAL_REGISTER_FORM);
    setRegisterError('');
    setShowRegisterPassword(false);
  }

  function handleWelcomeContinue() {
    setWelcomeUserName('');
    navigate('/cliente');
  }

  function validateStep(step = registerStep) {
    if (step === 0) {
      if (!registerForm.companyName || !registerForm.nit || !registerForm.companyEmail || !registerForm.companyPhone) {
        return 'Completa la información principal de la empresa.';
      }
    }
    if (step === 1) {
      if (!registerForm.userName || !registerForm.userEmail || !registerForm.password || !registerForm.confirmPassword) {
        return 'Completa los datos del usuario administrador.';
      }
      if (registerForm.password.length < 6) return 'La contraseña debe tener mínimo 6 caracteres.';
      if (registerForm.password !== registerForm.confirmPassword) return 'Las contraseñas no coinciden.';
      if (users.some(user => user.email.toLowerCase() === registerForm.userEmail.toLowerCase())) {
        return 'Ya existe un usuario registrado con ese correo.';
      }
    }
    if (step === 2) {
      if (!registerForm.sucursalName || !registerForm.city || !registerForm.address) {
        return 'Completa los datos de la primera sucursal.';
      }
    }
    return '';
  }

  function handleNextStep() {
    const message = validateStep();
    if (message) {
      setRegisterError(message);
      return;
    }
    setRegisterStep(step => Math.min(step + 1, REGISTER_STEPS.length - 1));
  }

  function handleRegisterSubmit(e) {
    e.preventDefault();
    const currentMessage = validateStep();
    const previousMessages = REGISTER_STEPS
      .map((_, index) => validateStep(index))
      .filter(Boolean);
    const message = currentMessage || previousMessages[0];
    if (message) {
      setRegisterError(message);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newCompanyId = Math.max(0, ...companies.map(company => company.id)) + 1;
    const newUserId = Math.max(0, ...users.map(user => user.id)) + 1;
    const branchAddress = `${registerForm.address}, ${registerForm.city}`;
    const newCompany = {
      id: newCompanyId,
      name: registerForm.companyName.trim(),
      nit: registerForm.nit.trim(),
      email: registerForm.companyEmail.trim(),
      phone: registerForm.companyPhone.trim(),
      address: branchAddress,
      active: true,
      sucursales: [
        {
          id: 1,
          name: registerForm.sucursalName.trim(),
          address: branchAddress,
          city: registerForm.city.trim(),
          routeId: null,
          advisorId: null,
          active: true,
        },
      ],
    };
    const newUser = {
      id: newUserId,
      name: registerForm.userName.trim(),
      email: registerForm.userEmail.trim(),
      password: registerForm.password,
      role: 'client',
      priceListId: 1,
      companyId: newCompanyId,
      sucursalId: 1,
      contactName: registerForm.userName.trim(),
      phone: registerForm.companyPhone.trim(),
      address: branchAddress,
      initials: registerForm.userName.trim().substring(0, 2).toUpperCase(),
      createdAt: today,
    };

    setCompanies(prev => [...prev, newCompany]);
    registerUser(newUser);
    setWelcomeUserName(newUser.name);
    closeRegister();
  }

  const currentRegisterStep = REGISTER_STEPS[registerStep];
  const CurrentStepIcon = currentRegisterStep.icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="Daval"
            className="h-[70px] w-auto object-contain mx-auto mb-5"
          />
          <p className="text-gray-400 text-sm">Sistema de gestión comercial Distribuciones Daval</p>
        </div>

        {/* Login Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-100 mb-6">Iniciar Sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="usuario@oblicua.com"
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 w-4 h-4" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <LogIn className="w-4 h-4" />
              )}
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700">
            <button
              type="button"
              onClick={() => setShowRegister(true)}
              className="w-full flex items-center justify-center gap-2 border border-blue-800 bg-blue-950 text-blue-300 hover:bg-blue-900 hover:text-blue-200 font-semibold py-2.5 px-4 rounded-lg transition"
            >
              <UserPlus className="w-4 h-4" />
              Quiero registrarme como cliente
            </button>
          </div>
        </div>

      </div>

      {showRegister && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-2xl bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-950 text-blue-300 flex items-center justify-center">
                  <CurrentStepIcon className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">Registro de cliente</h2>
                  <p className="text-xs text-gray-500">{currentRegisterStep.label}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeRegister}
                className="p-1.5 text-gray-500 hover:text-gray-300 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 pt-5">
              <div className="grid grid-cols-3 gap-2">
                {REGISTER_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isActive = index === registerStep;
                  const isDone = index < registerStep;
                  return (
                    <div
                      key={step.id}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                        isActive
                          ? 'border-blue-700 bg-blue-950 text-blue-200'
                          : isDone
                          ? 'border-emerald-800 bg-emerald-950 text-emerald-300'
                          : 'border-gray-700 bg-gray-900 text-gray-500'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" /> : <StepIcon className="w-4 h-4 flex-shrink-0" />}
                      <span className="text-xs font-semibold truncate">{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="p-6 space-y-5">
              {registerStep === 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de la empresa *</label>
                    <input
                      value={registerForm.companyName}
                      onChange={e => updateRegisterField('companyName', e.target.value)}
                      placeholder="Ferretería o empresa cliente"
                      className="w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">NIT *</label>
                    <input
                      value={registerForm.nit}
                      onChange={e => updateRegisterField('nit', e.target.value)}
                      placeholder="900.000.000-0"
                      className="w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Teléfono *</label>
                    <input
                      value={registerForm.companyPhone}
                      onChange={e => updateRegisterField('companyPhone', e.target.value)}
                      placeholder="300-000-0000"
                      className="w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Correo de la empresa *</label>
                    <input
                      type="email"
                      value={registerForm.companyEmail}
                      onChange={e => updateRegisterField('companyEmail', e.target.value)}
                      placeholder="compras@empresa.com"
                      className="w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {registerStep === 1 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nombre del usuario *</label>
                    <input
                      value={registerForm.userName}
                      onChange={e => updateRegisterField('userName', e.target.value)}
                      placeholder="Nombre y apellido"
                      className="w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Correo de acceso *</label>
                    <input
                      type="email"
                      value={registerForm.userEmail}
                      onChange={e => updateRegisterField('userEmail', e.target.value)}
                      placeholder="usuario@empresa.com"
                      className="w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Contraseña *</label>
                    <div className="relative">
                      <input
                        type={showRegisterPassword ? 'text' : 'password'}
                        value={registerForm.password}
                        onChange={e => updateRegisterField('password', e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm pl-3 pr-10 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegisterPassword(value => !value)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Confirmar contraseña *</label>
                    <input
                      type={showRegisterPassword ? 'text' : 'password'}
                      value={registerForm.confirmPassword}
                      onChange={e => updateRegisterField('confirmPassword', e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {registerStep === 2 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-300 mb-1">Nombre de la sucursal *</label>
                    <input
                      value={registerForm.sucursalName}
                      onChange={e => updateRegisterField('sucursalName', e.target.value)}
                      placeholder="Principal"
                      className="w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Ciudad *</label>
                    <input
                      value={registerForm.city}
                      onChange={e => updateRegisterField('city', e.target.value)}
                      placeholder="Bogotá"
                      className="w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Dirección *</label>
                    <input
                      value={registerForm.address}
                      onChange={e => updateRegisterField('address', e.target.value)}
                      placeholder="Cra 10 # 5-23"
                      className="w-full bg-gray-700 border border-gray-600 text-gray-100 placeholder-gray-500 rounded-lg text-sm px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}

              {registerError && (
                <div className="bg-red-950 border border-red-800 text-red-300 text-sm px-4 py-3 rounded-lg">
                  {registerError}
                </div>
              )}

              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => registerStep === 0 ? closeRegister() : setRegisterStep(step => step - 1)}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-600 text-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-700 transition"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {registerStep === 0 ? 'Cancelar' : 'Atrás'}
                </button>
                {registerStep < REGISTER_STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
                  >
                    Continuar
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Crear cuenta
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {welcomeUserName && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
          <div className="w-full max-w-md bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-emerald-950 text-emerald-300 flex items-center justify-center mx-auto mb-5 border border-emerald-800">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-gray-100 mb-2">Tu cuenta ha sido creada, te damos la bienvenida</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Hola {welcomeUserName}. En esta plataforma podrás solicitar tus cotizaciones de manera autónoma antes de que tu ruta inicie por parte de DAVAL, revisar tu historial y dejar registrada la información de tu empresa y sucursales para agilizar la atención comercial.
            </p>
            <button
              type="button"
              onClick={handleWelcomeContinue}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-lg transition"
            >
              <ClipboardList className="w-4 h-4" />
              Empezar a solicitar cotizaciones
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
