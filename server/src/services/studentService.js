import { query } from '../config/db.js';

export const listStudents = async (
  adminId,
  { search = '', limit = 100 }
) => {
  const searchValue = `%${search}%`;

  const result = await query(
    `
    SELECT
      s.id,
      s.full_name,
      s.enrollment_number,
      s.email,
      s.college_domain,
      s.created_at,

      COUNT(ta.id)::int AS total_attempts,

      COALESCE(
        ROUND(AVG(ta.percentage), 2),
        0
      ) AS average_percentage,

      COUNT(ta.id)
        FILTER (WHERE ta.passed = true)::int
        AS passed_count,

      COUNT(ta.id)
        FILTER (WHERE ta.passed = false)::int
        AS failed_count,

      COALESCE(
        SUM(ta.violation_count),
        0
      )::int AS total_violations,

      MAX(ta.submitted_at) AS last_attempt

    FROM students s

    INNER JOIN test_attempts ta
      ON ta.student_id = s.id

    INNER JOIN tests t
      ON t.id = ta.test_id

    WHERE
  t.created_by = $1

  AND (
    s.full_name ILIKE $2
    OR s.enrollment_number ILIKE $2
    OR s.email ILIKE $2
  )

    GROUP BY
      s.id,
      s.full_name,
      s.enrollment_number,
      s.email,
      s.college_domain,
      s.created_at

    ORDER BY MAX(ta.created_at) DESC

    LIMIT $3
    `,
    [adminId, searchValue, limit]
  );

  return result.rows;
};

export default {
  listStudents,
};