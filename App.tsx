import "./global.css";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  SpaceGrotesk_600SemiBold,
  SpaceGrotesk_700Bold,
} from "@expo-google-fonts/space-grotesk";
import { useAuthStore } from "@/store/authStore";
import RootNavigator from "@/navigation/RootNavigator";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function App() {
  const hydrate = useAuthStore((s) => s.hydrate);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const [ready, setReady] = useState(false);
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_700Bold,
  });

  useEffect(() => {
    (async () => {
      await hydrate();
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    if (ready && isHydrated && fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready, isHydrated, fontsLoaded]);

  if (!ready || !isHydrated || !fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <RootNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}