import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { useAuthStore } from "../contexts/AuthContext";
import { ToastProvider } from "../components/Toast";

import LoginScreen from "../screens/auth/LoginScreen";
import ProfileSetup from "../screens/auth/ProfileSetup";
import PendingApproval from "../screens/auth/PendingApproval";
import AdminNavigator from "./AdminNavigator";
import TeacherNavigator from "./TeacherNavigator";
import StudentNavigator from "./StudentNavigator";

const RootStack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, role, loading, initialize } = useAuthStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    (async () => {
      await initialize();
      setInitialized(true);
    })();
  }, []);

  if (!initialized || loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#1A73E8" />
      </View>
    );
  }

  return (
    <ToastProvider>
      <NavigationContainer>
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <RootStack.Screen name="Login" component={LoginScreen} />
          ) : role === "admin" ? (
            <RootStack.Screen name="AdminApp" component={AdminNavigator} />
          ) : role === "teacher" ? (
            <RootStack.Screen name="TeacherApp" component={TeacherNavigator} />
          ) : role === "verifier" ? (
            <RootStack.Screen name="AdminApp" component={AdminNavigator} />
          ) : (
            <>
              <RootStack.Screen name="StudentApp" component={StudentNavigator} />
              <RootStack.Screen name="ProfileSetup" component={ProfileSetup} />
              <RootStack.Screen name="PendingApproval" component={PendingApproval} />
            </>
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </ToastProvider>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F8F9FA" },
});
