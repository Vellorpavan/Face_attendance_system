import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import AdminDashboard from "../screens/admin/AdminDashboard";
import TimetableBuilder from "../screens/admin/TimetableBuilder";
import ManageTeachers from "../screens/admin/ManageTeachers";
import NotificationHub from "../screens/admin/NotificationHub";
import AttendanceViewer from "../screens/admin/AttendanceViewer";
import ManageStudents from "../screens/admin/ManageStudents";

const Stack = createNativeStackNavigator();

export default function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDashboard" component={AdminDashboard} />
      <Stack.Screen name="TimetableBuilder" component={TimetableBuilder} />
      <Stack.Screen name="ManageTeachers" component={ManageTeachers} />
      <Stack.Screen name="NotificationHub" component={NotificationHub} />
      <Stack.Screen name="AttendanceViewer" component={AttendanceViewer} />
      <Stack.Screen name="ManageStudents" component={ManageStudents} />
    </Stack.Navigator>
  );
}
