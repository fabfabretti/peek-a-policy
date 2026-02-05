/**
 * utils/readabilityUtils.tsx
 *
 * This function contains functions to compute Flesh Kincaid score.
 */

import { syllable } from "syllable";

export type ReadabilityInfo = {
  ease: number;
  grade: number;
  label: string;
};

export function computeReadabilityInfo(text: string): ReadabilityInfo {
  const ease = Number(fleschReadingEase(text).toFixed(2));
  const grade = Number(fleschKincaidGrade(text).toFixed(2));
  const label = getEaseLabel(ease);
  return { ease, grade, label };
}

// Flesch Reading Ease
function fleschReadingEase(text: string): number {
  const { wordCount, sentenceCount, syllableCount } = countTextStats(text);
  return (
    206.835 -
    1.015 * (wordCount / sentenceCount) -
    84.6 * (syllableCount / wordCount)
  );
}

// Flesch–Kincaid Grade Level
function fleschKincaidGrade(text: string): number {
  const { wordCount, sentenceCount, syllableCount } = countTextStats(text);
  return (
    0.39 * (wordCount / sentenceCount) +
    11.8 * (syllableCount / wordCount) -
    15.59
  );
}

// Statistiche di base
function countTextStats(text: string) {
  const sentences = text.split(/[.!?]+/).filter(Boolean);
  const sentenceCount = Math.max(sentences.length, 1);

  const wordList = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = wordList.length;

  const syllableCount = wordList.reduce((sum, word) => sum + syllable(word), 0);

  return { wordCount, sentenceCount, syllableCount };
}

// Etichetta leggibilità
function getEaseLabel(score: number): string {
  if (score >= 90) return "very easy";
  if (score >= 80) return "easy";
  if (score >= 70) return "fairly easy";
  if (score >= 60) return "standard";
  if (score >= 50) return "fairly difficult";
  if (score >= 30) return "difficult";
  return "very difficult";
}
