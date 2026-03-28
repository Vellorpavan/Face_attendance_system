import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../config/supabase";
import { useAuthStore } from "../../contexts/AuthContext";
import { useToast } from "../../components/Toast";
import { formatDate } from "../../utils/helpers";

export default function MarkAttendance({ route, navigation }) {
  const {
    subjectId,
    subjectName,
    subjectCode,
    startPeriod,
    year,
    semester,
    branch,
    section,
  } = route.params;
  const { user, teacherId } = useAuthStore();
  const { showToast } = useToast();

  const [students, setStudents] = useState([]);
  const [statuses, setStatuses] = useState({});
  const [existingRecords, setExistingRecords] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");

  const today = formatDate();

  const loadData = useCallback(async () => {
    let query = supabase
      .from("students")
      .select(
        "id, uid, name, roll_number, face_image_url, student_mobile, profile_completed"
      )
      .order("roll_number");
    if (year) query = query.eq("year", parseInt(year, 10));
    if (branch) query = query.eq("branch", branch);
    if (section && section !== "None") query = query.eq("section", section);

    const [studRes, attRes] = await Promise.all([
      query,
      supabase
        .from("attendance")
        .select("student_id, status, period")
        .eq("subject_id", subjectId)
        .eq("date", today),
    ]);

    if (!studRes.error) setStudents(studRes.data || []);

    if (!attRes.error && attRes.data?.length > 0) {
      setExistingRecords(true);
      const map = {};
      attRes.data.forEach((r) => {
        map[r.student_id] = r.status;
      });
      setStatuses(map);
    }

    setLoading(false);
  }, [subjectId, year, branch, section]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleStatus = (studentId) => {
    if (existingRecords) return;
    setStatuses((prev) => {
      const current = prev[studentId];
      if (!current) return { ...prev, studentId: "present" };
      if (current === "present") return { ...prev, [studentId]: "absent" };
      const next = { ...prev };
      delete next[studentId];
      return next;
    });
  };

  const markAll = (status) => {
    if (existingRecords) return;
    const map = {};
    students.forEach((s) => {
      map[s.id] = status;
    });
    setStatuses(map);
  };

  const handleSubmit = async () => {
    const unmarked = students.filter((s) => !statuses[s.id]);
    if (unmarked.length > 0 && !existingRecords) {
      // Auto-mark remaining as absent
    }

    setSaving(true);
    try {
      const records = students.map((s) => ({
        student_id: s.id,
        subject_id: subjectId,
        date: today,
        status: statuses[s.id] || "absent",
        period: startPeriod,
        period_count: 1,
        marked_by: teacherId || user?.id,
      }));

      const { error } = await supabase.from("attendance").upsert(records, {
        onConflict: "student_id,subject_id,date,period",
      });
      if (error) throw error;

      showToast("Attendance submitted successfully!", "success");

      // Send notifications to absent students
      const absentStudents = students.filter(
        (s) => statuses[s.id] === "absent"
      );
      for (const s of absentStudents) {
        await supabase.from("notifications").insert({
          title: "Attendance Marked",
          message: `You were marked absent for ${subjectName} (${startPeriod}) on ${today}.`,
          type: "warning",
          target_type: "student",
          target_role: "student",
          target_user_id: s.uid,
          student_roll: s.roll_number,
          created_by: teacherId || user?.id,
        });
      }

      setExistingRecords(true);
      navigation.goBack();
    } catch (err) {
      showToast(err.message || "Failed to submit", "error");
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      !search ||
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.roll_number || "").includes(search);
    const status = statuses[s.id];
    if (filter === "present") return matchSearch && status === "present";
    if (filter === "absent") return matchSearch && status === "absent";
    if (filter === "unmarked") return matchSearch && !status;
    return matchSearch;
  });

  const presentCount = students.filter((s) => statuses[s.id] === "present").length;
  const absentCount = students.filter((s) => statuses[s.id] === "absent").length;

  const renderItem = ({ item }) => {
    const status = statuses[item.id];
    return (
      <TouchableOpacity
        style={[
          styles.studentCard,
          status === "present" && styles.cardPresent,
          status === "absent" && styles.cardAbsent,
        ]}
        onPress={() => toggleStatus(item.id)}
        disabled={existingRecords}
      >
        <View style={styles.studentLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(item.name || "S").charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={styles.studentName}>{item.name}</Text>
            <Text style={styles.studentRoll}>{item.roll_number}</Text>
          </View>
        </View>
        <View
          style={[
            styles.statusBadge,
            status === "present" && styles.badgePresent,
            status === "absent" && styles.badgeAbsent,
            !status && styles.badgeUnmarked,
          ]}
        >
          <Text
            style={[
              styles.statusText,
              status === "present" && { color: "#34A853" },
              status === "absent" && { color: "#EF4444" },
              !status && { color: "#9CA3AF" },
            ]}
          >
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : "—"}
          </Text>
        </View>
      </TouchableOpacity>
    );
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
        <View style={styles.headerCenter}>
          <Text style={styles.title}>{subjectName}</Text>
          <Text style={styles.subtitle}>
            {subjectCode} · {startPeriod} · {today}
          </Text>
        </View>
        <View
          style={[styles.liveBadge, existingRecords && styles.liveBadgeLocked]}
        >
          <Text style={styles.liveText}>
            {existingRecords ? "Locked" : "Live"}
          </Text>
        </View>
      </View>

      <View style={styles.summaryRow}>
        <TouchableOpacity
          style={[styles.summaryPill, { backgroundColor: "#DBEAFE" }]}
          onPress={() => setFilter("all")}
        >
          <Text style={[styles.summaryValue, { color: "#1A73E8" }]}>
            {students.length}
          </Text>
          <Text style={[styles.summaryLabel, { color: "#1A73E8" }]}>Total</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.summaryPill, { backgroundColor: "#D1FAE5" }]}
          onPress={() => setFilter("present")}
        >
          <Text style={[styles.summaryValue, { color: "#34A853" }]}>
            {presentCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: "#34A853" }]}>Present</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.summaryPill, { backgroundColor: "#FEE2E2" }]}
          onPress={() => setFilter("absent")}
        >
          <Text style={[styles.summaryValue, { color: "#EF4444" }]}>
            {absentCount}
          </Text>
          <Text style={[styles.summaryLabel, { color: "#EF4444" }]}>Absent</Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search students..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#9CA3AF"
      />

      {!existingRecords && (
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => markAll("present")}
          >
            <Text style={styles.quickBtnText}>All Present</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.quickBtn, { backgroundColor: "#FEE2E2" }]}
            onPress={() => markAll("absent")}
          >
            <Text style={[styles.quickBtnText, { color: "#EF4444" }]}>
              All Absent
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
      />

      {!existingRecords && (
        <TouchableOpacity
          style={[styles.submitBtn, saving && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>
              Submit Attendance ({presentCount}P / {absentCount}A)
            </Text>
          )}
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  loading: { flex: 1, justifyContent: "center", alignItems: "center" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    gap: 12,
  },
  backBtn: { fontSize: 15, color: "#1A73E8", fontWeight: "600" },
  headerCenter: { flex: 1 },
  title: { fontSize: 16, fontWeight: "700", color: "#1A1A2E" },
  subtitle: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  liveBadge: {
    backgroundColor: "#D1FAE5",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  liveBadgeLocked: { backgroundColor: "#FEE2E2" },
  liveText: { fontSize: 11, fontWeight: "700", color: "#34A853" },
  summaryRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16, marginBottom: 10 },
  summaryPill: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  summaryLabel: { fontSize: 10, fontWeight: "600", marginTop: 2 },
  search: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#1A1A2E",
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  quickActions: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  quickBtn: {
    flex: 1,
    backgroundColor: "#D1FAE5",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  quickBtnText: { fontSize: 12, fontWeight: "600", color: "#34A853" },
  list: { padding: 16, paddingTop: 0 },
  studentCard: {
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
  studentLeft: { flexDirection: "row", alignItems: "center", flex: 1 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 14, fontWeight: "700", color: "#1A73E8" },
  studentName: { fontSize: 14, fontWeight: "600", color: "#1A1A2E" },
  studentRoll: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  badgePresent: { backgroundColor: "#D1FAE5" },
  badgeAbsent: { backgroundColor: "#FEE2E2" },
  badgeUnmarked: { backgroundColor: "#F3F4F6" },
  statusText: { fontSize: 12, fontWeight: "600" },
  submitBtn: {
    backgroundColor: "#1A73E8",
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
