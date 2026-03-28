import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../contexts/AuthContext";
import { supabase } from "../../config/supabase";
import { formatDate, timeAgo } from "../../utils/helpers";

export default function StudentDashboard({ navigation }) {
  const { user, signOut } = useAuthStore();
  const [student, setStudent] = useState(null);
  const [todaySubjects, setTodaySubjects] = useState([]);
  const [recentAttendance, setRecentAttendance] = useState([]);
  const [unreadNotifs, setUnreadNotifs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const today = formatDate();
      const dayIdx = new Date().getDay();
      const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
      const day = days[dayIdx];

      // Get student info
      const { data: studData } = await supabase
        .from("students")
        .select("*")
        .eq("uid", user?.id)
        .maybeSingle();

      setStudent(studData);

      if (!studData) {
        setLoading(false);
        return;
      }

      // Get today's timetable
      const { data: ttData } = await supabase
        .from("timetable")
        .select("*, subject:subject_id(id, name, code)")
        .eq("year", studData.year)
        .eq("semester", studData.semester)
        .eq("branch", studData.branch)
        .eq("section", studData.section)
        .eq("day", day)
        .order("period");

      // Get today's attendance
      const { data: attData } = await supabase
        .from("attendance")
        .select("subject_id, status, period")
        .eq("student_id", studData.id)
        .eq("date", today);

      const attMap = {};
      (attData || []).forEach((r) => {
        attMap[`${r.subject_id}-${r.period}`] = r.status;
      });

      const subjects = (ttData || [])
        .filter((s) => !s.is_lunch && s.subject_id)
        .map((s) => ({
          ...s,
          status: attMap[`${s.subject_id}-${s.period}`] || "pending",
        }));
      setTodaySubjects(subjects);

      // Get last 30 days attendance
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { data: histData } = await supabase
        .from("attendance")
        .select("date, status, subject_id, period, period_count")
        .eq("student_id", studData.id)
        .gte("date", formatDate(thirtyDaysAgo))
        .order("date", { ascending: false });

      setRecentAttendance(histData || []);

      // Get unread notification count
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .or(
          `target_user_id.eq.${user.id},target_role.eq.student,target_role.eq.all`
        )
        .eq("is_read", false);

      setUnreadNotifs(count || 0);
    } catch (err) {
      console.error("Student dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadData();

    // Realtime subscription for attendance updates
    const channel = supabase
      .channel("student-attendance")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "attendance",
        },
        () => loadData()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [loadData]);

  const calcStats = () => {
    const total = recentAttendance.reduce(
      (sum, r) => sum + (r.period_count || 1),
      0
    );
    const present = recentAttendance
      .filter((r) => r.status === "present")
      .reduce((sum, r) => sum + (r.period_count || 1), 0);
    const pct = total > 0 ? Math.round((present / total) * 100) : 0;
    return { total, present, absent: total - present, pct };
  };

  const stats = calcStats();

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  if (!student) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyCenter}>
          <Text style={styles.emptyTitle}>Profile Not Found</Text>
          <Text style={styles.emptyDesc}>
            Your student profile is not set up yet.
          </Text>
          <TouchableOpacity style={styles.signOutBtn} onPress={signOut}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadData();
            }}
          />
        }
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {student.name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.notifBtn}
              onPress={() => navigation.navigate("StudentNotifications")}
            >
              <Text style={styles.notifIcon}>🔔</Text>
              {unreadNotifs > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{unreadNotifs}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
              <Text style={styles.signOutText}>Out</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {(student.name || "S").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{student.name}</Text>
            <Text style={styles.profileMeta}>
              Roll: {student.roll_number}
            </Text>
            <Text style={styles.profileMeta}>
              {student.branch} · Year {student.year} Sem {student.semester} ·
              Sec {student.section}
            </Text>
          </View>
        </View>

        {/* Today's Attendance */}
        <Text style={styles.sectionTitle}>Today's Attendance</Text>
        {todaySubjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No classes today</Text>
          </View>
        ) : (
          todaySubjects.map((s) => (
            <View
              key={`${s.day}-${s.period}`}
              style={[
                styles.todayCard,
                s.status === "present" && styles.cardPresent,
                s.status === "absent" && styles.cardAbsent,
              ]}
            >
              <View style={styles.todayLeft}>
                <Text style={styles.todayPeriod}>{s.period}</Text>
                <Text style={styles.todaySubject}>
                  {s.subject?.name || "Unknown"}
                </Text>
                <Text style={styles.todayCode}>
                  {s.subject?.code || ""}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  s.status === "present" && styles.badgePresent,
                  s.status === "absent" && styles.badgeAbsent,
                  s.status === "pending" && styles.badgePending,
                ]}
              >
                <Text
                  style={[
                    styles.statusText,
                    s.status === "present" && { color: "#34A853" },
                    s.status === "absent" && { color: "#EF4444" },
                    s.status === "pending" && { color: "#9CA3AF" },
                  ]}
                >
                  {s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                </Text>
              </View>
            </View>
          ))
        )}

        {/* Attendance Insights */}
        <Text style={styles.sectionTitle}>Last 30 Days</Text>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#1A73E8" }]}>
              {stats.pct}%
            </Text>
            <Text style={styles.statLabel}>Overall</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#34A853" }]}>
              {stats.present}
            </Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: "#EF4444" }]}>
              {stats.absent}
            </Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate("AttendanceHistory")}
        >
          <Text style={styles.historyBtnText}>View Full History →</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 30 },
  emptyCenter: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  emptyTitle: { fontSize: 20, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: "#6B7280", textAlign: "center", marginBottom: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  greeting: { fontSize: 22, fontWeight: "800", color: "#1A1A2E" },
  email: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  notifBtn: { position: "relative", padding: 4 },
  notifIcon: { fontSize: 22 },
  notifBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#EF4444",
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  notifBadgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  signOutBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  signOutText: { color: "#EF4444", fontWeight: "600", fontSize: 12 },
  profileCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  profileAvatarText: { fontSize: 22, fontWeight: "800", color: "#1A73E8" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 17, fontWeight: "700", color: "#1A1A2E" },
  profileMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 10,
  },
  todayCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  cardPresent: { borderLeftWidth: 3, borderLeftColor: "#34A853" },
  cardAbsent: { borderLeftWidth: 3, borderLeftColor: "#EF4444" },
  todayLeft: { flex: 1 },
  todayPeriod: { fontSize: 11, fontWeight: "700", color: "#1A73E8" },
  todaySubject: { fontSize: 14, fontWeight: "600", color: "#1A1A2E", marginTop: 2 },
  todayCode: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  statusBadge: { paddingVertical: 4, paddingHorizontal: 12, borderRadius: 6 },
  badgePresent: { backgroundColor: "#D1FAE5" },
  badgeAbsent: { backgroundColor: "#FEE2E2" },
  badgePending: { backgroundColor: "#F3F4F6" },
  statusText: { fontSize: 12, fontWeight: "600" },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: { color: "#9CA3AF", fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 4 },
  historyBtn: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  historyBtnText: { color: "#1A73E8", fontWeight: "600", fontSize: 14 },
});
