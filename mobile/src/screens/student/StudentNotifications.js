import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../contexts/AuthContext";
import { supabase } from "../../config/supabase";
import { timeAgo } from "../../utils/helpers";

export default function StudentNotifications({ navigation }) {
  const { user, role } = useAuthStore();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    let query = supabase
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (role === "student") {
      query = query.or(
        `target_user_id.eq.${user?.id},target_role.eq.student,target_role.eq.all`
      );
    } else if (role === "teacher") {
      query = query.or(
        `target_user_id.eq.${user?.id},target_role.eq.teacher,target_role.eq.all`
      );
    }

    const { data, error } = await query;
    if (!error) setNotifications(data || []);
    setLoading(false);
    setRefreshing(false);
  }, [user, role]);

  useEffect(() => {
    loadNotifications();

    const channel = supabase
      .channel("notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
        },
        () => loadNotifications()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [loadNotifications]);

  const markAsRead = async (id) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const markAllRead = async () => {
    const unreadIds = notifications
      .filter((n) => !n.is_read)
      .map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .in("id", unreadIds);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const typeIcons = {
    announcement: "📢",
    success: "✅",
    warning: "⚠️",
    error: "❌",
  };

  const typeColors = {
    announcement: "#EFF6FF",
    success: "#D1FAE5",
    warning: "#FEF3C7",
    error: "#FEE2E2",
  };

  const renderItem = ({ item }) => {
    const bgColor = typeColors[item.type] || typeColors.announcement;
    const icon = typeIcons[item.type] || "📢";

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: item.is_read ? "#fff" : bgColor },
        ]}
        onPress={() => markAsRead(item.id)}
      >
        <View style={styles.cardIcon}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardMessage} numberOfLines={3}>
            {item.message}
          </Text>
          <Text style={styles.cardTime}>{timeAgo(item.created_at)}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
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
        <Text style={styles.title}>Notifications</Text>
        <TouchableOpacity onPress={markAllRead}>
          <Text style={styles.markAll}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNotifications();
            }}
          />
        }
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔔</Text>
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyDesc}>
              You'll see notifications here when you receive them.
            </Text>
          </View>
        }
      />
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
  markAll: { fontSize: 13, color: "#1A73E8", fontWeight: "600" },
  list: { padding: 16, paddingTop: 0 },
  card: {
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  cardIcon: { marginRight: 12, marginTop: 2 },
  icon: { fontSize: 22 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: "#1A1A2E", marginBottom: 4 },
  cardMessage: { fontSize: 13, color: "#374151", lineHeight: 20 },
  cardTime: { fontSize: 11, color: "#9CA3AF", marginTop: 6 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1A73E8",
    marginLeft: 8,
    marginTop: 6,
  },
  emptyContainer: { alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#1A1A2E", marginBottom: 8 },
  emptyDesc: { fontSize: 14, color: "#6B7280", textAlign: "center" },
});
