import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../contexts/AuthContext";
import { supabase } from "../../config/supabase";
import { formatDate, calcPercentage, getGrade } from "../../utils/helpers";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export default function AttendanceHistory({ navigation }) {
  const { user } = useAuthStore();
  const [student, setStudent] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());

  const loadData = useCallback(async () => {
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

    const [subjRes, attRes] = await Promise.all([
      supabase
        .from("subjects")
        .select("id, name, code")
        .eq("year", studData.year)
        .eq("semester", studData.semester)
        .eq("branch", studData.branch),
      supabase
        .from("attendance")
        .select("subject_id, date, status, period, period_count")
        .eq("student_id", studData.id)
        .order("date", { ascending: false }),
    ]);

    if (!subjRes.error) setSubjects(subjRes.data || []);
    if (!attRes.error) setAttendance(attRes.data || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter by selected month
  const filteredAttendance = attendance.filter((r) => {
    const month = new Date(r.date).getMonth();
    return month === selectedMonth;
  });

  // Overall stats
  const totalPeriods = attendance.reduce(
    (sum, r) => sum + (r.period_count || 1),
    0
  );
  const presentPeriods = attendance
    .filter((r) => r.status === "present")
    .reduce((sum, r) => sum + (r.period_count || 1), 0);
  const overallPct = calcPercentage(presentPeriods, totalPeriods);
  const grade = getGrade(overallPct);

  // Per-subject stats
  const subjectStats = subjects.map((subj) => {
    const records = attendance.filter((r) => r.subject_id === subj.id);
    const total = records.reduce((sum, r) => sum + (r.period_count || 1), 0);
    const present = records
      .filter((r) => r.status === "present")
      .reduce((sum, r) => sum + (r.period_count || 1), 0);
    const pct = calcPercentage(present, total);
    return { ...subj, total, present, absent: total - present, pct };
  });

  // Calendar days for selected month
  const year = new Date().getFullYear();
  const daysInMonth = new Date(year, selectedMonth + 1, 0).getDate();
  const firstDay = new Date(year, selectedMonth, 1).getDay();
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarDays.push(d);

  // Day status map
  const dayStatus = {};
  filteredAttendance.forEach((r) => {
    const day = new Date(r.date).getDate();
    if (!dayStatus[day]) dayStatus[day] = { present: 0, absent: 0 };
    if (r.status === "present")
      dayStatus[day].present += r.period_count || 1;
    else dayStatus[day].absent += r.period_count || 1;
  });

  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Attendance History</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Overall Stats */}
        <View style={[styles.overallCard, { borderLeftColor: grade.color }]}>
          <Text style={[styles.overallPct, { color: grade.color }]}>
            {overallPct}%
          </Text>
          <View>
            <Text style={[styles.gradeLabel, { color: grade.color }]}>
              {grade.label}
            </Text>
            <Text style={styles.overallMeta}>
              {presentPeriods} present / {totalPeriods} total periods
            </Text>
          </View>
        </View>

        {/* Month Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.monthScroll}
        >
          {MONTHS.map((m, i) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.monthChip,
                selectedMonth === i && styles.monthChipActive,
              ]}
              onPress={() => setSelectedMonth(i)}
            >
              <Text
                style={[
                  styles.monthText,
                  selectedMonth === i && styles.monthTextActive,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Calendar */}
        <View style={styles.calendarCard}>
          <Text style={styles.calendarTitle}>
            {MONTHS[selectedMonth]} {year}
          </Text>
          <View style={styles.weekRow}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <Text key={i} style={styles.weekDay}>
                {d}
              </Text>
            ))}
          </View>
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, i) => {
              if (day === null)
                return <View key={`e-${i}`} style={styles.calendarCell} />;
              const status = dayStatus[day];
              let bgColor = "#F9FAFB";
              if (status) {
                const p = status.present;
                const a = status.absent;
                if (p > 0 && a === 0) bgColor = "#D1FAE5";
                else if (a > 0 && p === 0) bgColor = "#FEE2E2";
                else if (p > a) bgColor = "#FEF3C7";
                else bgColor = "#FEE2E2";
              }
              return (
                <View
                  key={day}
                  style={[styles.calendarCell, { backgroundColor: bgColor }]}
                >
                  <Text style={styles.dayNum}>{day}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Subject Breakdown */}
        <Text style={styles.sectionTitle}>By Subject</Text>
        {subjectStats.map((s) => {
          const g = getGrade(s.pct);
          return (
            <View key={s.id} style={styles.subjectCard}>
              <View style={styles.subjectHeader}>
                <Text style={styles.subjectName}>{s.name}</Text>
                <Text style={[styles.subjectPct, { color: g.color }]}>
                  {s.pct}%
                </Text>
              </View>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${s.pct}%`, backgroundColor: g.color },
                  ]}
                />
              </View>
              <Text style={styles.subjectMeta}>
                {s.present}P / {s.absent}A · {s.code}
              </Text>
            </View>
          );
        })}
        {subjectStats.length === 0 && (
          <Text style={styles.empty}>No subjects found</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  backBtn: { fontSize: 15, color: "#1A73E8", fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "700", color: "#1A1A2E" },
  scroll: { padding: 16, paddingTop: 0 },
  overallCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 16,
    borderLeftWidth: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  overallPct: { fontSize: 36, fontWeight: "900" },
  gradeLabel: { fontSize: 14, fontWeight: "700" },
  overallMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  monthScroll: { marginBottom: 16 },
  monthChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: "#fff",
    marginRight: 6,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  monthChipActive: { backgroundColor: "#1A73E8", borderColor: "#1A73E8" },
  monthText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  monthTextActive: { color: "#fff" },
  calendarCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  calendarTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 12,
    textAlign: "center",
  },
  weekRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  weekDay: {
    flex: 1,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  calendarCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 6,
    marginBottom: 2,
  },
  dayNum: { fontSize: 12, color: "#374151", fontWeight: "500" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 10,
  },
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
  subjectHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  subjectName: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
  subjectPct: { fontSize: 18, fontWeight: "800" },
  progressBar: {
    height: 6,
    backgroundColor: "#F3F4F6",
    borderRadius: 3,
    marginBottom: 6,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 3 },
  subjectMeta: { fontSize: 11, color: "#6B7280" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 20, fontSize: 14 },
});
