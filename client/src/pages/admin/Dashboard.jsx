import { useEffect, useMemo, useState } from 'react';
import {
  ClipboardList,
  Radio,
  UsersRound,
  Target,
  Plus,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

import api from '../../services/api';
import StatCard from '../../components/StatCard';

export default function Dashboard() {
  const [tests, setTests] = useState([]);
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);

    try {
      const testResponse = await api.get(
        '/admin/tests?limit=100'
      );

      const testList =
        testResponse.data.data.tests || [];

      setTests(testList);

      const resultData = await Promise.all(
        testList.map(async (test) => {
          try {
            const response = await api.get(
              `/admin/tests/${test.id}/results`
            );

            const rows = response.data.data || [];

            const average = rows.length
              ? rows.reduce(
                  (total, row) =>
                    total +
                    Number(row.percentage || 0),
                  0
                ) / rows.length
              : 0;

            return {
              id: test.id,
              title: test.title,
              testCode: test.test_code_id,
              average: Number(average.toFixed(1)),
              attempts: rows.length,
            };
          } catch (error) {
            console.error(
              `Result load failed: ${test.title}`,
              error
            );

            return {
              id: test.id,
              title: test.title,
              testCode: test.test_code_id,
              average: 0,
              attempts: 0,
            };
          }
        })
      );

      setPerformance(resultData);
    } catch (error) {
      console.error('Dashboard Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const stats = useMemo(() => {
    const totalAttempts = performance.reduce(
      (total, item) => total + item.attempts,
      0
    );

    const scoredTests = performance.filter(
      (item) => item.attempts > 0
    );

    const averageScore = scoredTests.length
      ? scoredTests.reduce(
          (total, item) => total + item.average,
          0
        ) / scoredTests.length
      : 0;

    return {
      total: tests.length,

      active: tests.filter(
        (test) => test.status === 'active'
      ).length,

      attempts: totalAttempts,

      average: averageScore.toFixed(1),
    };
  }, [tests, performance]);

  const chart = performance
    .filter((item) => item.attempts > 0)
    .slice(-7)
    .map((item) => ({
      name:
        item.title.length > 12
          ? `${item.title.slice(0, 12)}...`
          : item.title,

      score: item.average,
      attempts: item.attempts,
      fullName: item.title,
    }));

  return (
    <div>
      <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold md:text-3xl">
            Dashboard Overview
          </h1>

          <p className="mt-2 text-sm text-slate-400">
            Monitor tests and student performance.
          </p>
        </div>

        <Link
          to="/admin/create-test"
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Create Test
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Tests"
          value={loading ? '—' : stats.total}
          Icon={ClipboardList}
          detail="All tests in workspace"
        />

        <StatCard
          title="Active Tests"
          value={loading ? '—' : stats.active}
          Icon={Radio}
          detail="Currently available"
        />

        <StatCard
          title="Total Attempts"
          value={loading ? '—' : stats.attempts}
          Icon={UsersRound}
          detail="Submitted attempts"
        />

        <StatCard
          title="Average Score"
          value={
            loading ? '—' : `${stats.average}%`
          }
          Icon={Target}
          detail="Actual student performance"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="glass rounded-2xl p-5">
          <h2 className="font-semibold">
            Performance Trend
          </h2>

          <p className="mb-5 mt-1 text-xs text-slate-500">
            Recent test average percentages
          </p>

          <div className="h-72">
            {chart.length ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart data={chart}>
                  <XAxis
                    dataKey="name"
                    stroke="#64748b"
                    fontSize={11}
                  />

                  <YAxis
                    stroke="#64748b"
                    domain={[0, 100]}
                    fontSize={11}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${value}%`,
                      'Average Score',
                    ]}
                    labelFormatter={(_, payload) =>
                      payload?.[0]?.payload?.fullName ||
                      ''
                    }
                    contentStyle={{
                      background: '#0d1428',
                      border: '1px solid #334155',
                      borderRadius: 12,
                    }}
                  />

                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke="#6366f1"
                    fill="#6366f1"
                    fillOpacity={0.15}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-center text-sm text-slate-500">
                <div>
                  <Target className="mx-auto mb-3" />

                  <p>
                    No performance data available.
                  </p>

                  <p className="mt-1 text-xs">
                    Submitted student results will appear
                    here.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">
              Recent Tests
            </h2>

            <Link
              to="/admin/tests"
              className="text-xs text-blue-400"
            >
              View all
            </Link>
          </div>

          <div className="mt-4 space-y-3">
            {tests.slice(0, 5).map((test) => (
              <div
                key={test.id}
                className="rounded-xl bg-white/[.035] p-4"
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      {test.title}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {test.test_code_id}
                    </p>
                  </div>

                  <span className="h-fit rounded-full bg-blue-500/10 px-2 py-1 text-[10px] uppercase text-blue-400">
                    {test.status}
                  </span>
                </div>
              </div>
            ))}

            {!loading && !tests.length && (
              <p className="py-12 text-center text-sm text-slate-500">
                No tests yet. Create your first test.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}