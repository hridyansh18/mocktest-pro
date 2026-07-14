import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ShieldCheck,
  Shuffle,
  Eye,
  LoaderCircle,
} from 'lucide-react';

import api from '../../services/api';

const initial = {
  title: '',
  description: '',
  subject: '',
  category: 'quantitative_aptitude',
  durationMinutes: 30,
  marksPerQuestion: 1,
  negativeMarking: false,
  negativeMarksValue: 0,
  startAt: '',
  expiresAt: '',
  maxAttempts: 1,
  passingPercentage: 40,
  instructions: '',
  visibility: 'private',
  requireTestCode: true,
  restrictToAllowedList: false,
  collegeEmailDomain: '',
  maxStudentLimit: '',
  shuffleQuestions: true,
  shuffleOptions: true,
  resultVisibility: 'after_expiry',
  showQuestionReview: false,
  leaderboardEnabled: true,
  status: 'draft',
};

const categories = [
  'quantitative_aptitude',
  'logical_reasoning',
  'verbal_ability',
  'technical_mcq',
  'programming',
  'dbms',
  'dsa',
  'computer_networks',
  'operating_systems',
  'custom',
];

export default function CreateTest() {
  const [f, setF] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const nav = useNavigate();

  const set = (key, value) => {
    setF((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const submit = async (e) => {
    e.preventDefault();

    setBusy(true);
    setError('');

    try {
      const payload = {
        ...f,

        startAt: new Date(f.startAt).toISOString(),

        expiresAt: new Date(f.expiresAt).toISOString(),

        maxStudentLimit: f.maxStudentLimit
          ? Number(f.maxStudentLimit)
          : undefined,

        collegeEmailDomain:
          f.collegeEmailDomain || undefined,
      };

      const { data } = await api.post(
        '/admin/tests',
        payload
      );

      const test = data.data.test;

      const message = `
Test Created Successfully 🎉

Test Code: ${test.test_code_id}

Access Code: ${
        test.access_code || 'Not Required'
      }

Save this Access Code and share it only with students.
`;

      alert(message);

      nav(`/admin/questions?test=${test.id}`);
    } catch (err) {
      console.error('Create Test Error:', err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.errors?.[0]?.msg ||
          'Unable to create test'
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit}>
      <div className="mb-7">
        <h1 className="text-3xl font-bold">
          Create Test
        </h1>

        <p className="mt-2 text-sm text-slate-400">
          Configure a secure examination and add
          questions next.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-rose-500/10 p-4 text-sm text-rose-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">

          <Section title="Test Details">
            <div className="grid gap-4 sm:grid-cols-2">

              <Field label="Test title">
                <input
                  className="field"
                  value={f.title}
                  onChange={(e) =>
                    set('title', e.target.value)
                  }
                  required
                />
              </Field>

              <Field label="Subject">
                <input
                  className="field"
                  value={f.subject}
                  onChange={(e) =>
                    set('subject', e.target.value)
                  }
                />
              </Field>

              <Field label="Category">
                <select
                  className="field"
                  value={f.category}
                  onChange={(e) =>
                    set('category', e.target.value)
                  }
                >
                  {categories.map((category) => (
                    <option
                      key={category}
                      value={category}
                    >
                      {category.replaceAll('_', ' ')}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Status">
                <select
                  className="field"
                  value={f.status}
                  onChange={(e) =>
                    set('status', e.target.value)
                  }
                >
                  <option value="draft">
                    Draft
                  </option>

                  <option value="scheduled">
                    Scheduled
                  </option>

                  <option value="active">
                    Active
                  </option>
                </select>
              </Field>

            </div>

            <Field label="Description">
              <textarea
                className="field min-h-24"
                value={f.description}
                onChange={(e) =>
                  set('description', e.target.value)
                }
              />
            </Field>
          </Section>

          <Section
            title="Schedule & Scoring"
            Icon={CalendarDays}
          >
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              <Field label="Duration (minutes)">
                <input
                  className="field"
                  type="number"
                  min="1"
                  value={f.durationMinutes}
                  onChange={(e) =>
                    set(
                      'durationMinutes',
                      Number(e.target.value)
                    )
                  }
                />
              </Field>

              <Field label="Marks / question">
                <input
                  className="field"
                  type="number"
                  min="0"
                  step=".25"
                  value={f.marksPerQuestion}
                  onChange={(e) =>
                    set(
                      'marksPerQuestion',
                      Number(e.target.value)
                    )
                  }
                />
              </Field>

              <Field label="Passing %">
                <input
                  className="field"
                  type="number"
                  min="0"
                  max="100"
                  value={f.passingPercentage}
                  onChange={(e) =>
                    set(
                      'passingPercentage',
                      Number(e.target.value)
                    )
                  }
                />
              </Field>

              <Field label="Start date & time">
                <input
                  className="field"
                  type="datetime-local"
                  value={f.startAt}
                  onChange={(e) =>
                    set('startAt', e.target.value)
                  }
                  required
                />
              </Field>

              <Field label="Expiry date & time">
                <input
                  className="field"
                  type="datetime-local"
                  value={f.expiresAt}
                  onChange={(e) =>
                    set('expiresAt', e.target.value)
                  }
                  required
                />
              </Field>

              <Field label="Maximum attempts">
                <input
                  className="field"
                  type="number"
                  min="1"
                  value={f.maxAttempts}
                  onChange={(e) =>
                    set(
                      'maxAttempts',
                      Number(e.target.value)
                    )
                  }
                />
              </Field>

            </div>

            <Toggle
              label="Enable negative marking"
              checked={f.negativeMarking}
              onChange={(value) =>
                set('negativeMarking', value)
              }
            />

            {f.negativeMarking && (
              <Field label="Negative marks / wrong answer">
                <input
                  className="field max-w-xs"
                  type="number"
                  min="0"
                  step=".25"
                  value={f.negativeMarksValue}
                  onChange={(e) =>
                    set(
                      'negativeMarksValue',
                      Number(e.target.value)
                    )
                  }
                />
              </Field>
            )}

          </Section>

          <Section title="Instructions">
            <textarea
              className="field min-h-36"
              placeholder="Enter examination rules and instructions..."
              value={f.instructions}
              onChange={(e) =>
                set('instructions', e.target.value)
              }
            />
          </Section>

        </div>

        <div className="space-y-6">

          <Section
            title="Access Control"
            Icon={ShieldCheck}
          >
            <Field label="Visibility">
              <select
                className="field"
                value={f.visibility}
                onChange={(e) =>
                  set('visibility', e.target.value)
                }
              >
                <option value="private">
                  Private
                </option>

                <option value="public">
                  Public
                </option>
              </select>
            </Field>

            <Toggle
              label="Require test code"
              checked={f.requireTestCode}
              onChange={(value) =>
                set('requireTestCode', value)
              }
            />

            <Toggle
              label="Allowed students only"
              checked={f.restrictToAllowedList}
              onChange={(value) =>
                set(
                  'restrictToAllowedList',
                  value
                )
              }
            />

            <Field label="College email domain">
              <input
                className="field"
                placeholder="college.edu"
                value={f.collegeEmailDomain}
                onChange={(e) =>
                  set(
                    'collegeEmailDomain',
                    e.target.value
                  )
                }
              />
            </Field>

            <Field label="Maximum students">
              <input
                className="field"
                type="number"
                min="1"
                placeholder="Unlimited"
                value={f.maxStudentLimit}
                onChange={(e) =>
                  set(
                    'maxStudentLimit',
                    e.target.value
                  )
                }
              />
            </Field>

          </Section>

          <Section
            title="Exam Behaviour"
            Icon={Shuffle}
          >
            <Toggle
              label="Shuffle questions"
              checked={f.shuffleQuestions}
              onChange={(value) =>
                set('shuffleQuestions', value)
              }
            />

            <Toggle
              label="Shuffle options"
              checked={f.shuffleOptions}
              onChange={(value) =>
                set('shuffleOptions', value)
              }
            />
          </Section>

          <Section
            title="Result Settings"
            Icon={Eye}
          >
            <Field label="Result visibility">
              <select
                className="field"
                value={f.resultVisibility}
                onChange={(e) =>
                  set(
                    'resultVisibility',
                    e.target.value
                  )
                }
              >
                <option value="immediate">
                  Immediately
                </option>

                <option value="after_expiry">
                  After test expiry
                </option>

                <option value="hidden">
                  Hidden
                </option>
              </select>
            </Field>

            <Toggle
              label="Show question review"
              checked={f.showQuestionReview}
              onChange={(value) =>
                set('showQuestionReview', value)
              }
            />

            <Toggle
              label="Enable leaderboard"
              checked={f.leaderboardEnabled}
              onChange={(value) =>
                set('leaderboardEnabled', value)
              }
            />

          </Section>

          <button
            type="submit"
            disabled={busy}
            className="btn-primary flex w-full items-center justify-center gap-2 py-3"
          >
            {busy ? (
              <>
                <LoaderCircle
                  className="animate-spin"
                  size={19}
                />

                Creating Test...
              </>
            ) : (
              'Create Test & Add Questions'
            )}
          </button>

        </div>
      </div>
    </form>
  );
}

function Section({
  title,
  Icon,
  children,
}) {
  return (
    <section className="glass rounded-2xl p-5">
      <h2 className="mb-5 flex items-center gap-2 font-semibold">
        {Icon && (
          <Icon
            size={18}
            className="text-blue-400"
          />
        )}

        {title}
      </h2>

      <div className="space-y-4">
        {children}
      </div>
    </section>
  );
}

function Field({
  label,
  children,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-medium text-slate-400">
        {label}
      </span>

      {children}
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-xl bg-white/[.035] p-3 text-sm">
      <span>{label}</span>

      <input
        type="checkbox"
        className="h-4 w-4 accent-blue-600"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
      />
    </label>
  );
}