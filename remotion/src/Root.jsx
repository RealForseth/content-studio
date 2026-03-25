import { Composition } from "remotion";
import { JohannesVideo } from "./JohannesVideo";
import { MapalDemo } from "./MapalDemo";
import { VoxTitle } from "./VoxTitle";
import { ShortBrand } from "./ShortBrand";

export const RemotionRoot = () => {
  return (
    <>
      <Composition id="JohannesVideo" component={JohannesVideo} durationInFrames={782} fps={30} width={464} height={848} />
      <Composition id="MapalDemo" component={MapalDemo} durationInFrames={480} fps={30} width={1920} height={1080} />
      <Composition id="VoxTitle" component={VoxTitle} durationInFrames={240} fps={30} width={1920} height={1080} />
      <Composition id="ShortBrand" component={ShortBrand} durationInFrames={1350} fps={30} width={1080} height={1920} />
    </>
  );
};
