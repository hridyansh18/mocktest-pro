import { useEffect, useState } from 'react';
import {
  Search,
  Copy,
  Trash2,
  ExternalLink,
  KeyRound,
} from 'lucide-react';

import api from '../../services/api';

export default function Tests() {
  const [tests, setTests] = useState([]);
  const [q, setQ] = useState('');

  const load = () =>
    api
      .get('/admin/tests', {
        params: {
          search: q,
          limit: 50,
        },
      })
      .then((r) => setTests(r.data.data.tests || []));

  useEffect(() => {
    load();
  }, []);

  const remove = async (id) => {
    if (confirm('Delete this test permanently?')) {
      await api.delete(`/admin/tests/${id}`);
      load();
    }
  };

  const copy = async (value) => {
    await navigator.clipboard.writeText(value);
  };

  const copyStudentLink = async (testCode) => {
    const link = `${window.location.origin}/test/${testCode}`;
    await navigator.clipboard.writeText(link);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Manage Tests</h1>

      <p className="mt-2 text-sm text-slate-400">
        View and manage all examination tests.
      </p>

      <div className="glass mt-6 rounded-2xl p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="relative max-w-md"
        >
          <Search
            className="absolute left-3 top-3 text-slate-500"
            size={18}
          />

          <input
            className="field pl-10"
            placeholder="Search tests..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </form>
      </div>

      <div className="mt-5 grid gap-4">
        {tests.map((t) => (
          <article
            key={t.id}
            className="glass rounded-2xl p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="font-semibold">{t.title}</h2>

                  <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[10px] uppercase text-violet-400">
                    {t.status}
                  </span>
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  {t.duration_minutes} min ·{' '}
                  {t.category?.replaceAll('_', ' ')}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-white/[0.035] p-4">
                    <p className="text-xs text-slate-500">
                      Test Code
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                      <p className="font-mono font-semibold text-blue-400">
                        {t.test_code_id}
                      </p>

                      <button
                        title="Copy Test Code"
                        onClick={() => copy(t.test_code_id)}
                        className="text-slate-400 hover:text-white"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white/[0.035] p-4">
                    <p className="flex items-center gap-2 text-xs text-slate-500">
                      <KeyRound size={14} />
                      Access Code
                    </p>

                    <div className="mt-2 flex items-center gap-3">
                      <p className="font-mono text-lg font-bold tracking-widest text-amber-400">
                        {t.access_code || 'Not Required'}
                      </p>

                      {t.access_code && (
                        <button
                          title="Copy Access Code"
                          onClick={() => copy(t.access_code)}
                          className="text-slate-400 hover:text-white"
                        >
                          <Copy size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  title="Copy Student Link"
                  onClick={() =>
                    copyStudentLink(t.test_code_id)
                  }
                  className="glass rounded-xl p-2.5 text-blue-400 hover:text-white"
                >
                  <ExternalLink size={17} />
                </button>

                <button
                  title="Delete Test"
                  onClick={() => remove(t.id)}
                  className="rounded-xl bg-rose-500/10 p-2.5 text-rose-400"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          </article>
        ))}

        {!tests.length && (
          <div className="glass rounded-2xl py-20 text-center text-slate-500">
            No matching tests found.
          </div>
        )}
      </div>
    </div>
  );
}