export default {
  expo: {
    name: "SVPCET AI Attendance",
    slug: "collage-face",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#1A73E8",
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.svpcet.attendance",
      infoPlist: {
        NSCameraUsageDescription:
          "This app uses camera for face capture during attendance marking.",
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#1A73E8",
      },
      package: "com.svpcet.attendance",
      permissions: ["CAMERA"],
    },
    extra: {
      supabaseUrl: process.env.SUPABASE_URL,
      supabaseAnonKey: process.env.SUPABASE_ANON_KEY,
      eas: {
        projectId: "2ffe2176-3ca3-4cc2-9313-3d16cbc25d7a",
      },
    },
    plugins: [
      [
        "expo-build-properties",
        {
          android: {
            compileSdkVersion: 34,
            targetSdkVersion: 34,
            minSdkVersion: 24,
          },
          ios: {
            deploymentTarget: "15.1",
          },
        },
      ],
      [
        "expo-camera",
        {
          cameraPermission:
            "Allow SVPCET Attendance to access your camera for face capture.",
        },
      ],
    ],
  },
};
