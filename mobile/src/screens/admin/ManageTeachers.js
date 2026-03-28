import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../config/supabase";
import { useToast } from "../../components/Toast";
import { timeAgo } from "../../utils/helpers";

export default function ManageTeachers({ navigation }) {
  const { showToast } = useToast();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modal, setModal] = useState({ visible: false, editing: null });
  const [form, setForm] = useState({ name: "", email: "", mobile_number: "" });
  const [saving, setSaving] = useState(false);

  const loadTeachers = useCallback(async () => {
    const { data, error } = await supabase
      .from("authorized_teachers")
      .select("id, name, email, mobile_number, authorized, last_login, created_at")
      .order("created_at", { ascending: false });
    if (!error) setTeachers(data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadTeachers();
    const channel = supabase
      .channel("teachers")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "authorized_teachers" },
        loadTeachers
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  const openAdd = () => {
    setForm({ name: "", email: "", mobile_number: "" });
    setModal({ visible: true, editing: null });
  };

  const openEdit = (teacher) => {
    setForm({
      name: teacher.name || "",
      email: teacher.email || "",
      mobile_number: teacher.mobile_number || "",
    });
    setModal({ visible: true, editing: teacher });
  };

  const handleSave = async () => {
    if (!form.name.trim()) return showToast("Name is required", "error");
    if (!form.email.trim()) return showToast("Email is required", "error");

    setSaving(true);
    try {
      if (modal.editing) {
        const { error } = await supabase
          .from("authorized_teachers")
          .update({
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            mobile_number: form.mobile_number.trim() || null,
          })
          .eq("id", modal.editing.id);
        if (error) throw error;
        showToast("Teacher updated", "success");
      } else {
        const { error } = await supabase.from("authorized_teachers").insert({
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          mobile_number: form.mobile_number.trim() || null,
        });
        if (error) throw error;
        showToast("Teacher added", "success");
      }
      setModal({ visible: false, editing: null });
      loadTeachers();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleAuth = async (teacher) => {
    const newVal = !teacher.authorized;
    const { error } = await supabase
      .from("authorized_teachers")
      .update({ authorized: newVal })
      .eq("id", teacher.id);
    if (error) showToast(error.message, "error");
    else showToast(newVal ? "Authorized" : "Deauthorized", "success");
  };

  const deleteTeacher = async (teacher) => {
    const { error } = await supabase
      .from("authorized_teachers")
      .delete()
      .eq("id", teacher.id);
    if (error) showToast(error.message, "error");
    else showToast("Teacher deleted", "success");
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardLeft}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.name || "T").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.email}>{item.email}</Text>
          {item.mobile_number ? (
            <Text style={styles.mobile}>📱 {item.mobile_number}</Text>
          ) : null}
          <Text style={styles.meta}>
            {item.last_login
              ? `Last active: ${timeAgo(item.last_login)}`
              : "Never logged in"}
          </Text>
        </View>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={[
            styles.badge,
            { backgroundColor: item.authorized ? "#D1FAE5" : "#FEE2E2" },
          ]}
          onPress={() => toggleAuth(item)}
        >
          <Text
            style={[
              styles.badgeText,
              { color: item.authorized ? "#34A853" : "#EF4444" },
            ]}
          >
            {item.authorized ? "Active" : "Locked"}
          </Text>
        </TouchableOpacity>
        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
            <Text style={styles.editBtnText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => deleteTeacher(item)}
          >
            <Text style={styles.deleteBtnText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

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
        <Text style={styles.title}>Manage Teachers</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Text style={styles.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={teachers}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadTeachers(); }} />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No teachers found. Add one to get started.</Text>
        }
      />

      <Modal visible={modal.visible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {modal.editing ? "Edit Teacher" : "Add Teacher"}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={form.name}
              onChangeText={(v) => setForm((p) => ({ ...p, name: v }))}
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={form.email}
              onChangeText={(v) => setForm((p) => ({ ...p, email: v }))}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#9CA3AF"
            />
            <TextInput
              style={styles.input}
              placeholder="Mobile Number"
              value={form.mobile_number}
              onChangeText={(v) => setForm((p) => ({ ...p, mobile_number: v }))}
              keyboardType="phone-pad"
              placeholderTextColor="#9CA3AF"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModal({ visible: false, editing: null })}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
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
  addBtn: {
    backgroundColor: "#1A73E8",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardLeft: { flexDirection: "row", flex: 1 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 18, fontWeight: "700", color: "#1A73E8" },
  cardInfo: { flex: 1 },
  name: { fontSize: 15, fontWeight: "700", color: "#1A1A2E" },
  email: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  mobile: { fontSize: 12, color: "#374151", marginTop: 2 },
  meta: { fontSize: 11, color: "#9CA3AF", marginTop: 4 },
  cardActions: { alignItems: "flex-end", justifyContent: "space-between" },
  badge: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: "600" },
  actionRow: { flexDirection: "row", gap: 8 },
  editBtn: { paddingVertical: 4, paddingHorizontal: 10 },
  editBtnText: { color: "#1A73E8", fontSize: 12, fontWeight: "600" },
  deleteBtn: { paddingVertical: 4, paddingHorizontal: 10 },
  deleteBtnText: { color: "#EF4444", fontSize: 12, fontWeight: "600" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    width: "90%",
    maxWidth: 400,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: "#1A1A2E",
    marginBottom: 12,
    backgroundColor: "#F9FAFB",
  },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  cancelText: { color: "#6B7280", fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#1A73E8",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  saveText: { color: "#fff", fontWeight: "600" },
});
