import { useTranslations } from 'next-intl';

export function useLocalizedConstants() {
  const t = useTranslations('Common');

  const daysOfWeek = [
    { key: 'monday', label: t('daysOfWeek.monday') },
    { key: 'tuesday', label: t('daysOfWeek.tuesday') },
    { key: 'wednesday', label: t('daysOfWeek.wednesday') },
    { key: 'thursday', label: t('daysOfWeek.thursday') },
    { key: 'friday', label: t('daysOfWeek.friday') },
    { key: 'saturday', label: t('daysOfWeek.saturday') },
    { key: 'sunday', label: t('daysOfWeek.sunday') }
  ];

  // Subject keys (stored in DB) and their translated labels
  const subjectKeys = [
    'arabic',
    'french',
    'english',
    'amazigh',
    'math',
    'lifeEarth',
    'physicsChem',
    'scienceActivities',
    'historyGeo',
    'philosophy',
    'civic',
    'islamic',
    'computer',
    'technology',
    'economics',
    'accounting',
    'electrical',
    'mechanical',
    'art',
    'physical'
  ];

  const availableSubjects = subjectKeys.map(key => ({
    key,
    label: t(`subjects.${key}`)
  }));

  // Grade keys (stored in DB) and their translated labels
  const gradeKeys = [
    'preschool1',
    'preschool2',
    'primary1',
    'primary2',
    'primary3',
    'primary4',
    'primary5',
    'primary6',
    'middle1',
    'middle2',
    'middle3',
    'coreScience',
    'coreLit',
    'bac1Phys',
    'bac1Life',
    'bac1Lit',
    'bac1Eco',
    'bac2Phys',
    'bac2Life',
    'bac2Lit',
    'bac2Eco',
    'bac2Tech',
    'bac2MathA',
    'bac2MathB'
  ];

  const availableGrades = gradeKeys.map(key => ({
    key,
    label: t(`grades.${key}`)
  }));

  // Room keys (stored in DB) and their translated labels
  const roomKeys = [
    'room1',
    'room2',
    'room3',
    'room4',
    'room5',
    'room6',
    'classA',
    'classB',
    'lab1',
    'labComputer',
    'labScience',
    'library'
  ];

  const availableClassrooms = roomKeys.map(key => ({
    key,
    label: t(`classrooms.${key}`)
  }));

  // Helper function to get room label by key
  const getRoomLabel = (key: string): string => {
    const room = availableClassrooms.find(r => r.key === key);
    return room?.label || key;
  };

  // Helper function to normalize room ID (convert translated string to key if possible)
  const normalizeRoomId = (roomId: string): string => {
    // If it's already a key, return it
    if (roomKeys.includes(roomId)) {
      return roomId;
    }
    // Try to find matching key by comparing with translated labels
    const matchingRoom = availableClassrooms.find(r => r.label === roomId);
    return matchingRoom?.key || roomId; // Return key if found, otherwise return original (might be custom room)
  };

  // Helper function to get subject label by key or translated string
  const getSubjectLabel = (subjectName: string): string => {
    // If it's already a key, translate it
    if (subjectKeys.includes(subjectName)) {
      return t(`subjects.${subjectName}`);
    }
    // Try to find matching key by comparing with translated labels
    const matchingSubject = availableSubjects.find(s => s.label === subjectName);
    if (matchingSubject) {
      return t(`subjects.${matchingSubject.key}`);
    }
    // If not found, return original (might be custom subject name)
    return subjectName;
  };

  // Helper function to get grade label by key or translated string
  const getGradeLabel = (grade: string): string => {
    // If it's already a key, translate it
    if (gradeKeys.includes(grade)) {
      return t(`grades.${grade}`);
    }
    // Try to find matching key by comparing with translated labels
    const matchingGrade = availableGrades.find(g => g.label === grade);
    if (matchingGrade) {
      return t(`grades.${matchingGrade.key}`);
    }
    // If not found, return original (might be custom grade name)
    return grade;
  };

  // Helper function to normalize subject name (convert translated string to key if possible)
  const normalizeSubjectName = (subjectName: string): string => {
    // If it's already a key, return it
    if (subjectKeys.includes(subjectName)) {
      return subjectName;
    }
    // Try to find matching key by comparing with translated labels
    const matchingSubject = availableSubjects.find(s => s.label === subjectName);
    return matchingSubject?.key || subjectName; // Return key if found, otherwise return original
  };

  // Helper function to normalize grade (convert translated string to key if possible)
  const normalizeGrade = (grade: string): string => {
    // If it's already a key, return it
    if (gradeKeys.includes(grade)) {
      return grade;
    }
    // Try to find matching key by comparing with translated labels
    const matchingGrade = availableGrades.find(g => g.label === grade);
    return matchingGrade?.key || grade; // Return key if found, otherwise return original
  };

  return { 
    daysOfWeek, 
    availableSubjects, 
    availableGrades, 
    availableClassrooms, 
    getRoomLabel, 
    roomKeys, 
    normalizeRoomId,
    getSubjectLabel,
    getGradeLabel,
    normalizeSubjectName,
    normalizeGrade,
    subjectKeys,
    gradeKeys
  };
}