import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../config/supabase";
import { useToast } from "../../components/Toast";

export default function NotificationHub({ navigation }) {
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    title: "",
    message: "",
    targetType: "all",
    branch: "AI",
    year: "",
    semester: "",
    section: "",
    studentRoll: "",
  });

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSend = async () => {
    if (!form.title.trim()) return showToast("Title is required", "error");
    if (!form.message.trim()) return showToast("Message is required", "error");

    setSending(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const userId = session?.user?.id;

      const notification = {
        title: form.title.trim(),
        message: form.message.trim(),
        type: "announcement",
        target_type: form.targetType,
        target_role: "student",
        created_by: userId,
      };

      if (form.targetType === "class") {
        notification.branch = form.branch;
        notification.year = parseInt(form.year, 10) || null;
        notification.semester = parseInt(form.semester, 10) || null;
      } else if (form.targetType === "section") {
        notification.branch = form.branch;
        notification.year = parseInt(form.year, 10) || null;
        notification.semester = parseInt(form.semester, 10) || null;
        notification.section = form.section;
      } else if (form.targetType === "student") {
        notification.student_roll = form.studentRoll.trim();
      }

      const { error } = await supabase.from("notifications").insert(notification);
      if (error) throw error;

      showToast("Notification sent successfully!", "success");
      setForm({
        title: "",
        message: "",
        targetType: "all",
        branch: "AI",
        year: "",
        semester: "",
        section: "",
        studentRoll: "",
      });
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSending(false);
    }
  };

  const targetOptions = [
    { key: "all", label: "All Students" },
    { key: "class", label: "By Class" },
    { key: "section", label: "By Section" },
    { key: "student", label: "Specific Student" },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backBtn}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Send Notification</Text>
        <View style={{ width: 50 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.label}>Target Audience</Text>
          <View style={styles.targetRow}>
            {targetOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.targetChip,
                  form.targetType === opt.key && styles.targetChipActive,
                ]}
                onPress={() => update("targetType", opt.key)}
              >
                <Text
                  style={[
                    styles.targetChipText,
                    form.targetType === opt.key && styles.targetChipTextActive,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {form.targetType === "class" || form.targetType === "section" ? (
            <>
              <View style={styles.row}>
                <FieldSmall label="Year" value={form.year} onChange={(v) => update("year", v)} />
                <FieldSmall label="Sem" value={form.semester} onChange={(v) => update("semester", v)} />
              </View>
              {form.targetType === "section" && (
                <Field label="Section" value={form.section} onChange={(v) => update("section", v.toUpperCase())} />
              )}
            </>
          ) : null}

          {form.targetType === "student" && (
            <Field
              label="Student Roll Number"
              value={form.studentRoll}
              onChange={(v) => update("studentRoll", v)}
              keyboardType="numeric"
            />
          )}

          <Field label="Title" value={form.title} onChange={(v) => update("title", v)} />
          <Field
            label="Message"
            value={form.message}
            onChange={(v) => update("message", v)}
            multiline
            numberOfLines={4}
          />

          <TouchableOpacity
            style={[styles.sendBtn, sending && { opacity: 0.7 }]}
            onPress={handleSend}
            disabled={sending}
          >
            {sending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.sendBtnText}>Send Notification</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Field({ label, value, onChange, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, props.multiline && styles.textArea]}
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  );
}

function FieldSmall({ label, value, onChange }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor="#9CA3AF"
        keyboardType="numeric"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  field: { marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#1A1A2E",
    backgroundColor: "#F9FAFB",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  row: { flexDirection: "row", gap: 12, marginBottom: 16 },
  targetRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  targetChip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  targetChipActive: { backgroundColor: "#1A73E8", borderColor: "#1A73E8" },
  targetChipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  targetChipTextActive: { color: "#fff" },
  sendBtn: {
    backgroundColor: "#1A73E8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  sendBtnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
