import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TouchableOpacity } from "react-native-gesture-handler";
import { useAuthStore } from "../../contexts/AuthContext";
import { supabase } from "../../config/supabase";
import { getDayOfWeek } from "../../utils/helpers";

const DAYS = ["MON", "TUE", "WED", "THU", "FRI"];

export default function TeacherTimetable({ navigation }) {
  const { teacherId, user } = useAuthStore();
  const [timetable, setTimetable] = useState({});
  const [periods, setPeriods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getDayOfWeek(new Date()));

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

    const [ttRes, periodRes] = await Promise.all([
      supabase
        .from("timetable")
        .select("*, subject:subject_id(id, name, code)")
        .eq("teacher_id", tid)
        .order("day")
        .order("period"),
      supabase
        .from("periods")
        .select("*")
        .order("order_index"),
    ]);

    if (!ttRes.error) {
      const grouped = {};
      (ttRes.data || []).forEach((slot) => {
        if (!grouped[slot.day]) grouped[slot.day] = {};
        grouped[slot.day][slot.period] = slot;
      });
      setTimetable(grouped);
    }

    if (!periodRes.error) setPeriods(periodRes.data || []);
    setLoading(false);
  }, [teacherId, user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const daySlots = timetable[selectedDay] || {};
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
        <Text style={styles.title}>My Timetable</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.dayRow}>
        {DAYS.map((day) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayChip, selectedDay === day && styles.dayChipActive]}
            onPress={() => setSelectedDay(day)}
          >
            <Text
              style={[
                styles.dayChipText,
                selectedDay === day && styles.dayChipTextActive,
              ]}
            >
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {academicPeriods.map((p) => {
          const slot = daySlots[p.name];
          const isLunch = p.is_lunch;

          if (isLunch) {
            return (
              <View key={p.name} style={styles.lunchCard}>
                <Text style={styles.lunchText}>🍽 Lunch Break</Text>
              </View>
            );
          }

          return (
            <View
              key={p.name}
              style={[styles.periodCard, slot && styles.periodCardActive]}
            >
              <View style={styles.periodLeft}>
                <Text style={styles.periodName}>{p.name}</Text>
                <Text style={styles.periodTime}>
                  {p.start_time?.slice(0, 5)} - {p.end_time?.slice(0, 5)}
                </Text>
              </View>
              <View style={styles.periodRight}>
                {slot ? (
                  <>
                    <Text style={styles.subjName}>
                      {slot.subject?.name || "Assigned"}
                    </Text>
                    <Text style={styles.subjCode}>
                      {slot.subject?.code || ""}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.freeText}>Free Period</Text>
                )}
              </View>
            </View>
          );
        })}

        {academicPeriods.length === 0 && (
          <Text style={styles.empty}>No periods configured</Text>
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
  dayRow: {
    flexDirection: "row",
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  dayChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#D1D5DB",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  dayChipActive: { backgroundColor: "#1A73E8", borderColor: "#1A73E8" },
  dayChipText: { fontSize: 12, fontWeight: "600", color: "#6B7280" },
  dayChipTextActive: { color: "#fff" },
  scroll: { padding: 16, paddingTop: 0 },
  periodCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  periodCardActive: { borderLeftWidth: 4, borderLeftColor: "#1A73E8" },
  periodLeft: { width: 70, marginRight: 12 },
  periodName: { fontSize: 14, fontWeight: "800", color: "#1A1A2E" },
  periodTime: { fontSize: 10, color: "#9CA3AF", marginTop: 2 },
  periodRight: { flex: 1 },
  subjName: { fontSize: 15, fontWeight: "600", color: "#1A1A2E" },
  subjCode: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  freeText: { fontSize: 14, color: "#9CA3AF", fontStyle: "italic" },
  lunchCard: {
    backgroundColor: "#FEF3C7",
    borderRadius: 14,
    padding: 16,
    marginBottom: 8,
    alignItems: "center",
  },
  lunchText: { fontSize: 14, fontWeight: "600", color: "#92400E" },
  empty: { textAlign: "center", color: "#9CA3AF", marginTop: 40, fontSize: 14 },
});
