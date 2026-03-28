import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../config/supabase";
import { useToast } from "../../components/Toast";

export default function ManageStudents({ navigation }) {
  const { showToast } = useToast();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({ year: "", section: "" });
  const [detailModal, setDetailModal] = useState({ visible: false, student: null });
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadStudents = useCallback(async () => {
    let query = supabase
      .from("students")
      .select("*")
      .order("created_at", { ascending: false });
    const { data, error } = await query;
    if (!error) setStudents(data || []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadStudents();
  }, []);

  const filteredStudents = students.filter((s) => {
    const matchSearch =
      !search ||
      (s.name || "").toLowerCase().includes(search.toLowerCase()) ||
      (s.roll_number || "").includes(search);
    const matchYear = !filters.year || String(s.year) === filters.year;
    const matchSection = !filters.section || s.section === filters.section;
    return matchSearch && matchYear && matchSection;
  });

  const openDetail = (student) => {
    setDetailModal({ visible: true, student });
    setEditMode(false);
    setEditForm({
      student_mobile: student.student_mobile || "",
      father_name: student.father_name || "",
      father_mobile: student.father_mobile || "",
      father_occupation: student.father_occupation || "",
      mother_name: student.mother_name || "",
      mother_mobile: student.mother_mobile || "",
      mother_occupation: student.mother_occupation || "",
    });
  };

  const handleSave = async () => {
    if (
      editForm.student_mobile &&
      editForm.student_mobile.length !== 10
    ) {
      return showToast("Student mobile must be 10 digits", "error");
    }
    if (
      editForm.father_mobile &&
      editForm.father_mobile.length !== 10
    ) {
      return showToast("Father mobile must be 10 digits", "error");
    }
    if (
      editForm.student_mobile &&
      editForm.father_mobile &&
      editForm.student_mobile === editForm.father_mobile
    ) {
      return showToast("Student and father mobile cannot be same", "error");
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("students")
        .update({
          student_mobile: editForm.student_mobile || null,
          father_name: editForm.father_name || null,
          father_mobile: editForm.father_mobile || null,
          father_occupation: editForm.father_occupation || null,
          mother_name: editForm.mother_name || null,
          mother_mobile: editForm.mother_mobile || null,
          mother_occupation: editForm.mother_occupation || null,
        })
        .eq("id", detailModal.student.id);
      if (error) throw error;
      showToast("Student updated", "success");
      setEditMode(false);
      loadStudents();
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  const isIncomplete = (s) =>
    !s.student_mobile || !s.father_name || !s.father_mobile || !s.father_occupation;

  const isDuplicateFatherMobile = (s) => {
    if (!s.father_mobile) return false;
    return students.some(
      (other) =>
        other.id !== s.id &&
        other.father_mobile === s.father_mobile
    );
  };

  const renderItem = ({ item }) => {
    const incomplete = isIncomplete(item);
    const dupFather = isDuplicateFatherMobile(item);

    return (
      <TouchableOpacity style={styles.card} onPress={() => openDetail(item)}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(item.name || "S").charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.roll}>Roll: {item.roll_number}</Text>
          <Text style={styles.meta}>
            {item.branch} · Y{item.year} S{item.semester} · Sec {item.section}
          </Text>
        </View>
        <View style={styles.badgeCol}>
          {dupFather && (
            <View style={[styles.badge, { backgroundColor: "#FEE2E2" }]}>
              <Text style={[styles.badgeText, { color: "#EF4444" }]}>
                DUP PARENT
              </Text>
            </View>
          )}
          {incomplete && (
            <View style={[styles.badge, { backgroundColor: "#FEF3C7" }]}>
              <Text style={[styles.badgeText, { color: "#D97706" }]}>
                INCOMPLETE
              </Text>
            </View>
          )}
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
        <Text style={styles.title}>Manage Students</Text>
        <Text style={styles.count}>{filteredStudents.length} total</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Search by name or roll number..."
        value={search}
        onChangeText={setSearch}
        placeholderTextColor="#9CA3AF"
      />

      <View style={styles.filterRow}>
        {["", "1", "2", "3", "4"].map((y) => (
          <TouchableOpacity
            key={y}
            style={[styles.filterChip, filters.year === y && styles.filterChipActive]}
            onPress={() => setFilters((p) => ({ ...p, year: y }))}
          >
            <Text
              style={[
                styles.filterText,
                filters.year === y && styles.filterTextActive,
              ]}
            >
              {y ? `Year ${y}` : "All"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredStudents}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadStudents();
            }}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No students found</Text>
        }
      />

      {/* Detail modal */}
      <Modal visible={detailModal.visible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <ScrollView>
              <Text style={styles.modalTitle}>
                {detailModal.student?.name}
              </Text>
              <Text style={styles.modalMeta}>
                Roll: {detailModal.student?.roll_number} ·{" "}
                {detailModal.student?.branch} · Y{detailModal.student?.year} S
                {detailModal.student?.semester} · Sec {detailModal.student?.section}
              </Text>

              {editMode ? (
                <>
                  <EditField
                    label="Student Mobile"
                    value={editForm.student_mobile}
                    onChange={(v) =>
                      setEditForm((p) => ({ ...p, student_mobile: v }))
                    }
                    keyboardType="phone-pad"
                  />
                  <EditField
                    label="Father Name"
                    value={editForm.father_name}
                    onChange={(v) =>
                      setEditForm((p) => ({ ...p, father_name: v }))
                    }
                  />
                  <EditField
                    label="Father Mobile"
                    value={editForm.father_mobile}
                    onChange={(v) =>
                      setEditForm((p) => ({ ...p, father_mobile: v }))
                    }
                    keyboardType="phone-pad"
                  />
                  <EditField
                    label="Father Occupation"
                    value={editForm.father_occupation}
                    onChange={(v) =>
                      setEditForm((p) => ({ ...p, father_occupation: v }))
                    }
                  />
                  <EditField
                    label="Mother Name"
                    value={editForm.mother_name}
                    onChange={(v) =>
                      setEditForm((p) => ({ ...p, mother_name: v }))
                    }
                  />
                  <EditField
                    label="Mother Mobile"
                    value={editForm.mother_mobile}
                    onChange={(v) =>
                      setEditForm((p) => ({ ...p, mother_mobile: v }))
                    }
                    keyboardType="phone-pad"
                  />
                  <EditField
                    label="Mother Occupation"
                    value={editForm.mother_occupation}
                    onChange={(v) =>
                      setEditForm((p) => ({ ...p, mother_occupation: v }))
                    }
                  />
                  <View style={styles.modalActions}>
                    <TouchableOpacity
                      style={styles.cancelBtn}
                      onPress={() => setEditMode(false)}
                    >
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.saveBtn}
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
                </>
              ) : (
                <>
                  <DetailRow label="Student Mobile" value={detailModal.student?.student_mobile} />
                  <DetailRow label="Father" value={detailModal.student?.father_name} />
                  <DetailRow label="Father Mobile" value={detailModal.student?.father_mobile} />
                  <DetailRow label="Father Occupation" value={detailModal.student?.father_occupation} />
                  <DetailRow label="Mother" value={detailModal.student?.mother_name} />
                  <DetailRow label="Mother Mobile" value={detailModal.student?.mother_mobile} />
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => setEditMode(true)}
                  >
                    <Text style={styles.editBtnText}>Edit Details</Text>
                  </TouchableOpacity>
                </>
              )}

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setDetailModal({ visible: false, student: null })}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={detailStyles.row}>
      <Text style={detailStyles.label}>{label}</Text>
      <Text style={detailStyles.value}>{value || "—"}</Text>
    </View>
  );
}

function EditField({ label, value, onChange, ...props }) {
  return (
    <View style={detailStyles.field}>
      <Text style={detailStyles.label}>{label}</Text>
      <TextInput
        style={detailStyles.input}
        value={value}
        onChangeText={onChange}
        placeholder={label}
        placeholderTextColor="#9CA3AF"
        {...props}
      />
    </View>
  );
}

const detailStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#F3F4F6",
  },
  label: { fontSize: 13, color: "#6B7280", fontWeight: "600" },
  value: { fontSize: 14, color: "#1A1A2E", fontWeight: "500" },
  field: { marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: "#1A1A2E",
    backgroundColor: "#F9FAFB",
    marginTop: 4,
  },
});

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
  count: { fontSize: 13, color: "#6B7280" },
  search: {
    marginHorizontal: 16,
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: "#1A1A2E",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  filterChip: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  filterChipActive: { backgroundColor: "#1A73E8", borderColor: "#1A73E8" },
  filterText: { fontSize: 11, fontWeight: "600", color: "#6B7280" },
  filterTextActive: { color: "#fff" },
  list: { padding: 16, paddingTop: 0 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#DBEAFE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: { fontSize: 16, fontWeight: "700", color: "#1A73E8" },
  cardInfo: { flex: 1 },
  name: { fontSize: 14, fontWeight: "700", color: "#1A1A2E" },
  roll: { fontSize: 11, color: "#6B7280", marginTop: 1 },
  meta: { fontSize: 10, color: "#9CA3AF", marginTop: 2 },
  badgeCol: { gap: 4, alignItems: "flex-end" },
  badge: { paddingVertical: 3, paddingHorizontal: 8, borderRadius: 5 },
  badgeText: { fontSize: 9, fontWeight: "700" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40, fontSize: 14 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    maxHeight: "85%",
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#1A1A2E", marginBottom: 4 },
  modalMeta: { fontSize: 12, color: "#6B7280", marginBottom: 20 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 8 },
  editBtn: {
    backgroundColor: "#EFF6FF",
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 16,
  },
  editBtnText: { color: "#1A73E8", fontWeight: "600" },
  cancelBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  cancelText: { color: "#6B7280", fontWeight: "600" },
  saveBtn: {
    backgroundColor: "#1A73E8",
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  saveText: { color: "#fff", fontWeight: "600" },
  closeBtn: { alignItems: "center", padding: 14, marginTop: 8 },
  closeBtnText: { color: "#1A73E8", fontWeight: "600" },
});
