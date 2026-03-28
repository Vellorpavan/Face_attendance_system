import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../contexts/AuthContext";
import { supabase } from "../../config/supabase";
import { formatDate } from "../../utils/helpers";

const MODULES = [
  { key: "ManageTeachers", label: "Teachers", icon: "👨‍🏫" },
  { key: "TimetableBuilder", label: "Timetable", icon: "📅" },
  { key: "AttendanceViewer", label: "Attendance", icon: "📊" },
  { key: "NotificationHub", label: "Notifications", icon: "🔔" },
  { key: "ManageStudents", label: "Students", icon: "🎓" },
];

export default function AdminDashboard({ navigation }) {
  const { user, signOut } = useAuthStore();
  const [stats, setStats] = useState({ teachers: 0, subjects: 0, students: 0 });
  const [today, setToday] = useState({ present: 0, absent: 0, sessions: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const todayDate = formatDate();

      const [tCnt, sCnt, stCnt, attData] = await Promise.all([
        supabase.from("authorized_teachers").select("id", { count: "exact", head: true }),
        supabase.from("subjects").select("id", { count: "exact", head: true }),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase.from("attendance").select("status, subject_id, period").eq("date", todayDate),
      ]);

      const attRecords = attData.data || [];
      const present = attRecords.filter((r) => r.status === "present").length;
      const absent = attRecords.filter((r) => r.status === "absent").length;
      const sessions = new Set(
        attRecords.map((r) => `${r.subject_id}-${r.period}`)
      ).size;

      setStats({
        teachers: tCnt.count || 0,
        subjects: sCnt.count || 0,
        students: stCnt.count || 0,
      });
      setToday({ present, absent, sessions });
    } catch (err) {
      console.error("Dashboard load error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const channel = supabase
      .channel("admin-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "authorized_teachers" },
        loadData
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.scroll}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, Admin</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Teachers" value={stats.teachers} color="#1A73E8" />
          <StatCard label="Subjects" value={stats.subjects} color="#34A853" />
          <StatCard label="Students" value={stats.students} color="#FBBC04" />
        </View>

        <View style={styles.todayCard}>
          <Text style={styles.sectionTitle}>Today's Activity</Text>
          <View style={styles.todayRow}>
            <TodayPill label="Present" value={today.present} color="#34A853" />
            <TodayPill label="Absent" value={today.absent} color="#EA4335" />
            <TodayPill label="Sessions" value={today.sessions} color="#1A73E8" />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.grid}>
          {MODULES.map((mod) => (
            <TouchableOpacity
              key={mod.key}
              style={styles.moduleCard}
              onPress={() => navigation.navigate(mod.key)}
              activeOpacity={0.7}
            >
              <Text style={styles.moduleIcon}>{mod.icon}</Text>
              <Text style={styles.moduleLabel}>{mod.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, color }) {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function TodayPill({ label, value, color }) {
  return (
    <View style={[styles.todayPill, { backgroundColor: color + "15" }]}>
      <Text style={[styles.todayValue, { color }]}>{value}</Text>
      <Text style={[styles.todayLabel, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  scroll: { padding: 16, paddingBottom: 30 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "800", color: "#1A1A2E" },
  email: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  signOutBtn: {
    backgroundColor: "#FEE2E2",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  signOutText: { color: "#EF4444", fontWeight: "600", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 24, fontWeight: "800" },
  statLabel: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  todayCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  todayRow: { flexDirection: "row", gap: 10 },
  todayPill: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  todayValue: { fontSize: 20, fontWeight: "800" },
  todayLabel: { fontSize: 11, marginTop: 2, fontWeight: "600" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moduleCard: {
    width: "31%",
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  moduleIcon: { fontSize: 28, marginBottom: 8 },
  moduleLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },
});
