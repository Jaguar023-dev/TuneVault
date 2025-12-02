// src/components/PlayerControls.js

import React, { useState, useEffect, useRef } from "react";
import { View, TouchableOpacity, Text, Alert, StyleSheet, Animated } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { Audio } from "expo-av";
import * as Animatable from "react-native-animatable";

export default function PlayerControls() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);
  const barAnimations = useRef([...Array(5)].map(() => new Animated.Value(1))).current;

  const animateBars = () => {
    if (!isPlaying) return;
    const animations = barAnimations.map(bar =>
      Animated.sequence([
        Animated.timing(bar, { toValue: Math.random() * 1.5 + 0.5, duration: 300, useNativeDriver: true }),
        Animated.timing(bar, { toValue: 1, duration: 300, useNativeDriver: true }),
      ])
    );
    Animated.stagger(100, animations).start(() => animateBars());
  };

  useEffect(() => {
    if (isPlaying) animateBars();
  }, [isPlaying]);

  const pickMusic = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: "audio/*" });

      if (result.type === "success") {
        if (sound) await sound.unloadAsync();

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: result.uri },
          { shouldPlay: false }
        );
        setSound(newSound);
        Alert.alert("Music Imported!", result.name);
      }
    } catch (error) {
      console.error("Error picking music:", error);
    }
  };

  const handlePlay = async () => {
    if (sound) {
      await sound.playAsync();
      setIsPlaying(true);
    } else {
      Alert.alert("No music imported", "Please import a track first.");
    }
  };

  const handlePause = async () => {
    if (sound) {
      await sound.pauseAsync();
      setIsPlaying(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.importButton} onPress={pickMusic}>
        <Text style={styles.buttonText}>Import Music</Text>
      </TouchableOpacity>

      <View style={styles.waveformContainer}>
        {barAnimations.map((bar, index) => (
          <Animated.View
            key={index}
            style={[
              styles.bar,
              { transform: [{ scaleY: bar }] },
              isPlaying ? styles.playingBar : styles.pausedBar,
            ]}
          />
        ))}
      </View>

      <Animatable.View animation={isPlaying ? "pulse" : undefined} iterationCount="infinite">
        <TouchableOpacity
          style={[styles.playButton, isPlaying ? styles.playing : styles.paused]}
          onPress={isPlaying ? handlePause : handlePlay}
        >
          <Text style={styles.buttonText}>{isPlaying ? "Pause" : "Play"}</Text>
        </TouchableOpacity>
      </Animatable.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    marginVertical: 20,
  },
  importButton: {
    backgroundColor: "#4CAF50",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 10,
  },
  playButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 50,
    marginTop: 10,
  },
  playing: { backgroundColor: "#F44336" },
  paused: { backgroundColor: "#2196F3" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  waveformContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 120,
    height: 40,
    marginVertical: 10,
    alignItems: "center",
  },
  bar: {
    width: 10,
    height: 20,
    borderRadius: 5,
    backgroundColor: "#2196F3",
  },
  playingBar: { backgroundColor: "#F44336" },
  pausedBar: { backgroundColor: "#2196F3" },
});