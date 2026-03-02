import { Stack } from "expo-router";

const GuestLayout = () => {
  return (
    <Stack>
      <Stack.Screen name="[id]" options={{ title: "Guest Details" }} />
    </Stack>
  );
};

export default GuestLayout;
