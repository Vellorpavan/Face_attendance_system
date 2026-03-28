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
import { formatDate, getDayOfWeek, timeAgo } from "../../utils/helpers";

export default function TeacherDashboard({ navigation }) {
  const { user, teacherId, signOut } = useAuthStore();
  const [teacher, setTeacher] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [studentCount, setStudentCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const today = new Date();
      const day = getDayOfWeek(today);
      const dateStr = formatDate(today);

      // Get teacher info
      let tid = teacherId;
      if (!tid) {
        const { data: tData } = await supabase
          .from("authorized_teachers")
          .select("id, name")
          .eq("email", user?.email?.toLowerCase().trim())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        tid = tData?.id;
        setTeacher(tData);
      } else {
        const { data: tData } = await supabase
          .from("authorized_teachers")
          .select("id, name")
          .eq("id", tid)
          .maybeSingle();
        setTeacher(tData);
      }

      if (!tid) {
        setLoading(false);
        return;
      }

      const [assignRes, schedRes, countRes, attRes] = await Promise.all([
        supabase
          .from("teacher_subject_assignments")
          .select("id, section, subject:subject_id(id, name, year, semester, branch, code)")
          .eq("teacher_id", tid),
        supabase
          .from("timetable")
          .select("*, subject:subject_id(id, name, code)")
          .eq("teacher_id", tid)
          .eq("day", day)
          .order("period"),
        supabase.from("students").select("id", { count: "exact", head: true }),
        supabase
          .from("attendance")
          .select("subject_id, period, status")
          .eq("date", dateStr)
          .eq("marked_by", tid),
      ]);

      setAssignments(assignRes.data || []);
      const schedule = (schedRes.data || []).filter((s) => !s.is_lunch);
      setTodaySchedule(schedule);
      setStudentCount(countRes.count || 0);
    } catch (err) {
      console.error("Teacher dashboard error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, teacherId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAttendance = (slot) => {
    navigation.navigate("MarkAttendance", {
      subjectId: slot.subject_id,
      subjectName: slot.subject?.name || "Unknown",
      subjectCode: slot.subject?.code || "",
      startPeriod: slot.period,
      year: slot.subject?.year || "",
      semester: slot.subject?.semester || "",
      branch: slot.subject?.branch || "",
      section: "",
    });
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
            <Text style={styles.greeting}>
              Hello, {teacher?.name || "Teacher"}
            </Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>
          <TouchableOpacity onPress={signOut} style={styles.signOutBtn}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <StatCard label="Subjects" value={assignments.length} color="#1A73E8" />
          <StatCard label="Today's Classes" value={todaySchedule.length} color="#34A853" />
          <StatCard label="Total Students" value={studentCount} color="#FBBC04" />
        </View>

        {/* Quick Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("TeacherTimetable")}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionLabel}>Timetable</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("TeacherLeave")}
          >
            <Text style={styles.actionIcon}>📝</Text>
            <Text style={styles.actionLabel}>Leave</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate("StudentNotifications")}
          >
            <Text style={styles.actionIcon}>🔔</Text>
            <Text style={styles.actionLabel}>Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Today's Schedule */}
        <Text style={styles.sectionTitle}>Today's Schedule</Text>
        {todaySchedule.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No classes scheduled today</Text>
          </View>
        ) : (
          todaySchedule.map((slot) => (
            <View key={`${slot.day}-${slot.period}`} style={styles.scheduleCard}>
              <View style={styles.scheduleLeft}>
                <Text style={styles.periodLabel}>{slot.period}</Text>
                <Text style={styles.subjectName}>
                  {slot.subject?.name || "Unknown"}
                </Text>
                <Text style={styles.subjectCode}>
                  {slot.subject?.code || ""}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.attendBtn}
                onPress={() => openAttendance(slot)}
              >
                <Text style={styles.attendBtnText}>Take Attendance</Text>
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Assigned Subjects */}
        <Text style={styles.sectionTitle}>Assigned Subjects</Text>
        {assignments.map((a) => (
          <View key={a.id} style={styles.subjectCard}>
            <Text style={styles.subjectCardName}>
              {a.subject?.name || "Unknown"}
            </Text>
            <Text style={styles.subjectCardMeta}>
              {a.subject?.code} · Year {a.subject?.year} Sem{" "}
              {a.subject?.semester} · Sec {a.section}
            </Text>
          </View>
        ))}
        {assignments.length === 0 && (
          <Text style={styles.emptySubtext}>No subjects assigned yet</Text>
        )}
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
    padding: 14,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: { fontSize: 22, fontWeight: "800" },
  statLabel: { fontSize: 11, color: "#6B7280", marginTop: 4 },
  actionRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  actionBtn: {
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
  actionIcon: { fontSize: 24, marginBottom: 6 },
  actionLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 10,
  },
  scheduleCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleLeft: { flex: 1 },
  periodLabel: { fontSize: 11, fontWeight: "700", color: "#1A73E8" },
  subjectName: { fontSize: 15, fontWeight: "700", color: "#1A1A2E", marginTop: 2 },
  subjectCode: { fontSize: 12, color: "#6B7280", marginTop: 1 },
  attendBtn: {
    backgroundColor: "#34A853",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  attendBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  emptyCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginBottom: 16,
  },
  emptyText: { color: "#9CA3AF", fontSize: 14 },
  emptySubtext: { color: "#9CA3AF", fontSize: 13, marginBottom: 16 },
  subjectCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  subjectCardName: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
  subjectCardMeta: { fontSize: 11, color: "#6B7280", marginTop: 2 },
});
