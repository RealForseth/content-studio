import { Composition } from "remotion";
import { JohannesVideo } from "./JohannesVideo";
import { MapalDemo } from "./MapalDemo";
import { VoxTitle } from "./VoxTitle";
import { ShortBrand } from "./ShortBrand";
import { VoxOverlay } from "./VoxOverlay";
import { JohannesSubs } from "./JohannesSubs";
import { Video02Subs } from "./Video02Subs";

export const RemotionRoot = () => {
  return (
    <>
      <Composition id="JohannesVideo" component={JohannesVideo} durationInFrames={782} fps={30} width={464} height={848} />
      <Composition id="MapalDemo" component={MapalDemo} durationInFrames={480} fps={30} width={1920} height={1080} />
      <Composition id="VoxTitle" component={VoxTitle} durationInFrames={240} fps={30} width={1920} height={1080} />
      <Composition id="ShortBrand" component={ShortBrand} durationInFrames={1350} fps={30} width={1080} height={1920} />
      <Composition id="VoxOverlay" component={VoxOverlay} durationInFrames={240} fps={30} width={1080} height={1920} />
      <Composition id="JohannesSubs" component={JohannesSubs} durationInFrames={1495} fps={30} width={720} height={1280} />
      <Composition id="Video02Subs" component={Video02Subs} durationInFrames={1636} fps={30} width={1080} height={1920} />
    </>
  );
};
