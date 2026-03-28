import { create } from "zustand";
import { supabase } from "../config/supabase";

export const useDataStore = create((set, get) => ({
  // Cache
  subjects: [],
  teachers: [],
  students: [],
  timetable: {},
  periods: [],
  notifications: [],
  attendance: {},
  dashboardStats: null,

  // Timetable cache with TTL
  timetableCache: {},
  TIMETABLE_TTL: 5 * 60 * 1000, // 5 minutes

  fetchSubjects: async (year, semester, branch = "AI") => {
    const { data, error } = await supabase
      .from("subjects")
      .select("id, name, code, teacher_id")
      .eq("year", year)
      .eq("semester", semester)
      .eq("branch", branch)
      .order("name");
    if (!error) set({ subjects: data || [] });
    return { data, error };
  },

  fetchTeachers: async () => {
    const { data, error } = await supabase
      .from("authorized_teachers")
      .select("id, name, email, mobile_number, authorized, last_login, created_at")
      .order("created_at", { ascending: false });
    if (!error) set({ teachers: data || [] });
    return { data, error };
  },

  fetchStudents: async (year, semester, branch, section) => {
    let query = supabase
      .from("students")
      .select(
        "id, uid, name, roll_number, branch, year, semester, section, face_image_url, student_mobile, father_name, father_mobile, father_occupation, mother_name, mother_mobile, mother_occupation, profile_completed"
      )
      .order("roll_number");
    if (year) query = query.eq("year", year);
    if (semester) query = query.eq("semester", semester);
    if (branch) query = query.eq("branch", branch);
    if (section && section !== "None") query = query.eq("section", section);
    const { data, error } = await query;
    if (!error) set({ students: data || [] });
    return { data, error };
  },

  fetchTimetable: async (year, semester, branch, section) => {
    const cacheKey = `${year}-${semester}-${branch}-${section}`;
    const cached = get().timetableCache[cacheKey];
    if (cached && Date.now() - cached.ts < get().TIMETABLE_TTL) {
      return { data: cached.data, error: null };
    }

    const { data, error } = await supabase
      .from("timetable")
      .select("*, subject:subject_id(id, name, code), teacher:teacher_id(id, name)")
      .eq("year", year)
      .eq("semester", semester)
      .eq("branch", branch)
      .eq("section", section)
      .order("day")
      .order("period");

    if (!error) {
      set((state) => ({
        timetableCache: {
          ...state.timetableCache,
          [cacheKey]: { data, ts: Date.now() },
        },
      }));
    }
    return { data, error };
  },

  fetchPeriods: async (year, semester, branch, section) => {
    const { data, error } = await supabase
      .from("periods")
      .select("*")
      .eq("branch", branch)
      .or(`year.eq.${year},year.is.null`)
      .order("order_index");
    if (!error) set({ periods: data || [] });
    return { data, error };
  },

  fetchAttendance: async (date, filters = {}) => {
    let query = supabase
      .from("attendance")
      .select(
        "*, student:student_id(name, roll_number, section, year, branch, face_image_url)"
      )
      .eq("date", date);
    if (filters.subjectId) query = query.eq("subject_id", filters.subjectId);
    if (filters.studentId) query = query.eq("student_id", filters.studentId);
    const { data, error } = await query;
    return { data, error };
  },

  fetchNotifications: async (userId, role) => {
    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (role === "student") {
      query = query.or(
        `target_user_id.eq.${userId},target_role.eq.student,target_role.eq.all`
      );
    } else if (role === "teacher") {
      query = query.or(
        `target_user_id.eq.${userId},target_role.eq.teacher,target_role.eq.all`
      );
    }
    const { data, error } = await query;
    if (!error) set({ notifications: data || [] });
    return { data, error };
  },

  clearTimetableCache: () => set({ timetableCache: {} }),
}));
