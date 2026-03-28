import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../config/supabase";
import { useAuthStore } from "../../contexts/AuthContext";
import { useToast } from "../../components/Toast";

export default function ProfileSetup() {
  const { user } = useAuthStore();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: user?.user_metadata?.full_name || "",
    roll_number: "",
    year: "",
    semester: "",
    branch: "AI",
    section: "",
  });

  const update = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleSave = async () => {
    if (!form.name.trim()) return showToast("Name is required", "error");
    if (!form.roll_number.trim())
      return showToast("Roll number is required", "error");
    if (!form.year) return showToast("Year is required", "error");
    if (!form.semester) return showToast("Semester is required", "error");
    if (!form.section) return showToast("Section is required", "error");

    setLoading(true);
    try {
      const { data: existing } = await supabase
        .from("students")
        .select("id")
        .eq("roll_number", form.roll_number.trim())
        .maybeSingle();
      if (existing) throw new Error("Roll number already exists");

      const { data: existingReq } = await supabase
        .from("student_requests")
        .select("id")
        .eq("roll_number", form.roll_number.trim())
        .maybeSingle();
      if (existingReq) throw new Error("Roll number already in a pending request");

      const { error } = await supabase.from("student_requests").upsert(
        {
          auth_user_id: user.id,
          uid: user.id,
          name: form.name.trim(),
          roll_number: form.roll_number.trim(),
          year: parseInt(form.year, 10),
          semester: parseInt(form.semester, 10),
          branch: form.branch,
          section: form.section,
          status: "incomplete",
          profile_completed: false,
        },
        { onConflict: "auth_user_id" }
      );
      if (error) throw error;

      showToast("Profile saved! Please complete your details.", "success");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Profile Setup</Text>
        <Text style={styles.step}>Step 2 of 3</Text>

        <View style={styles.card}>
          <Field label="Full Name" value={form.name} onChange={(v) => update("name", v)} />
          <Field
            label="Roll Number"
            value={form.roll_number}
            onChange={(v) => update("roll_number", v)}
            keyboardType="numeric"
          />
          <Field
            label="Year (1-4)"
            value={form.year}
            onChange={(v) => update("year", v)}
            keyboardType="numeric"
          />
          <Field
            label="Semester (1-2)"
            value={form.semester}
            onChange={(v) => update("semester", v)}
            keyboardType="numeric"
          />
          <Field label="Branch" value={form.branch} editable={false} />
          <Field
            label="Section (A/B/C)"
            value={form.section}
            onChange={(v) => update("section", v.toUpperCase())}
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[styles.btn, loading && styles.btnDisabled]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>Continue</Text>
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
        style={styles.input}
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  scroll: { padding: 20 },
  title: { fontSize: 24, fontWeight: "800", color: "#1A1A2E", marginBottom: 4 },
  step: { fontSize: 13, color: "#6B7280", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  field: { marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#1A1A2E",
    backgroundColor: "#F9FAFB",
  },
  btn: {
    backgroundColor: "#1A73E8",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "600" },
});
