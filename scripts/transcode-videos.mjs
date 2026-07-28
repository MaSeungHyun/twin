/**
 * 비디오 트랜스코딩
 * - 원본: src/assets/video/*.mp4 가 있으면 그걸 사용
 * - 없으면: 1080p/ 폴더를 소스로 사용
 *
 * 출력:
 * - 240p/  마커 썸네일용
 * - 720p/  모바일·태블릿 팝업
 * - 1080p/ 데스크톱 팝업
 *
 * 사용: npm run transcode:videos
 * 마커만: npm run transcode:videos -- --marker-only
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import ffmpegStatic from "ffmpeg-static";

const __dirname = dirname(fileURLToPath(import.meta.url));
const videoDir = join(__dirname, "../src/assets/video");
const ffmpeg = ffmpegStatic;
const markerOnly = process.argv.includes("--marker-only");

if (!ffmpeg || !existsSync(ffmpeg)) {
  console.error(
    "ffmpeg-static 바이너리를 찾을 수 없습니다. npm install을 실행하세요.",
  );
  process.exit(1);
}

const TIERS = [
  /** 오버레이 카드(~150px)용 — 디코드 부담 최소화 */
  { dir: "240p", maxW: 426, maxH: 240, crf: "30", audioKbps: "48k" },
  { dir: "720p", maxW: 1280, maxH: 720, crf: "23", audioKbps: "128k" },
  { dir: "1080p", maxW: 1920, maxH: 1080, crf: "23", audioKbps: "128k" },
];

function listMp4(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter(
    (name) => name.endsWith(".mp4") && !name.startsWith("."),
  );
}

function resolveSources() {
  const rootFiles = listMp4(videoDir);
  if (rootFiles.length > 0) {
    return rootFiles.map((file) => ({
      file,
      input: join(videoDir, file),
    }));
  }

  const fallbackDir = join(videoDir, "1080p");
  const files = listMp4(fallbackDir);
  if (files.length === 0) {
    console.error(
      `${videoDir} 또는 ${fallbackDir}에 mp4가 없습니다.`,
    );
    process.exit(1);
  }

  console.log("루트 원본 없음 → 1080p/ 를 소스로 사용");
  return files.map((file) => ({
    file,
    input: join(fallbackDir, file),
  }));
}

function transcode(input, output, { maxW, maxH, crf, audioKbps }) {
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
    crf,
    "-preset",
    "medium",
    "-c:a",
    "aac",
    "-b:a",
    audioKbps,
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

const sources = resolveSources();
const tiers = markerOnly
  ? TIERS.filter((t) => t.dir === "240p")
  : TIERS;

for (const tier of tiers) {
  mkdirSync(join(videoDir, tier.dir), { recursive: true });
}

console.log(
  `소스 ${sources.length}개 → ${tiers.map((t) => t.dir).join(" / ")} 변환 시작`,
);

for (const { file, input } of sources) {
  for (const tier of tiers) {
    const output = join(videoDir, tier.dir, file);
    // 같은 파일을 입·출력으로 쓰지 않음
    if (input === output) {
      console.log(`skip (동일 경로): ${output}`);
      continue;
    }
    transcode(input, output, tier);
  }
}

console.log("\n완료.");
