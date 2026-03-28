import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../contexts/AuthContext";
import { supabase } from "../../config/supabase";
import { useToast } from "../../components/Toast";
import { formatDate, timeAgo } from "../../utils/helpers";

export default function TeacherLeave({ navigation }) {
  const { user, teacherId } = useAuthStore();
  const { showToast } = useToast();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    reason: "",
    leaveType: "one_day",
    startDate: formatDate(),
    endDate: formatDate(),
  });

  const loadData = useCallback(async () => {
    let tid = teacherId;
    if (!tid) {
      const { data } = await supabase
        .from("authorized_teachers")
        .select("id")
        .eq("email", user?.email?.toLowerCase().trim())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      tid = data?.id;
    }
    if (!tid) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("teacher_id", tid)
      .order("created_at", { ascending: false });

    setLeaveRequests(data || []);
    setLoading(false);
  }, [teacherId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async () => {
    if (!form.reason.trim()) return showToast("Reason is required", "error");
    if (!form.startDate) return showToast("Start date is required", "error");

    setSending(true);
    try {
      let tid = teacherId;
      if (!tid) {
        const { data } = await supabase
          .from("authorized_teachers")
          .select("id")
          .eq("email", user?.email?.toLowerCase().trim())
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        tid = data?.id;
      }

      const { error } = await supabase.from("leave_requests").insert({
        teacher_id: tid,
        leave_type: form.leaveType,
        start_date: form.startDate,
        end_date: form.endDate,
        reason: form.reason.trim(),
        status: "pending",
      });
      if (error) throw error;

      showToast("Leave request submitted", "success");
      setForm({
        reason: "",
        leaveType: "one_day",
        startDate: formatDate(),
        endDate: formatDate(),
      });
      loadData();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSending(false);
    }
  };

  const statusColors = {
    pending: { bg: "#FEF3C7", text: "#D97706" },
    approved: { bg: "#D1FAE5", text: "#34A853" },
    rejected: { bg: "#FEE2E2", text: "#EF4444" },
  };

  const leaveTypes = [
    { key: "one_day", label: "Full Day" },
    { key: "half_day", label: "Half Day" },
    { key: "multiple_days", label: "Multiple Days" },
  ];

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
        <Text style={styles.title}>Leave Requests</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* New Request Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>New Leave Request</Text>

          <Text style={styles.label}>Leave Type</Text>
          <View style={styles.typeRow}>
            {leaveTypes.map((t) => (
              <TouchableOpacity
                key={t.key}
                style={[
                  styles.typeChip,
                  form.leaveType === t.key && styles.typeChipActive,
                ]}
                onPress={() => setForm((p) => ({ ...p, leaveType: t.key }))}
              >
                <Text
                  style={[
                    styles.typeChipText,
                    form.leaveType === t.key && styles.typeChipTextActive,
                  ]}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Start Date</Text>
          <TextInput
            style={styles.input}
            value={form.startDate}
            onChangeText={(v) => setForm((p) => ({ ...p, startDate: v }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#9CA3AF"
          />

          {form.leaveType === "multiple_days" && (
            <>
              <Text style={styles.label}>End Date</Text>
              <TextInput
                style={styles.input}
                value={form.endDate}
                onChangeText={(v) => setForm((p) => ({ ...p, endDate: v }))}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#9CA3AF"
              />
            </>
          )}

          <Text style={styles.label}>Reason</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={form.reason}
            onChangeText={(v) => setForm((p) => ({ ...p, reason: v }))}
            placeholder="Enter reason for leave..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={3}
          />

          <TouchableOpacity
            style={[styles.submitBtn, sending && { opacity: 0.7 }]}
            onPress={handleSubmit}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Past Requests */}
        <Text style={styles.sectionTitle}>Past Requests</Text>
        {leaveRequests.map((req) => {
          const colors = statusColors[req.status] || statusColors.pending;
          return (
            <View key={req.id} style={styles.requestCard}>
              <View style={styles.requestHeader}>
                <Text style={styles.requestType}>
                  {req.leave_type === "one_day"
                    ? "Full Day"
                    : req.leave_type === "half_day"
                    ? "Half Day"
                    : "Multiple Days"}
                </Text>
                <View
                  style={[styles.statusBadge, { backgroundColor: colors.bg }]}
                >
                  <Text style={[styles.statusText, { color: colors.text }]}>
                    {req.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.requestDates}>
                {req.start_date}
                {req.end_date !== req.start_date ? ` → ${req.end_date}` : ""}
              </Text>
              <Text style={styles.requestReason}>{req.reason}</Text>
              <Text style={styles.requestTime}>{timeAgo(req.created_at)}</Text>
            </View>
          );
        })}
        {leaveRequests.length === 0 && (
          <Text style={styles.empty}>No leave requests yet</Text>
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
  scroll: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6, marginTop: 12 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  typeChipActive: { backgroundColor: "#1A73E8", borderColor: "#1A73E8" },
  typeChipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  typeChipTextActive: { color: "#fff" },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#1A1A2E",
    backgroundColor: "#F9FAFB",
  },
  textArea: { height: 80, textAlignVertical: "top" },
  submitBtn: {
    backgroundColor: "#1A73E8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A2E",
    marginBottom: 12,
  },
  requestCard: {
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
  requestHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  requestType: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
  statusBadge: { paddingVertical: 3, paddingHorizontal: 10, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700", textTransform: "capitalize" },
  requestDates: { fontSize: 12, color: "#6B7280", marginBottom: 4 },
  requestReason: { fontSize: 13, color: "#374151" },
  requestTime: { fontSize: 11, color: "#9CA3AF", marginTop: 6 },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 20, fontSize: 14 },
});
