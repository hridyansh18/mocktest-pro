import { useEffect, useState } from 'react';
import {
  Settings as SettingsIcon,
  UserPlus,
  ShieldCheck,
  Power,
  RefreshCw,
  LoaderCircle,
  Crown,
} from 'lucide-react';

import api from '../../services/api';

const initialForm = {
  fullName: '',
  email: '',
  password: '',
  institution: '',
  designation: '',
};

export default function Settings() {
  const [admins, setAdmins] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const set = (key, value) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const loadAdmins = async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/admin/management');

      setAdmins(data.data.admins || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to load administrators'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdmins();
  }, []);

  const createAdmin = async (event) => {
    event.preventDefault();

    setCreating(true);
    setMessage('');
    setError('');

    try {
      await api.post('/admin/management', form);

      setForm(initialForm);

      setMessage(
        'Administrator created successfully.'
      );

      await loadAdmins();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to create administrator'
      );
    } finally {
      setCreating(false);
    }
  };

  const changeStatus = async (admin) => {
    setMessage('');
    setError('');

    try {
      await api.patch(
        `/admin/management/${admin.id}/status`,
        {
          isActive: !admin.is_active,
        }
      );

      setMessage(
        `${admin.full_name} ${
          admin.is_active ? 'disabled' : 'enabled'
        } successfully.`
      );

      await loadAdmins();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Unable to update administrator'
      );
    }
  };

  return (
    <div>
      <div>
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <SettingsIcon className="text-violet-400" />
          Settings
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Super Admin controls and administrator management.
        </p>
      </div>

      {message && (
        <div className="mt-5 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-400">
          {message}
        </div>
      )}

      {error && (
        <div className="mt-5 rounded-xl bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[420px_1fr]">
        <section className="glass rounded-2xl p-5">
          <h2 className="flex items-center gap-2 font-semibold">
            <UserPlus
              size={19}
              className="text-blue-400"
            />
            Create Administrator
          </h2>

          <p className="mt-2 text-xs text-slate-500">
            Only Super Admin can create administrator
            accounts.
          </p>

          <form
            onSubmit={createAdmin}
            className="mt-6 space-y-4"
          >
            <Field label="Full Name">
              <input
                className="field"
                value={form.fullName}
                onChange={(e) =>
                  set('fullName', e.target.value)
                }
                required
              />
            </Field>

            <Field label="Email Address">
              <input
                className="field"
                type="email"
                value={form.email}
                onChange={(e) =>
                  set('email', e.target.value)
                }
                required
              />
            </Field>

            <Field label="Temporary Password">
              <input
                className="field"
                type="password"
                minLength={8}
                value={form.password}
                onChange={(e) =>
                  set('password', e.target.value)
                }
                required
              />
            </Field>

            <Field label="Institution">
              <input
                className="field"
                value={form.institution}
                onChange={(e) =>
                  set('institution', e.target.value)
                }
              />
            </Field>

            <Field label="Designation">
              <input
                className="field"
                placeholder="Faculty / Professor"
                value={form.designation}
                onChange={(e) =>
                  set('designation', e.target.value)
                }
              />
            </Field>

            <button
              type="submit"
              disabled={creating}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3"
            >
              {creating ? (
                <>
                  <LoaderCircle
                    size={18}
                    className="animate-spin"
                  />
                  Creating...
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  Create Administrator
                </>
              )}
            </button>
          </form>
        </section>

        <section className="glass rounded-2xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="flex items-center gap-2 font-semibold">
                <ShieldCheck
                  size={19}
                  className="text-violet-400"
                />
                Administrator Management
              </h2>

              <p className="mt-2 text-xs text-slate-500">
                Manage administrator platform access.
              </p>
            </div>

            <button
              type="button"
              onClick={loadAdmins}
              className="glass flex items-center gap-2 rounded-xl px-4 py-2 text-sm"
            >
              <RefreshCw
                size={16}
                className={
                  loading ? 'animate-spin' : ''
                }
              />
              Refresh
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {admins.map((admin) => (
              <article
                key={admin.id}
                className="rounded-2xl bg-white/[.035] p-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">
                        {admin.full_name}
                      </h3>

                      {admin.role === 'super_admin' && (
                        <span className="flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-semibold uppercase text-violet-400">
                          <Crown size={11} />
                          Super Admin
                        </span>
                      )}

                      <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase ${
                          admin.is_active
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {admin.is_active
                          ? 'Active'
                          : 'Disabled'}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {admin.email}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {admin.designation ||
                        'Administrator'}

                      {admin.institution
                        ? ` · ${admin.institution}`
                        : ''}
                    </p>
                  </div>

                  {admin.role !== 'super_admin' && (
                    <button
                      type="button"
                      onClick={() =>
                        changeStatus(admin)
                      }
                      className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
                        admin.is_active
                          ? 'bg-rose-500/10 text-rose-400'
                          : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      <Power size={16} />

                      {admin.is_active
                        ? 'Disable'
                        : 'Enable'}
                    </button>
                  )}
                </div>
              </article>
            ))}

            {loading && (
              <div className="py-16 text-center text-slate-500">
                <LoaderCircle className="mx-auto mb-3 animate-spin" />
                Loading administrators...
              </div>
            )}

            {!loading && !admins.length && (
              <div className="py-16 text-center text-slate-500">
                No administrators found.
              </div>
            )}
          </div>
        </section>
      </div>

      <section className="glass mt-6 rounded-2xl p-6 text-center">
        <ShieldCheck
          className="mx-auto text-violet-400"
          size={32}
        />

        <h2 className="mt-3 text-lg font-bold">
          MockTest Pro
        </h2>

        <p className="mt-2 text-sm text-slate-500">
          Secure Examination & Assessment Platform
        </p>

        <p className="mt-5 text-xs text-slate-600">
          Designed & Developed by{' '}
          <span className="font-semibold text-violet-400">
            Hridyansh Chaudhary
          </span>
        </p>
      </section>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-slate-400">
        {label}
      </span>

      {children}
    </label>
  );
}