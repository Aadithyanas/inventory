import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Camera, useCameraDevices, useFrameProcessor } from "react-native-vision-camera";

import  createFrameProcessor  from "../../src/ai/frameProcessor";
import  {loadTFLite}  from "../../src/ai/tflite";

type DetectionResult = any;

export default function LiveDetectScreen() {

  const devices = useCameraDevices();
  const device = devices.back;

  const [detections, setDetections] = useState<DetectionResult[]>([]);

useEffect(() => {
  const init = async () => {
    await Camera.requestCameraPermission();
    await loadTFLite();
  };

  init();
}, []);

  const frameProcessor = useFrameProcessor(
    createFrameProcessor((res: DetectionResult[]) => {
      setDetections(res);
    }),
    []
  );

  if (!device) return <View style={{ flex: 1 }} />;

  return (
    <View style={styles.container}>
      <Camera
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        frameProcessor={frameProcessor}
        frameProcessorFps={5}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
});
