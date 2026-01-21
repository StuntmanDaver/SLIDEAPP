import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

interface UseNetworkStatusResult {
  isConnected: boolean;
  isInternetReachable: boolean;
}

export function useNetworkStatus(): UseNetworkStatusResult {
  const [status, setStatus] = useState<UseNetworkStatusResult>({
    isConnected: true,
    isInternetReachable: true,
  });

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setStatus({
        isConnected: state.isConnected ?? true,
        isInternetReachable: state.isInternetReachable ?? true,
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return status;
}
