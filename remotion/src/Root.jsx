import { Composition } from "remotion";
import { JohannesVideo } from "./JohannesVideo";
import { MapalDemo } from "./MapalDemo";
import { RetroGlass } from "./RetroGlass";
import { VoxStyle } from "./VoxStyle";
import { RetroGlassV2 } from "./RetroGlassV2";
import { RetroPong } from "./RetroPong";
import { VoxTitle } from "./VoxTitle";
import { PersonalBrand } from "./PersonalBrand";
import { ShortBrand } from "./ShortBrand";
import { RisoShort } from "./RisoShort";
import { CollageVideo } from "./CollageVideo";

export const RemotionRoot = () => {
  return (
    <>
      <Composition
        id="PersonalBrand"
        component={PersonalBrand}
        durationInFrames={7398}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="JohannesVideo"
        component={JohannesVideo}
        durationInFrames={782}
        fps={30}
        width={464}
        height={848}
      />
      <Composition
        id="MapalDemo"
        component={MapalDemo}
        durationInFrames={480}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RetroGlass"
        component={RetroGlass}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VoxStyle"
        component={VoxStyle}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RetroGlassV2"
        component={RetroGlassV2}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="RetroPong"
        component={RetroPong}
        durationInFrames={540}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="VoxTitle"
        component={VoxTitle}
        durationInFrames={240}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="ShortBrand"
        component={ShortBrand}
        durationInFrames={1350}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="RisoShort"
        component={RisoShort}
        durationInFrames={960}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="CollageVideo"
        component={CollageVideo}
        durationInFrames={900}
        fps={30}
        width={1280}
        height={720}
      />
    </>
  );
};
