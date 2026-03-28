import { create } from "zustand";
import { supabase } from "../config/supabase";

export const useAuthStore = create((set, get) => ({
  user: null,
  session: null,
  role: null,
  teacherId: null,
  loading: true,

  initialize: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        const role = await get().getUserRole(session.user);
        const teacherId =
          role === "teacher"
            ? await get().fetchTeacherId(session.user.email)
            : null;
        set({ session, user: session.user, role, teacherId, loading: false });
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const role = await get().getUserRole(session.user);
        const teacherId =
          role === "teacher"
            ? await get().fetchTeacherId(session.user.email)
            : null;
        set({ session, user: session.user, role, teacherId });
      } else {
        set({ session: null, user: null, role: null, teacherId: null });
      }
    });
  },

  getUserRole: async (user) => {
    const email = (user.email || "").toLowerCase().trim();

    const { data: adminData } = await supabase
      .from("admins")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (adminData) return "admin";

    if (email === "mohammed.shohel9@gmail.com") return "verifier";
    const { data: vData } = await supabase
      .from("verifiers")
      .select("id")
      .eq("email", email)
      .maybeSingle();
    if (vData) return "verifier";

    const { data: tData } = await supabase
      .from("authorized_teachers")
      .select("id, authorized")
      .eq("email", email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (tData) return "teacher";

    return "student";
  },

  fetchTeacherId: async (email) => {
    const { data } = await supabase
      .from("authorized_teachers")
      .select("id")
      .eq("email", email.toLowerCase().trim())
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data?.id || null;
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, role: null, teacherId: null });
  },
}));
