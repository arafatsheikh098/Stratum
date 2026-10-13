import React, { useState } from 'react';
import { Layers, ShieldCheck, Briefcase, Code, Eye, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthView() {
  const { login, register, demoLogin } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState('DEVELOPER');
  const [title, setTitle] = useState('');

  const handleDemoClick = async (roleType) => {
    try {
      setLoading(true);
      setError('');
      await demoLogin(roleType);
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        if (password !== passwordConfirm) {
          throw new Error('Passwords do not match');
        }
        await register({
          email,
          username: email.split('@')[0],
          first_name: firstName,
          last_name: lastName,
          role,
          title,
          password,
          password_confirm: passwordConfirm,
        });
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'radial-gradient(ellipse at top, #1E1B4B 0%, #0B0F17 70%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        color: '#F8FAFC'
      }}
    >
      {/* Brand Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 25px rgba(99, 102, 241, 0.4)'
            }}
          >
            <Layers size={24} color="#FFF" />
          </div>
          <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.03em' }}>Stratum</span>
        </div>
        <p style={{ color: '#94A3B8', fontSize: '0.9375rem', maxWidth: '480px' }}>
          Full-Stack Enterprise Project Management & Sprint Tracking SaaS Platform
        </p>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          display: 'grid',
          gridTemplateColumns: '1.2fr 1fr',
          gap: '24px',
          background: 'rgba(20, 30, 51, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden'
        }}
      >
        {/* Left Column: 1-Click Demo Evaluation Profiles */}
        <div
          style={{
            padding: '32px',
            borderRight: '1px solid var(--border-subtle)',
            background: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', padding: '3px 8px', borderRadius: 'var(--radius-full)', background: 'rgba(99, 102, 241, 0.2)', color: '#818CF8', fontSize: '0.6875rem', fontWeight: 800, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: '8px' }}>
              Instant Test Drive
            </div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '6px' }}>
              Select a Demo Persona
            </h2>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8', marginBottom: '20px' }}>
              Explore role-based authorization immediately without manual credentials:
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Admin Persona */}
              <button
                type="button"
                className="persona-btn"
                onClick={() => handleDemoClick('ADMIN')}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(99, 102, 241, 0.12)',
                  border: '1px solid rgba(99, 102, 241, 0.3)',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#6366F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheck size={18} color="#FFF" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#FFF' }}>Alex Rivera (Admin)</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>VP of Engineering • Full CRUD, settings, billing</div>
                </div>
                <ArrowRight size={15} color="#818CF8" />
              </button>

              {/* PM Persona */}
              <button
                type="button"
                className="persona-btn"
                onClick={() => handleDemoClick('PROJECT_MANAGER')}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(236, 72, 153, 0.12)',
                  border: '1px solid rgba(236, 72, 153, 0.3)',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#EC4899', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Briefcase size={18} color="#FFF" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#FFF' }}>Sarah Chen (PM)</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Technical PM • Sprint planning, kanban reorder</div>
                </div>
                <ArrowRight size={15} color="#F472B6" />
              </button>

              {/* Developer Persona */}
              <button
                type="button"
                className="persona-btn"
                onClick={() => handleDemoClick('DEVELOPER')}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.12)',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Code size={18} color="#FFF" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#FFF' }}>David Kim (Developer)</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Senior Engineer • Issue triage, checklists, comments</div>
                </div>
                <ArrowRight size={15} color="#34D399" />
              </button>

              {/* Viewer Persona */}
              <button
                type="button"
                className="persona-btn"
                onClick={() => handleDemoClick('VIEWER')}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(245, 158, 11, 0.12)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Eye size={18} color="#FFF" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#FFF' }}>Marcus Vance (Viewer)</div>
                  <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Client / QA • Read-Only permissions guard</div>
                </div>
                <ArrowRight size={15} color="#FBBF24" />
              </button>
            </div>
          </div>

          <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '16px' }}>
            Password for all demo accounts is: <code>Password123!</code>
          </div>
        </div>

        {/* Right Column: Custom Login / Register Form */}
        <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>
              {isRegister ? 'Create Stratum Account' : 'Sign In With Credentials'}
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#94A3B8' }}>
              {isRegister ? 'Start orchestrating your agile sprints' : 'Enter your email & password to continue'}
            </p>
          </div>

          {error && (
            <div style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 'var(--radius-md)', color: '#F87171', fontSize: '0.8125rem', marginBottom: '14px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {isRegister && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>First Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Jane"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Last Name</label>
                    <input
                      type="text"
                      required
                      placeholder="Doe"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      style={{ width: '100%', marginTop: '4px' }}
                    >
                      <option value="ADMIN">Admin</option>
                      <option value="PROJECT_MANAGER">Project Manager</option>
                      <option value="DEVELOPER">Software Engineer</option>
                      <option value="VIEWER">Viewer</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Job Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Lead Architect"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{ width: '100%', marginTop: '4px' }}
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Email Address</label>
              <input
                type="email"
                required
                placeholder="alex.techlead@stratum.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', marginTop: '4px' }}
              />
            </div>

            {isRegister && (
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>Confirm Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  style={{ width: '100%', marginTop: '4px' }}
                />
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '8px', padding: '10px' }}
            >
              {isRegister ? <UserPlus size={16} /> : <LogIn size={16} />}
              <span>{loading ? 'Authenticating...' : (isRegister ? 'Sign Up' : 'Sign In')}</span>
            </button>
          </form>

          <div style={{ marginTop: '16px', textAlign: 'center', fontSize: '0.8125rem', color: '#94A3B8' }}>
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsRegister(!isRegister); setError(''); }}
              style={{ color: '#818CF8', fontWeight: 700, textDecoration: 'underline' }}
            >
              {isRegister ? 'Sign In' : 'Create One'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
