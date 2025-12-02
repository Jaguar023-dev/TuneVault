// src/components/PlayerControls.js

import React from "react";
import { View, Button } from "react-native";

export default function PlayerControls({ isPlaying, onPlay, onPause }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-around",
        marginVertical: 20,
      }}
    >
      {isPlaying ? (
        <Button title="Pause" onPress={onPause} />
      ) : (
        <Button title="Play" onPress={onPlay} />
      )}
    </View>
  );
        }
