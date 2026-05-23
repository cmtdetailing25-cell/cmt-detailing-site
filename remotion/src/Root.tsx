import { Composition } from "remotion";
import { CMTBeforeAfterReel } from "./CMTBeforeAfterReel";
import type { CMTReelProps } from "./types";
import sampleProps from "./sample-props.json";

export function RemotionRoot() {
  return (
    <Composition
      id="CMTBeforeAfterReel"
      component={CMTBeforeAfterReel}
      durationInFrames={450}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={sampleProps as CMTReelProps}
    />
  );
}
