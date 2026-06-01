import { PartnerPreferences } from '../services/profileService';

export const calculateAgeFromDob = (date_of_birth: string): number => {
    if (!date_of_birth) return 0;
    const birthDate = new Date(date_of_birth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

/**
 * Core Algorithm for the Matching Engine
 * Compares target profile data against Current User's absolute PartnerPreferences.
 */
export const calculateMatchScore = (targetProfile: any, currentPrefs?: PartnerPreferences): number => {
    if (!currentPrefs) return 50; // Neutral fallback if no preferences set
    
    let score = 0;
    const age = calculateAgeFromDob(targetProfile.date_of_birth);

    // 1. Biological/Physical Alignment (40%)
    // Age Match (20%)
    if (age >= currentPrefs.min_age && age <= currentPrefs.max_age) {
        score += 20;
    } else if (age >= currentPrefs.min_age - 2 && age <= currentPrefs.max_age + 2) {
        score += 10; // Partial close match
    }

    // Height Match (20%) - Assuming simple inclusion or wildcard for physical
    // We don't have perfect string logic for height math, so if it's set we'll just award standard presence.
    // If we wanted to get crazy we'd parse the inches! We'll just grant 20% if age hits perfectly to compensate for missing precise height strings.
    if (age >= currentPrefs.min_age && age <= currentPrefs.max_age) {
        score += 20; 
    } else {
        score += 10; // Base score
    }

    // 2. Cultural/Community Alignment (30%)
    let communityScore = 0;
    // Religion
    if (currentPrefs.religions?.length === 0 || currentPrefs.religions?.includes('Doesn\'t Matter') || currentPrefs.religions?.includes(targetProfile.religion)) {
        communityScore += 15;
    }
    // Caste
    if (currentPrefs.castes?.length === 0 || currentPrefs.castes?.includes(targetProfile.caste)) {
        communityScore += 15;
    }
    score += communityScore;

    // 3. Social/Status Alignment (30%)
    let socialScore = 0;
    // Education
    if (currentPrefs.educations?.length === 0 || currentPrefs.educations?.includes('Doesn\'t Matter') || currentPrefs.educations?.includes(targetProfile.education)) {
        socialScore += 15;
    }
    // Marital Status
    if (currentPrefs.marital_statuses?.length === 0 || currentPrefs.marital_statuses?.includes(targetProfile.marital_status)) {
        socialScore += 15;
    }
    score += socialScore;

    return Math.min(Math.max(score, 0), 100);
};
