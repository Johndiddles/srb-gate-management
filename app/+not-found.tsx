import { Link, Stack } from "expo-router";
import { Text, View } from "react-native";

export default function NotFoundScreen() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      {/* Set the screen title */}
      <Stack.Screen options={{ title: "Oops! Not Found" }} />
      <Text>This screen does not exist.</Text>
      {/* Provide a link back to the home page */}
      <Link href="/">Go to home screen</Link>
    </View>
  );
}
