import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../contexts/AuthContext";

export default function PendingApproval() {
  const { signOut } = useAuthStore();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.inner}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>⏳</Text>
        </View>
        <Text style={styles.title}>Pending Approval</Text>
        <Text style={styles.desc}>
          Your profile has been submitted and is awaiting approval from the
          admin. You will be notified once approved.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={signOut}>
          <Text style={styles.btnText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F0F4F8" },
  inner: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#FEF3C7",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  icon: { fontSize: 36 },
  title: { fontSize: 22, fontWeight: "700", color: "#1A1A2E", marginBottom: 12 },
  desc: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 30,
  },
  btn: {
    backgroundColor: "#EF4444",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
  },
  btnText: { color: "#fff", fontSize: 15, fontWeight: "600" },
});
