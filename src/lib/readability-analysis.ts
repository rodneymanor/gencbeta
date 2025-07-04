import rs from "text-readability";

export interface ReadabilityScores {
  fleschReadingEase: number;
  fleschKincaidGrade: number;
  gunningFog: number;
  smogIndex: number;
  automatedReadabilityIndex: number;
  colemanLiauIndex: number;
  daleChallReadabilityScore: number;
  linsearWriteFormula: number;
  textStandard: string;
}

export interface ReadabilityAnalysis {
  scores: ReadabilityScores;
  statistics: {
    wordCount: number;
    sentenceCount: number;
    syllableCount: number;
    difficultWords: number;
    averageWordsPerSentence: number;
    averageSyllablesPerWord: number;
  };
  readabilityLevel: ReadabilityLevel;
  recommendations: string[];
}

export interface ReadabilityLevel {
  level: "Very Easy" | "Easy" | "Fairly Easy" | "Standard" | "Fairly Difficult" | "Difficult" | "Very Difficult";
  grade: string;
  description: string;
  color: string;
  score: number;
}

export function analyzeReadability(text: string): ReadabilityAnalysis {
  if (!text.trim()) {
    return {
      scores: {
        fleschReadingEase: 0,
        fleschKincaidGrade: 0,
        gunningFog: 0,
        smogIndex: 0,
        automatedReadabilityIndex: 0,
        colemanLiauIndex: 0,
        daleChallReadabilityScore: 0,
        linsearWriteFormula: 0,
        textStandard: "0th grade",
      },
      statistics: {
        wordCount: 0,
        sentenceCount: 0,
        syllableCount: 0,
        difficultWords: 0,
        averageWordsPerSentence: 0,
        averageSyllablesPerWord: 0,
      },
      readabilityLevel: {
        level: "Standard",
        grade: "0th grade",
        description: "No text to analyze",
        color: "gray",
        score: 0,
      },
      recommendations: [],
    };
  }

  // Calculate all readability scores
  const scores: ReadabilityScores = {
    fleschReadingEase: rs.fleschReadingEase(text),
    fleschKincaidGrade: rs.fleschKincaidGrade(text),
    gunningFog: rs.gunningFog(text),
    smogIndex: rs.smogIndex(text),
    automatedReadabilityIndex: rs.automatedReadabilityIndex(text),
    colemanLiauIndex: rs.colemanLiauIndex(text),
    daleChallReadabilityScore: rs.daleChallReadabilityScore(text),
    linsearWriteFormula: rs.linsearWriteFormula(text),
    textStandard: rs.textStandard(text),
  };

  // Calculate statistics
  const wordCount = rs.lexiconCount(text);
  const sentenceCount = rs.sentenceCount(text);
  const syllableCount = rs.syllableCount(text);
  const difficultWords = rs.difficultWords(text);

  const statistics = {
    wordCount,
    sentenceCount,
    syllableCount,
    difficultWords,
    averageWordsPerSentence: sentenceCount > 0 ? wordCount / sentenceCount : 0,
    averageSyllablesPerWord: wordCount > 0 ? syllableCount / wordCount : 0,
  };

  // Determine readability level based on Flesch Reading Ease
  const readabilityLevel = getReadabilityLevel(scores.fleschReadingEase);

  // Generate recommendations
  const recommendations = generateRecommendations(scores, statistics);

  return {
    scores,
    statistics,
    readabilityLevel,
    recommendations,
  };
}

function getReadabilityLevel(fleschScore: number): ReadabilityLevel {
  if (fleschScore >= 90) {
    return {
      level: "Very Easy",
      grade: "5th grade",
      description: "Easily understood by an average 11-year-old student",
      color: "green",
      score: fleschScore,
    };
  } else if (fleschScore >= 80) {
    return {
      level: "Easy",
      grade: "6th grade",
      description: "Conversational English for consumers",
      color: "emerald",
      score: fleschScore,
    };
  } else if (fleschScore >= 70) {
    return {
      level: "Fairly Easy",
      grade: "7th grade",
      description: "Easily understood by 13- to 15-year-old students",
      color: "lime",
      score: fleschScore,
    };
  } else if (fleschScore >= 60) {
    return {
      level: "Standard",
      grade: "8th-9th grade",
      description: "Plain English, easily understood by 13- to 15-year-old students",
      color: "yellow",
      score: fleschScore,
    };
  } else if (fleschScore >= 50) {
    return {
      level: "Fairly Difficult",
      grade: "10th-12th grade",
      description: "Fairly difficult to read",
      color: "orange",
      score: fleschScore,
    };
  } else if (fleschScore >= 30) {
    return {
      level: "Difficult",
      grade: "College level",
      description: "Difficult to read",
      color: "red",
      score: fleschScore,
    };
  } else {
    return {
      level: "Very Difficult",
      grade: "Graduate level",
      description: "Best understood by university graduates",
      color: "rose",
      score: fleschScore,
    };
  }
}

function getSentenceRecommendations(statistics: ReadabilityAnalysis["statistics"]): string[] {
  const recommendations: string[] = [];

  if (statistics.averageWordsPerSentence > 20) {
    recommendations.push("Consider breaking up long sentences. Aim for 15-20 words per sentence.");
  } else if (statistics.averageWordsPerSentence > 15) {
    recommendations.push("Good sentence length, but consider varying sentence structure.");
  }

  return recommendations;
}

function getVocabularyRecommendations(statistics: ReadabilityAnalysis["statistics"]): string[] {
  const recommendations: string[] = [];

  if (statistics.averageSyllablesPerWord > 1.7) {
    recommendations.push("Try using simpler words. Aim for 1.5 syllables per word for better readability.");
  }

  if (statistics.difficultWords > statistics.wordCount * 0.1) {
    recommendations.push("Reduce complex vocabulary. Consider simpler alternatives for difficult words.");
  }

  return recommendations;
}

function getScoreRecommendations(scores: ReadabilityScores): string[] {
  const recommendations: string[] = [];

  if (scores.fleschReadingEase < 60) {
    recommendations.push("Text is fairly difficult. Consider shorter sentences and simpler words.");
  } else if (scores.fleschReadingEase < 70) {
    recommendations.push("Good readability! Minor improvements could make it even more accessible.");
  }

  if (scores.fleschKincaidGrade > 12) {
    recommendations.push("Grade level is quite high. Consider simplifying for broader audience appeal.");
  } else if (scores.fleschKincaidGrade > 8) {
    recommendations.push("Grade level is appropriate for most audiences.");
  }

  if (scores.gunningFog > 12) {
    recommendations.push("Reduce complex words and long sentences to improve clarity.");
  }

  return recommendations;
}

function generateRecommendations(scores: ReadabilityScores, statistics: ReadabilityAnalysis["statistics"]): string[] {
  const recommendations: string[] = [];

  // Get recommendations from helper functions
  recommendations.push(...getSentenceRecommendations(statistics));
  recommendations.push(...getVocabularyRecommendations(statistics));
  recommendations.push(...getScoreRecommendations(scores));

  // Default recommendations if text is already good
  if (recommendations.length === 0) {
    recommendations.push("Great job! Your text has excellent readability.");
    recommendations.push("Consider adding more variety in sentence structure for engagement.");
  }

  return recommendations;
}

export function getReadabilityColor(score: number): string {
  if (score >= 90) return "text-green-600";
  if (score >= 80) return "text-emerald-600";
  if (score >= 70) return "text-lime-600";
  if (score >= 60) return "text-yellow-600";
  if (score >= 50) return "text-orange-600";
  if (score >= 30) return "text-red-600";
  return "text-rose-600";
}

export function getReadabilityBgColor(score: number): string {
  if (score >= 90) return "bg-green-100 border-green-200";
  if (score >= 80) return "bg-emerald-100 border-emerald-200";
  if (score >= 70) return "bg-lime-100 border-lime-200";
  if (score >= 60) return "bg-yellow-100 border-yellow-200";
  if (score >= 50) return "bg-orange-100 border-orange-200";
  if (score >= 30) return "bg-red-100 border-red-200";
  return "bg-rose-100 border-rose-200";
}
