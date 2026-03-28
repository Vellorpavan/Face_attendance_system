import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TeacherDashboard from "../screens/teacher/TeacherDashboard";
import MarkAttendance from "../screens/teacher/MarkAttendance";
import TeacherTimetable from "../screens/teacher/TeacherTimetable";
import TeacherLeave from "../screens/teacher/TeacherLeave";

const Stack = createNativeStackNavigator();

export default function TeacherNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TeacherDashboard" component={TeacherDashboard} />
      <Stack.Screen name="MarkAttendance" component={MarkAttendance} />
      <Stack.Screen name="TeacherTimetable" component={TeacherTimetable} />
      <Stack.Screen name="TeacherLeave" component={TeacherLeave} />
    </Stack.Navigator>
  );
}
