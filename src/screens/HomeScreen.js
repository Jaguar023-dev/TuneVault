import React, { useState, useRef } from "react";
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { AdMobBanner, AdMobInterstitial, AdMobRewarded } from "expo-ads-admob";
import PlayerControls from "../components/PlayerControls";

const BANNER_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB";
const INTERSTITIAL_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/IIIIIIIIII";
const REWARDED_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/RRRRRRRRRR";

export default function HomeScreen() {
  const [playlist, setPlaylist] = useState([]);
  const [current, setCurrent] = useState(null);
  const soundRef = useRef(new Audio.Sound());
  const [isPlaying, setIsPlaying] = useState(false);

  const pickAudio = async () => {
    const res = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
    if (res.type === "success") {
      const dest = FileSystem.documentDirectory + res.name;
      await FileSystem.copyAsync({ from: res.uri, to: dest });
      setPlaylist((p) => [...p, { uri: dest, name: res.name }]);
    }
  };

  const playTrack = async (track, index) => {
    try { await soundRef.current.unloadAsync(); } catch (e) {}
    soundRef.current = new Audio.Sound();

    try {
      await soundRef.current.loadAsync({ uri: track.uri });
      await soundRef.current.playAsync();
      setCurrent(index);
      setIsPlaying(true);

      soundRef.current.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (e) {
      console.log("Play error:", e);
    }
  };

  return (
    <View style={{ flex: 1, padding: 12 }}>
      <Text style={styles.header}>TuneVault</Text>

      <Button title="Add Audio File" onPress={pickAudio} />

      <FlatList
        data={playlist}
        keyExtractor={(item, i) => i.toString()}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.item} onPress={() => playTrack(item, index)}>
            <Text>{item.name}</Text>
          </TouchableOpacity>
        )}
      />

      <PlayerControls
        isPlaying={isPlaying}
        onPause={async () => {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        }}
        onPlay={async () => {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }}
      />

      <View style={{ position: "absolute", bottom: 0, left: 0, right: 0 }}>
        <AdMobBanner
          bannerSize="smartBannerPortrait"
          adUnitID={BANNER_ID}
          servePersonalizedAds
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: "#ddd" }
});
