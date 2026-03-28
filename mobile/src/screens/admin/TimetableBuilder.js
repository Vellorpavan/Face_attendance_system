import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../config/supabase";
import { useToast } from "../../components/Toast";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI", "SAT"];

export default function TimetableBuilder({ navigation }) {
  const { showToast } = useToast();
  const [filters, setFilters] = useState({
    year: "2",
    semester: "1",
    branch: "AI",
    section: "A",
  });
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [timetable, setTimetable] = useState({});
  const [loading, setLoading] = useState(true);
  const [subjectModal, setSubjectModal] = useState({
    visible: false,
    day: null,
    period: null,
  });
  const [includeSaturday, setIncludeSaturday] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const { year, semester, branch, section } = filters;

    const [subjRes, teachRes, periodRes, ttRes, configRes] = await Promise.all([
      supabase
        .from("subjects")
        .select("id, name, code, teacher_id")
        .eq("year", year)
        .eq("semester", semester)
        .eq("branch", branch)
        .order("name"),
      supabase
        .from("authorized_teachers")
        .select("id, name, email, mobile_number")
        .order("name"),
      supabase
        .from("periods")
        .select("*")
        .eq("branch", branch)
        .or(`year.eq.${year},year.is.null`)
        .order("order_index"),
      supabase
        .from("timetable")
        .select("*, subject:subject_id(id, name, code), teacher:teacher_id(id, name)")
        .eq("year", year)
        .eq("semester", semester)
        .eq("branch", branch)
        .eq("section", section),
      supabase
        .from("timetable_config")
        .select("include_saturday")
        .eq("branch", branch)
        .eq("year", year)
        .eq("semester", semester)
        .eq("section", section)
        .maybeSingle(),
    ]);

    if (!subjRes.error) setSubjects(subjRes.data || []);
    if (!teachRes.error) setTeachers(teachRes.data || []);
    if (!periodRes.error) setPeriods(periodRes.data || []);
    if (!configRes.error) setIncludeSaturday(configRes.data?.include_saturday || false);

    if (!ttRes.error) {
      const map = {};
      (ttRes.data || []).forEach((slot) => {
        const key = `${slot.day}-${slot.period}`;
        map[key] = slot;
      });
      setTimetable(map);
    }
    setLoading(false);
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const assignSubject = async (subjectId) => {
    const { day, period } = subjectModal;
    const subj = subjects.find((s) => s.id === subjectId);
    const teacherId = subj?.teacher_id || null;
    const { year, semester, branch, section } = filters;

    try {
      const { error } = await supabase.from("timetable").upsert(
        {
          branch,
          year: parseInt(year, 10),
          semester: parseInt(semester, 10),
          section,
          day,
          period,
          subject_id: subjectId,
          teacher_id: teacherId,
          is_lunch: false,
        },
        { onConflict: "branch,year,semester,section,day,period" }
      );
      if (error) throw error;

      showToast("Subject assigned", "success");
      setSubjectModal({ visible: false, day: null, period: null });
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const clearSlot = async (day, period) => {
    const { year, semester, branch, section } = filters;
    const { error } = await supabase
      .from("timetable")
      .delete()
      .eq("branch", branch)
      .eq("year", year)
      .eq("semester", semester)
      .eq("section", section)
      .eq("day", day)
      .eq("period", period);
    if (error) showToast(error.message, "error");
    else {
      showToast("Slot cleared", "success");
      loadData();
    }
  };

  const visibleDays = includeSaturday ? DAYS : DAYS.slice(0, 5);
  const academicPeriods = periods.filter((p) => !p.is_lunch);

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
        <Text style={styles.title}>Timetable Builder</Text>
        <TouchableOpacity
          style={[styles.satBtn, includeSaturday && styles.satBtnActive]}
          onPress={() => setIncludeSaturday(!includeSaturday)}
        >
          <Text style={[styles.satText, includeSaturday && styles.satTextActive]}>
            SAT
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {["year", "semester", "section"].map((f) => (
          <View key={f} style={styles.filterChip}>
            <Text style={styles.filterLabel}>{f.toUpperCase()}</Text>
            <TextInput
              style={styles.filterInput}
              value={filters[f]}
              onChangeText={(v) =>
                setFilters((p) => ({ ...p, [f]: v.toUpperCase() }))
              }
              maxLength={2}
            />
          </View>
        ))}
        <TouchableOpacity style={styles.loadBtn} onPress={loadData}>
          <Text style={styles.loadBtnText}>Load</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header row */}
          <View style={styles.gridRow}>
            <View style={styles.dayCell}>
              <Text style={styles.dayLabel}>Day</Text>
            </View>
            {academicPeriods.map((p) => (
              <View key={p.id} style={styles.periodHeader}>
                <Text style={styles.periodLabel}>{p.name}</Text>
                <Text style={styles.timeLabel}>
                  {p.start_time?.slice(0, 5)}-{p.end_time?.slice(0, 5)}
                </Text>
              </View>
            ))}
          </View>

          {/* Day rows */}
          {visibleDays.map((day) => (
            <View key={day} style={styles.gridRow}>
              <View style={styles.dayCell}>
                <Text style={styles.dayText}>{day}</Text>
              </View>
              {academicPeriods.map((p) => {
                const key = `${day}-${p.name}`;
                const slot = timetable[key];
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.cell, slot && styles.cellFilled]}
                    onPress={() =>
                      setSubjectModal({ visible: true, day, period: p.name })
                    }
                    onLongPress={() => slot && clearSlot(day, p.name)}
                  >
                    {slot ? (
                      <>
                        <Text style={styles.cellCode}>
                          {slot.subject?.code || "—"}
                        </Text>
                        <Text style={styles.cellName} numberOfLines={1}>
                          {slot.subject?.name || ""}
                        </Text>
                        <Text style={styles.cellTeacher} numberOfLines={1}>
                          {slot.teacher?.name || ""}
                        </Text>
                      </>
                    ) : (
                      <Text style={styles.cellEmpty}>+</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
              {/* Lunch */}
              <View style={styles.lunchCell}>
                <Text style={styles.lunchText}>🍽</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <Text style={styles.hint}>Tap to assign · Long-press to clear</Text>

      {/* Subject picker modal */}
      <Modal visible={subjectModal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              Assign Subject — {subjectModal.day} / {subjectModal.period}
            </Text>
            <ScrollView style={{ maxHeight: 400 }}>
              {subjects.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={styles.subjectItem}
                  onPress={() => assignSubject(s.id)}
                >
                  <Text style={styles.subjectCode}>{s.code}</Text>
                  <Text style={styles.subjectName}>{s.name}</Text>
                </TouchableOpacity>
              ))}
              {subjects.length === 0 && (
                <Text style={styles.empty}>No subjects for this year/sem</Text>
              )}
              <TouchableOpacity
                style={styles.clearOption}
                onPress={() => {
                  clearSlot(subjectModal.day, subjectModal.period);
                  setSubjectModal({ visible: false, day: null, period: null });
                }}
              >
                <Text style={styles.clearText}>Clear Slot</Text>
              </TouchableOpacity>
            </ScrollView>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setSubjectModal({ visible: false, day: null, period: null })}
            >
              <Text style={styles.closeBtnText}>Cancel</Text>
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
  satBtn: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  satBtnActive: { backgroundColor: "#1A73E8", borderColor: "#1A73E8" },
  satText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  satTextActive: { color: "#fff" },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: "center",
  },
  filterChip: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    alignItems: "center",
  },
  filterLabel: { fontSize: 10, color: "#9CA3AF", fontWeight: "600" },
  filterInput: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A1A2E",
    textAlign: "center",
    width: "100%",
    padding: 4,
  },
  loadBtn: {
    backgroundColor: "#1A73E8",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  loadBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  gridRow: { flexDirection: "row" },
  dayCell: {
    width: 50,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  dayLabel: { fontSize: 10, fontWeight: "700", color: "#9CA3AF" },
  dayText: { fontSize: 13, fontWeight: "700", color: "#1A1A2E" },
  periodHeader: {
    width: 90,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  periodLabel: { fontSize: 12, fontWeight: "700", color: "#1A73E8" },
  timeLabel: { fontSize: 9, color: "#6B7280" },
  cell: {
    width: 90,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
    padding: 4,
  },
  cellFilled: { backgroundColor: "#F0FDF4" },
  cellCode: { fontSize: 13, fontWeight: "800", color: "#1A73E8" },
  cellName: { fontSize: 9, color: "#374151", marginTop: 1 },
  cellTeacher: { fontSize: 8, color: "#9CA3AF", marginTop: 1 },
  cellEmpty: { fontSize: 20, color: "#D1D5DB" },
  lunchCell: {
    width: 40,
    height: 70,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderWidth: 0.5,
    borderColor: "#E5E7EB",
  },
  lunchText: { fontSize: 16 },
  hint: { textAlign: "center", color: "#9CA3AF", fontSize: 11, padding: 10 },
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
  subjectItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
    borderRadius: 8,
  },
  subjectCode: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1A73E8",
    width: 60,
  },
  subjectName: { fontSize: 13, color: "#374151", flex: 1 },
  empty: { textAlign: "center", color: "#9CA3AF", padding: 20 },
  clearOption: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    alignItems: "center",
  },
  clearText: { color: "#EF4444", fontWeight: "600" },
  closeBtn: { alignItems: "center", padding: 12, marginTop: 8 },
  closeBtnText: { color: "#6B7280", fontWeight: "600" },
});
