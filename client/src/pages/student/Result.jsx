import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import {
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  Medal,
} from 'lucide-react';

import { attempts } from '../../services/attemptApi';

export default function Result() {
  const { attemptId } = useParams();

  const [result, setResult] = useState(null);

  const [leaderboard, setLeaderboard] =
    useState(null);

  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const resultResponse =
          await attempts.result(attemptId);

        setResult(resultResponse.data.data);

        try {
          const leaderboardResponse =
            await attempts.leaderboard(attemptId);

          setLeaderboard(
            leaderboardResponse.data.data
          );
        } catch (leaderboardError) {
          console.error(
            'Leaderboard Error:',
            leaderboardError
          );
        }
      } catch (requestError) {
        setError(
          requestError.response?.data?.message ||
            'Result is not available'
        );
      }
    };

    load();
  }, [attemptId]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center p-4">
        <div className="glass max-w-lg rounded-3xl p-8 text-center">
          <Clock
            className="mx-auto text-amber-400"
            size={44}
          />

          <h1 className="mt-4 text-2xl font-bold">
            Result Pending
          </h1>

          <p className="mt-3 text-slate-400">
            {error}
          </p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="grid min-h-screen place-items-center">
        Calculating secure result...
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-5xl p-4 py-10">
      <div className="glass rounded-3xl p-7 text-center md:p-10">
        {result.passed ? (
          <CheckCircle2
            className="mx-auto text-emerald-400"
            size={56}
          />
        ) : (
          <XCircle
            className="mx-auto text-rose-400"
            size={56}
          />
        )}

        <p className="mt-5 text-sm text-slate-500">
          {result.testName}
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {result.passed
            ? 'Congratulations! You Passed'
            : 'Test Completed'}
        </h1>

        <p className="mt-2 text-slate-400">
          {result.studentName} ·{' '}
          {result.enrollmentNumber}
        </p>

        <div className="my-8">
          <p className="text-6xl font-black">
            {Number(
              result.percentage || 0
            ).toFixed(1)}
            %
          </p>

          <p className="mt-2 text-slate-500">
            {result.score} / {result.totalMarks}{' '}
            marks
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Card
            label="Correct"
            value={result.correct}
            cls="text-emerald-400"
          />

          <Card
            label="Incorrect"
            value={result.incorrect}
            cls="text-rose-400"
          />

          <Card
            label="Unattempted"
            value={result.unattempted}
            cls="text-amber-400"
          />

          <Card
            label="Time Taken"
            value={formatTime(
              result.timeTakenSeconds
            )}
            cls="text-blue-400"
          />
        </div>

        {leaderboard?.enabled && (
          <div className="mt-10 text-left">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="flex items-center gap-2 text-xl font-bold">
                  <Trophy
                    size={22}
                    className="text-amber-400"
                  />

                  Leaderboard
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Top performing students
                </p>
              </div>

              {leaderboard.yourRank && (
                <div className="rounded-2xl bg-violet-500/10 px-5 py-3 text-center">
                  <p className="text-xs text-slate-500">
                    Your Rank
                  </p>

                  <p className="text-2xl font-black text-violet-400">
                    #{leaderboard.yourRank}
                  </p>
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl bg-white/[.025]">
              <table className="w-full min-w-[650px] text-sm">
                <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      Rank
                    </th>

                    <th className="px-4 py-4 text-left">
                      Student
                    </th>

                    <th className="px-4 py-4 text-left">
                      Enrollment
                    </th>

                    <th className="px-4 py-4 text-right">
                      Score
                    </th>

                    <th className="px-4 py-4 text-right">
                      Percentage
                    </th>

                    <th className="px-4 py-4 text-right">
                      Time
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {leaderboard.entries?.map(
                    (entry) => (
                      <tr
                        key={`${entry.rank}-${entry.enrollmentNumber}`}
                        className={`border-b border-white/5 ${
                          entry.isCurrentStudent
                            ? 'bg-violet-500/10'
                            : ''
                        }`}
                      >
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-2">
                            {Number(entry.rank) <=
                              3 && (
                              <Medal
                                size={17}
                                className="text-amber-400"
                              />
                            )}

                            <span className="font-bold">
                              #{entry.rank}
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-4 font-medium">
                          {entry.fullName}

                          {entry.isCurrentStudent && (
                            <span className="ml-2 text-xs text-violet-400">
                              You
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-4 text-slate-400">
                          {entry.enrollmentNumber}
                        </td>

                        <td className="px-4 py-4 text-right">
                          {entry.score}
                        </td>

                        <td className="px-4 py-4 text-right font-semibold text-blue-400">
                          {Number(
                            entry.percentage || 0
                          ).toFixed(1)}
                          %
                        </td>

                        <td className="px-4 py-4 text-right text-slate-400">
                          {formatTime(
                            entry.timeTakenSeconds
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="mt-10 text-xs text-slate-600">
          MockTest Pro · Designed & Developed by{' '}
          <span className="text-violet-400">
            Hridyansh Chaudhary
          </span>
        </p>
      </div>
    </div>
  );
}

function Card({ label, value, cls }) {
  return (
    <div className="rounded-2xl bg-white/[.035] p-4">
      <p className={`text-2xl font-bold ${cls}`}>
        {value}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {label}
      </p>
    </div>
  );
}

function formatTime(seconds) {
  const value = Number(seconds || 0);

  return `${Math.floor(value / 60)}m ${
    value % 60
  }s`;
}