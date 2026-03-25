# Remotion Project Setup

## Creating a new Remotion project for Carl

```bash
mkdir -p carl-render && cd carl-render
npm init -y
npm install remotion @remotion/cli @remotion/bundler @remotion/google-fonts react react-dom
```

## Required system dependencies (for headless Chrome rendering)

```bash
sudo apt-get install -y libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 \
  libcups2 libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxrandr2 \
  libgbm1 libpango-1.0-0 libcairo2 libasound2t64 libxshmfence1
```

## Root.jsx template

```jsx
import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

export const RemotionRoot = () => (
  <Composition
    id="MainVideo"
    component={MainVideo}
    durationInFrames={900} // adjust to video length * 30
    fps={30}
    width={1920}  // or 464 for vertical
    height={1080} // or 848 for vertical
  />
);
```

## index.js

```js
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";
registerRoot(RemotionRoot);
```

## remotion.config.js

```js
const { Config } = require("@remotion/cli/config");
Config.setEntryPoint("./src/index.js");
```

## Loading Google Fonts

```jsx
import { loadFont } from "@remotion/google-fonts/Inter";
import { loadFont as loadPlayfair } from "@remotion/google-fonts/PlayfairDisplay";
import { loadFont as loadSpace } from "@remotion/google-fonts/SpaceGrotesk";

const { fontFamily: interFont } = loadFont("normal", { weights: ["900"], subsets: ["latin"] });
const { fontFamily: serifFont } = loadPlayfair("normal", { weights: ["400", "700", "900"], subsets: ["latin"] });
const { fontFamily: monoFont } = loadSpace("normal", { weights: ["300", "500", "700"], subsets: ["latin"] });
```

## Rendering

```bash
npx remotion render MainVideo out/final.mp4 --concurrency=2
```

For higher quality (slower):
```bash
npx remotion render MainVideo out/final.mp4 --concurrency=1 --codec=h264 --crf=15
```
