import React, { useState } from "react";
import { Keyboard, StyleProp, View, ViewStyle } from "react-native";
import { Menu, TextInput } from "react-native-paper";

interface Props extends React.ComponentProps<typeof TextInput> {
  suggestions: string[];
  containerStyle?: StyleProp<ViewStyle>;
}

export default function AutocompleteInput({
  suggestions,
  value,
  onChangeText,
  containerStyle,
  ...props
}: Props) {
  const [menuVisible, setMenuVisible] = useState(false);

  // Filter suggestions
  const filterSuggestions = (text: string) => {
    if (!text) return [];
    const lowerText = text.toLowerCase();

    // Use a Set to ensure unicity if suggestions array has duplicates
    const uniqueMatches = Array.from(
      new Set(
        suggestions.filter(
          (s) => s.toLowerCase().includes(lowerText) && s !== text,
        ),
      ),
    );

    return uniqueMatches.slice(0, 5);
  };

  const filteredSuggestions = filterSuggestions(value || "");
  const showMenu = menuVisible && filteredSuggestions.length > 0;

  return (
    <View style={containerStyle}>
      <Menu
        visible={showMenu}
        onDismiss={() => setMenuVisible(false)}
        anchor={
          <TextInput
            value={value}
            onChangeText={(text) => {
              onChangeText?.(text);
              setMenuVisible(true);
            }}
            onFocus={(e) => {
              props.onFocus?.(e);
              setMenuVisible(true);
            }}
            {...props}
          />
        }
        style={{ paddingTop: 56 }} // Helps position nicely below standard text inputs in some versions
      >
        {filteredSuggestions.map((suggestion, index) => (
          <Menu.Item
            key={index}
            onPress={() => {
              onChangeText?.(suggestion);
              setMenuVisible(false);
              Keyboard.dismiss();
            }}
            title={suggestion}
          />
        ))}
      </Menu>
    </View>
  );
}
