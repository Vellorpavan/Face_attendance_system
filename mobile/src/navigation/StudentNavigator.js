import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import StudentDashboard from "../screens/student/StudentDashboard";
import AttendanceHistory from "../screens/student/AttendanceHistory";
import StudentNotifications from "../screens/student/StudentNotifications";

const Stack = createNativeStackNavigator();

export default function StudentNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StudentDashboard" component={StudentDashboard} />
      <Stack.Screen name="AttendanceHistory" component={AttendanceHistory} />
      <Stack.Screen name="StudentNotifications" component={StudentNotifications} />
    </Stack.Navigator>
  );
}
