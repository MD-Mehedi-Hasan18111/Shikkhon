/**
 * Educational Institute Grading Scale Configuration
 *
 * Defaults to the National Education Board (NCTB / Ministry of Education, Bangladesh)
 * standard 7-tier grading system.
 * Configurable for institution-specific GPA or percentage bands.
 */

export interface GradeTier {
  grade: string;
  minPercentage: number;
  gpa: number;
  descriptionBn: string;
  descriptionEn: string;
  isPassed: boolean;
  colorClass: string;
  badgeVariant: "success" | "primary" | "warning" | "danger" | "default" | "gold";
}

/**
 * Standard Bangladeshi Secondary / Higher Secondary Board Grading Scale
 */
export const DEFAULT_BANGLADESH_GRADING_SCALE: GradeTier[] = [
  {
    grade: "A+",
    minPercentage: 80,
    gpa: 5.0,
    descriptionBn: "অসাধারণ (Outstanding)",
    descriptionEn: "Outstanding",
    isPassed: true,
    colorClass: "text-emerald-700 bg-emerald-50 border-emerald-200",
    badgeVariant: "success",
  },
  {
    grade: "A",
    minPercentage: 70,
    gpa: 4.0,
    descriptionBn: "অতি উত্তম (Excellent)",
    descriptionEn: "Excellent",
    isPassed: true,
    colorClass: "text-[#00636b] bg-[#eff8f9] border-[#d7eef1]",
    badgeVariant: "primary",
  },
  {
    grade: "A-",
    minPercentage: 60,
    gpa: 3.5,
    descriptionBn: "উত্তম (Very Good)",
    descriptionEn: "Very Good",
    isPassed: true,
    colorClass: "text-teal-700 bg-teal-50 border-teal-200",
    badgeVariant: "primary",
  },
  {
    grade: "B",
    minPercentage: 50,
    gpa: 3.0,
    descriptionBn: "সন্তোষজনক (Good)",
    descriptionEn: "Good",
    isPassed: true,
    colorClass: "text-amber-700 bg-amber-50 border-amber-200",
    badgeVariant: "gold",
  },
  {
    grade: "C",
    minPercentage: 40,
    gpa: 2.0,
    descriptionBn: "উত্তীর্ণ (Pass)",
    descriptionEn: "Pass",
    isPassed: true,
    colorClass: "text-yellow-700 bg-yellow-50 border-yellow-200",
    badgeVariant: "warning",
  },
  {
    grade: "D",
    minPercentage: 33,
    gpa: 1.0,
    descriptionBn: "নিম্ন উত্তীর্ণ (Below Average)",
    descriptionEn: "Below Average",
    isPassed: true,
    colorClass: "text-orange-700 bg-orange-50 border-orange-200",
    badgeVariant: "warning",
  },
  {
    grade: "F",
    minPercentage: 0,
    gpa: 0.0,
    descriptionBn: "অকৃতকার্য (Fail)",
    descriptionEn: "Fail",
    isPassed: false,
    colorClass: "text-rose-700 bg-rose-50 border-rose-200",
    badgeVariant: "danger",
  },
];

export interface GradeCalculationResult {
  grade: string;
  gpa: number;
  percentage: number;
  descriptionBn: string;
  descriptionEn: string;
  isPassed: boolean;
  badgeVariant: "success" | "primary" | "warning" | "danger" | "default" | "gold";
}

/**
 * Calculates grade, GPA, and pass status based on obtained and maximum marks.
 * Supports passing an optional custom grading scale to avoid hardcoded rules.
 */
export function calculateGradeAndGpa(
  obtainedMarks: number,
  maximumMarks: number,
  customScale: GradeTier[] = DEFAULT_BANGLADESH_GRADING_SCALE
): GradeCalculationResult {
  if (maximumMarks <= 0 || obtainedMarks < 0) {
    return {
      grade: "F",
      gpa: 0.0,
      percentage: 0,
      descriptionBn: "অকৃতকার্য (Fail)",
      descriptionEn: "Fail",
      isPassed: false,
      badgeVariant: "danger",
    };
  }

  // Ensure percentage is rounded to 2 decimal places
  const percentage = Math.min(
    100,
    Math.round((obtainedMarks / maximumMarks) * 100 * 100) / 100
  );

  // Find the highest matching tier (scale sorted descending by minPercentage)
  const sortedScale = [...customScale].sort((a, b) => b.minPercentage - a.minPercentage);
  const matched = sortedScale.find((tier) => percentage >= tier.minPercentage);

  if (matched) {
    return {
      grade: matched.grade,
      gpa: matched.gpa,
      percentage,
      descriptionBn: matched.descriptionBn,
      descriptionEn: matched.descriptionEn,
      isPassed: matched.isPassed,
      badgeVariant: matched.badgeVariant,
    };
  }

  return {
    grade: "F",
    gpa: 0.0,
    percentage,
    descriptionBn: "অকৃতকার্য (Fail)",
    descriptionEn: "Fail",
    isPassed: false,
    badgeVariant: "danger",
  };
}
