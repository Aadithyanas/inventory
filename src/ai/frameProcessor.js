import { runOnJS } from "react-native-worklets-core";
import { getTFLite } from "./tflite";

const createFrameProcessor = (onDetection) => {
  "worklet";

  return (frame) => {
    "worklet";

    try {
      const tflite = getTFLite();
      if (!tflite) return;

      const result = tflite.runModelOnFrame({
        bytes: frame,
        width: 320,
        height: 320,
        mean: 127.5,
        std: 127.5,
      });

      runOnJS(onDetection)(result);
    } catch (e) {}
  };
};

export default createFrameProcessor;
