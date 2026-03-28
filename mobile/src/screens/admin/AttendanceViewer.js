import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../config/supabase";
import { formatDate, getDayOfWeek, applyContinuousPeriodFix } from "../../utils/helpers";

export default function AttendanceViewer({ navigation }) {
  const [date, setDate] = useState(formatDate());
  const [filters, setFilters] = useState({
    year: "2",
    semester: "1",
    branch: "AI",
    section: "A",
  });
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [attendanceData, setAttendanceData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentModal, setStudentModal] = useState({
    visible: false,
    title: "",
    students: [],
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    const day = getDayOfWeek(date);

    const [subjRes, teachRes, ttRes, attRes] = await Promise.all([
      supabase.from("subjects").select("id, name, code"),
      supabase.from("authorized_teachers").select("id, name"),
      supabase
        .from("timetable")
        .select("*, subject:subject_id(id, name, code), teacher:teacher_id(id, name)")
        .eq("year", filters.year)
        .eq("semester", filters.semester)
        .eq("branch", filters.branch)
        .eq("section", filters.section)
        .eq("day", day),
      supabase
        .from("attendance")
        .select(
          "*, student:student_id(name, roll_number, section, year, branch)"
        )
        .eq("date", date)
        .eq("student.year", parseInt(filters.year, 10))
        .eq("student.branch", filters.branch),
    ]);

    if (!subjRes.error) setSubjects(subjRes.data || []);
    if (!teachRes.error) setTeachers(teachRes.data || []);

    const slots = (ttRes.data || []).filter((s) => !s.is_lunch);
    setTimetableSlots(slots);

    let attRecords = attRes.data || [];
    attRecords = applyContinuousPeriodFix(attRecords, slots);
    setAttendanceData(attRecords);

    setLoading(false);
  }, [date, filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getSubjectName = (id) =>
    subjects.find((s) => s.id === id)?.name || "Unknown";
  const getTeacherName = (id) =>
    teachers.find((t) => t.id === id)?.name || "Unassigned";

  const getStatsForSlot = (subjectId, period) => {
    const records = attendanceData.filter(
      (r) => r.subject_id === subjectId && r.period === period
    );
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    return { present, absent, total: present + absent, records };
  };

  const showStudentList = (title, records, status) => {
    const filtered = records.filter((r) => r.status === status);
    const students = filtered.map((r) => ({
      name: r.student?.name || "Unknown",
      roll: r.student?.roll_number || "",
    }));
    setStudentModal({ visible: true, title: `${title} — ${status}`, students });
  };

  const prevDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(formatDate(d));
  };
  const nextDay = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(formatDate(d));
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Attendance Viewer</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.dateRow}>
        <TouchableOpacity onPress={prevDay} style={styles.dateNav}>
          <Text style={styles.dateNavText}>◀</Text>
        </TouchableOpacity>
        <View style={styles.dateCard}>
          <Text style={styles.dateText}>{date}</Text>
          <Text style={styles.dayText}>{getDayOfWeek(date)}</Text>
        </View>
        <TouchableOpacity onPress={nextDay} style={styles.dateNav}>
          <Text style={styles.dateNavText}>▶</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {timetableSlots.length === 0 ? (
          <Text style={styles.empty}>No classes scheduled for this day</Text>
        ) : (
          timetableSlots.map((slot) => {
            const stats = getStatsForSlot(slot.subject_id, slot.period);
            const label = slot.subject?.name || getSubjectName(slot.subject_id);
            const code = slot.subject?.code || "";
            const teacher = slot.teacher?.name || getTeacherName(slot.teacher_id);

            return (
              <View key={`${slot.day}-${slot.period}`} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.cardCode}>
                      {code} — {label}
                    </Text>
                    <Text style={styles.cardMeta}>
                      {slot.period} · {teacher}
                    </Text>
                  </View>
                  <View style={styles.periodBadge}>
                    <Text style={styles.periodBadgeText}>{slot.period}</Text>
                  </View>
                </View>

                <View style={styles.statsRow}>
                  <TouchableOpacity
                    style={[styles.statPill, { backgroundColor: "#D1FAE5" }]}
                    onPress={() =>
                      showStudentList(label, stats.records, "present")
                    }
                  >
                    <Text style={[styles.statValue, { color: "#34A853" }]}>
                      {stats.present}
                    </Text>
                    <Text style={[styles.statLabel, { color: "#34A853" }]}>
                      Present
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.statPill, { backgroundColor: "#FEE2E2" }]}
                    onPress={() =>
                      showStudentList(label, stats.records, "absent")
                    }
                  >
                    <Text style={[styles.statValue, { color: "#EF4444" }]}>
                      {stats.absent}
                    </Text>
                    <Text style={[styles.statLabel, { color: "#EF4444" }]}>
                      Absent
                    </Text>
                  </TouchableOpacity>
                  <View style={[styles.statPill, { backgroundColor: "#F3F4F6" }]}>
                    <Text style={[styles.statValue, { color: "#6B7280" }]}>
                      {stats.total}
                    </Text>
                    <Text style={[styles.statLabel, { color: "#6B7280" }]}>
                      Total
                    </Text>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Student list modal */}
      <Modal visible={studentModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>{studentModal.title}</Text>
            <FlatList
              data={studentModal.students}
              keyExtractor={(_, i) => i.toString()}
              renderItem={({ item }) => (
                <View style={styles.studentRow}>
                  <Text style={styles.studentRoll}>{item.roll}</Text>
                  <Text style={styles.studentName}>{item.name}</Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={styles.empty}>No students</Text>
              }
              style={{ maxHeight: 400 }}
            />
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() =>
                setStudentModal({ visible: false, title: "", students: [] })
              }
            >
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    marginBottom: 12,
  },
  dateNav: { padding: 8 },
  dateNavText: { fontSize: 18, color: "#1A73E8" },
  dateCard: { alignItems: "center" },
  dateText: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  dayText: { fontSize: 12, color: "#6B7280" },
  scroll: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardCode: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  cardMeta: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  periodBadge: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  periodBadgeText: { fontSize: 11, fontWeight: "700", color: "#1A73E8" },
  statsRow: { flexDirection: "row", gap: 8 },
  statPill: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  statValue: { fontSize: 18, fontWeight: "800" },
  statLabel: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  empty: { textAlign: "center", color: "#9CA3AF", padding: 20, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    width: "90%",
    maxHeight: "70%",
  },
  modalTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 12 },
  studentRow: {
    flexDirection: "row",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
    alignItems: "center",
  },
  studentRoll: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1A73E8",
    width: 70,
  },
  studentName: { fontSize: 14, color: "#374151", flex: 1 },
  closeBtn: { alignItems: "center", padding: 12, marginTop: 8 },
  closeBtnText: { color: "#1A73E8", fontWeight: "600" },
});
