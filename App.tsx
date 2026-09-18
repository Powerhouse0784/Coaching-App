import "./global.css";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useAuthStore } from "@/store/authStore";
import RootNavigator from "@/navigation/RootNavigator";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      await hydrate();
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready && isHydrated) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready, isHydrated]);

  if (!ready || !isHydrated) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}