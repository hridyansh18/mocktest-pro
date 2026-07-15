import { useEffect, useMemo, useState } from 'react';
import {
  Search,
  RefreshCw,
  Users,
  FileSpreadsheet,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import api from '../../services/api';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const { data } = await api.get('/admin/students', {
        params: {
          search,
          limit: 500,
        },
      });

      setStudents(data.data.students || []);
    } catch (error) {
      console.error('Student Load Error:', error);
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const average = useMemo(() => {
    if (!students.length) return '0.0';

    const total = students.reduce(
      (sum, student) =>
        sum + Number(student.average_percentage || 0),
      0
    );

    return (total / students.length).toFixed(1);
  }, [students]);

  const totalAttempts = useMemo(
    () =>
      students.reduce(
        (sum, student) =>
          sum + Number(student.total_attempts || 0),
        0
      ),
    [students]
  );

  const exportExcel = () => {
    if (!students.length) {
      alert('No student data available.');
      return;
    }

    const rows = students.map((student, index) => ({
      'S.No': index + 1,
      Student: student.full_name,
      Enrollment: student.enrollment_number,
      Email: student.email,
      'Tests Attempted': student.total_attempts,
      'Average Percentage': `${Number(
        student.average_percentage || 0
      ).toFixed(1)}%`,
      Passed: student.passed_count,
      Failed: student.failed_count,
      Violations: student.total_violations,
      'Last Attempt': student.last_attempt
        ? new Date(student.last_attempt).toLocaleString()
        : '-',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);

    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 25 },
      { wch: 20 },
      { wch: 30 },
      { wch: 18 },
      { wch: 20 },
      { wch: 12 },
      { wch: 12 },
      { wch: 15 },
      { wch: 25 },
    ];

    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      'Students'
    );

    XLSX.writeFile(
      workbook,
      'MockTest-Pro-Students.xlsx'
    );
  };

  return (
    <div>
      <h1 className="text-3xl font-bold">Students</h1>

      <p className="mt-2 text-sm text-slate-400">
        View students and examination performance.
      </p>

      <div className="glass mt-6 flex flex-wrap gap-3 rounded-2xl p-4">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            load();
          }}
          className="relative min-w-[260px] flex-1"
        >
          <Search
            size={18}
            className="absolute left-3 top-3 text-slate-500"
          />

          <input
            className="field pl-10"
            placeholder="Search name, enrollment or email..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />
        </form>

        <button
          type="button"
          onClick={load}
          className="btn-primary flex items-center gap-2"
        >
          <RefreshCw
            size={17}
            className={loading ? 'animate-spin' : ''}
          />
          Refresh
        </button>

        <button
          type="button"
          onClick={exportExcel}
          className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-400"
        >
          <FileSpreadsheet size={18} />
          Export Excel
        </button>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <Card
          label="Total Students"
          value={students.length}
        />

        <Card
          label="Total Attempts"
          value={totalAttempts}
        />

        <Card
          label="Average Performance"
          value={`${average}%`}
        />
      </div>

      <div className="glass mt-5 overflow-x-auto rounded-2xl">
        <table className="w-full min-w-[1050px] text-left text-sm">
          <thead className="border-b border-white/10 text-xs uppercase text-slate-500">
            <tr>
              {[
                'Student',
                'Enrollment',
                'Email',
                'Attempts',
                'Average',
                'Passed',
                'Failed',
                'Violations',
                'Last Attempt',
              ].map((heading) => (
                <th
                  key={heading}
                  className="px-4 py-4"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {students.map((student) => (
              <tr
                key={student.id}
                className="border-b border-white/5"
              >
                <td className="px-4 py-4 font-medium">
                  {student.full_name}
                </td>

                <td className="px-4 py-4 text-slate-400">
                  {student.enrollment_number}
                </td>

                <td className="px-4 py-4 text-slate-400">
                  {student.email}
                </td>

                <td className="px-4 py-4">
                  {student.total_attempts}
                </td>

                <td className="px-4 py-4 font-semibold text-blue-400">
                  {Number(
                    student.average_percentage || 0
                  ).toFixed(1)}
                  %
                </td>

                <td className="px-4 py-4 text-emerald-400">
                  {student.passed_count}
                </td>

                <td className="px-4 py-4 text-rose-400">
                  {student.failed_count}
                </td>

                <td className="px-4 py-4 text-amber-400">
                  {student.total_violations}
                </td>

                <td className="px-4 py-4 text-slate-400">
                  {student.last_attempt
                    ? new Date(
                        student.last_attempt
                      ).toLocaleString()
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && !students.length && (
          <div className="py-16 text-center text-slate-500">
            <Users className="mx-auto mb-3" />
            <p>No students found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ label, value }) {
  return (
    <div className="glass rounded-2xl p-5">
      <p className="text-sm text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold">
        {value}
      </p>
    </div>
  );
}