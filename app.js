import React, { useEffect, useState, useRef } from "react";
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
import { Audio } from "expo-av";
import { AdMobBanner, AdMobInterstitial, AdMobRewarded } from "expo-ads-admob";

const ADMOB_APP_ID = "ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"; // <- REPLACE
const BANNER_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/BBBBBBBBBB";    // <- REPLACE
const INTERSTITIAL_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/IIIIIIIIII"; // <- REPLACE
const REWARDED_ID = "ca-app-pub-XXXXXXXXXXXXXXXX/RRRRRRRRRR"; // <- REPLACE

export default function App() {
  const [playlist, setPlaylist] = useState([]);
  const [current, setCurrent] = useState(null);
  const soundRef = useRef(new Audio.Sound());
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    AdMobInterstitial.setAdUnitID(INTERSTITIAL_ID);
    AdMobRewarded.setAdUnitID(REWARDED_ID);
    return () => { (async () => { try { await soundRef.current.unloadAsync(); } catch {} })(); };
  }, []);

  const pickAudio = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({ type: "audio/*" });
      if (res.type === "success") {
        const dest = `${FileSystem.documentDirectory}${res.name}`;
        await FileSystem.copyAsync({ from: res.uri, to: dest });
        setPlaylist(p => [...p, { uri: dest, name: res.name }]);
      }
    } catch (e) { console.error(e); }
  };

  const playTrack = async (track, index) => {
    try { await soundRef.current.unloadAsync(); } catch {}
    soundRef.current = new Audio.Sound();
    try {
      await soundRef.current.loadAsync({ uri: track.uri }, {}, true);
      setCurrent(index);
      await soundRef.current.playAsync();
      setIsPlaying(true);
      soundRef.current.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setIsPlaying(false);
          showInterstitial().catch(()=>{});
        }
      });
    } catch (e) { console.error("play error", e); }
  };

  const pause = async () => { try { await soundRef.current.pauseAsync(); setIsPlaying(false); } catch {} };
  const resume = async () => { try { await soundRef.current.playAsync(); setIsPlaying(true); } catch {} };

  const showInterstitial = async () => {
    try { await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true }); await AdMobInterstitial.showAdAsync(); }
    catch (e) { console.warn("Interstitial failed", e); }
  };

  const showRewarded = async () => {
    try {
      await AdMobRewarded.requestAdAsync();
      await AdMobRewarded.showAdAsync();
      AdMobRewarded.addEventListener("rewardedVideoUserDidEarnReward", () => {
        console.log("User earned reward");
      });
    } catch (e) { console.warn("Rewarded failed", e); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.header}>TuneVault</Text>

      <View style={{ marginVertical: 10 }}>
        <Button title="Add audio file" onPress={pickAudio} />
      </View>

      <FlatList
        data={playlist}
        keyExtractor={(item, i) => item.uri + i}
        renderItem={({ item, index }) => (
          <TouchableOpacity style={styles.item} onPress={() => playTrack(item, index)}>
            <Text numberOfLines={1}>{item.name}</Text>
            {current === index && <Text>{isPlaying ? "Playing" : "Paused"}</Text>}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: "center" }}>No tracks. Add one.</Text>}
      />

      <View style={styles.controls}>
        <Button title={isPlaying ? "Pause" : "Play"} onPress={isPlaying ? pause : resume} disabled={current === null} />
        <Button title="Rewarded Ad" onPress={showRewarded} />
        <Button title="Interstitial" onPress={showInterstitial} />
      </View>

      <View style={styles.banner}>
        <AdMobBanner
          bannerSize="smartBannerPortrait"
          adUnitID={BANNER_ID}
          servePersonalizedAds
          onDidFailToReceiveAdWithError={(err) => console.log("AdMob banner error", err)}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 12 },
  header: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  item: { padding: 12, borderBottomWidth: 1, borderColor: "#eee", flexDirection: "row", justifyContent: "space-between" },
  controls: { flexDirection: "row", justifyContent: "space-around", marginVertical: 12 },
  banner: { alignSelf: "stretch", position: "absolute", bottom: 0, left: 0, right: 0 }
});