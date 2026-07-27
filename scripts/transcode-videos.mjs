/**
 * src/assets/video/*.mp4 원본을 720p / 1080p 폴더로 트랜스코딩합니다.
 * 원본보다 크게 늘리지 않습니다 (force_original_aspect_ratio=decrease).
 *
 * 사용: npm run transcode:videos
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import ffmpegStatic from "ffmpeg-static";

const __dirname = dirname(fileURLToPath(import.meta.url));
const videoDir = join(__dirname, "../src/assets/video");
const ffmpeg = ffmpegStatic;

if (!ffmpeg || !existsSync(ffmpeg)) {
  console.error("ffmpeg-static 바이너리를 찾을 수 없습니다. npm install을 실행하세요.");
  process.exit(1);
}

const TIERS = [
  { dir: "720p", maxW: 1280, maxH: 720 },
  { dir: "1080p", maxW: 1920, maxH: 1080 },
];

function transcode(input, output, maxW, maxH) {
  const vf = `scale='min(${maxW},iw)':'min(${maxH},ih)':force_original_aspect_ratio=decrease,format=yuv420p`;
  const args = [
    "-y",
    "-i",
    input,
    "-vf",
    vf,
    "-c:v",
    "libx264",
    "-crf",
    "23",
    "-preset",
    "medium",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-movflags",
    "+faststart",
    output,
  ];

  console.log(`\n→ ${output}`);
  const result = spawnSync(ffmpeg, args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`트랜스코딩 실패: ${output}`);
  }
}

const sources = readdirSync(videoDir).filter(
  (name) => name.endsWith(".mp4") && !name.startsWith("."),
);

if (sources.length === 0) {
  console.error(`${videoDir}에 mp4 원본이 없습니다.`);
  process.exit(1);
}

for (const tier of TIERS) {
  mkdirSync(join(videoDir, tier.dir), { recursive: true });
}

console.log(`원본 ${sources.length}개 → 720p / 1080p 변환 시작`);

for (const file of sources) {
  const input = join(videoDir, file);
  for (const tier of TIERS) {
    const output = join(videoDir, tier.dir, file);
    transcode(input, output, tier.maxW, tier.maxH);
  }
}

console.log("\n완료.");
