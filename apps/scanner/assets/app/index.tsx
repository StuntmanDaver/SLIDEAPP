import { useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { StaffLoginScreen } from "../../components/StaffLoginScreen";

export default function LoginScreen() {
  const { isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isSignedIn) {
      router.replace("/scanner");
    }
  }, [isSignedIn]);

  return <StaffLoginScreen />;
}
