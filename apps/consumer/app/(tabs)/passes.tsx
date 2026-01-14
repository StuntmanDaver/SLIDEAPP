import { View, Text, FlatList, RefreshControl } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { usePasses } from "../../hooks/usePasses";
import { useAuth } from "../../hooks/useAuth";
import { FontAwesome } from "@expo/vector-icons";
import { format } from "date-fns"; // I might need to add date-fns, but for now I'll use simple JS dates

function PassCard({ pass, currentUserId }: { pass: any; currentUserId: string }) {
  const isReceived = pass.owner_user_id === currentUserId;
  const isSent = pass.issuer_user_id === currentUserId && !isReceived; // If sent to self, treat as received

  let statusColor = "bg-gray-200";
  let statusText = pass.status;
  let statusTextColor = "text-gray-700";

  if (pass.status === "created") {
    statusColor = "bg-blue-100";
    statusTextColor = "text-blue-800";
    statusText = "Awaiting Claim";
  } else if (pass.status === "claimed") {
    statusColor = "bg-green-100";
    statusTextColor = "text-green-800";
    statusText = "Ready to Use";
  } else if (pass.status === "redeemed") {
    statusColor = "bg-gray-100";
    statusTextColor = "text-gray-500";
    statusText = "Used";
  } else if (pass.status === "revoked" || pass.status === "expired") {
    statusColor = "bg-red-100";
    statusTextColor = "text-red-800";
    statusText = pass.status.charAt(0).toUpperCase() + pass.status.slice(1);
  }

  const date = new Date(pass.created_at).toLocaleDateString();

  return (
    <View className="bg-surface rounded-xl p-4 mb-4 shadow-control border border-border-hair">
      <View className="flex-row justify-between items-center mb-2">
        <View className="flex-row items-center">
          <View className={`w-8 h-8 rounded-full items-center justify-center mr-3 ${isReceived ? 'bg-lavender-secondary' : 'bg-gray-100'}`}>
            <FontAwesome name={isReceived ? "arrow-down" : "arrow-up"} size={14} color="#090908" />
          </View>
          <Text className="font-bold text-text-primary text-base">
            {isReceived ? "Received Pass" : "Sent Pass"}
          </Text>
        </View>
        <View className={`px-2 py-1 rounded-full ${statusColor}`}>
          <Text className={`text-xs font-bold ${statusTextColor}`}>{statusText}</Text>
        </View>
      </View>
      
      <View className="ml-11">
        <Text className="text-text-secondary text-sm mb-1">
          {date}
        </Text>
        <Text className="text-text-secondary text-xs">
          ID: ...{pass.pass_id.slice(-8)}
        </Text>
      </View>
    </View>
  );
}

export default function PassesScreen() {
  const { passes, isLoading, refetch } = usePasses();
  const { user } = useAuth();

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={["top"]}>
      <View className="px-6 py-4">
        <Text className="text-3xl font-bold text-text-primary">My Passes</Text>
      </View>

      <FlatList
        data={passes}
        keyExtractor={(item) => item.pass_id}
        renderItem={({ item }) => <PassCard pass={item} currentUserId={user?.id || ""} />}
        contentContainerStyle={{ padding: 24, paddingTop: 0 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
        ListEmptyComponent={
          !isLoading ? (
            <View className="items-center justify-center py-20 opacity-50">
              <FontAwesome name="ticket" size={48} color="#7D737B" />
              <Text className="text-text-secondary mt-4 text-center">
                No passes found.{'\n'}Buy a membership to start sending passes.
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}
