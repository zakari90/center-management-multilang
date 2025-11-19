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

  const availableSubjects = [
    t('subjects.arabic'),
    t('subjects.french'),
    t('subjects.english'),
    t('subjects.amazigh'),
    t('subjects.math'),
    t('subjects.lifeEarth'),
    t('subjects.physicsChem'),
    t('subjects.scienceActivities'),
    t('subjects.historyGeo'),
    t('subjects.philosophy'),
    t('subjects.civic'),
    t('subjects.islamic'),
    t('subjects.computer'),
    t('subjects.technology'),
    t('subjects.economics'),
    t('subjects.accounting'),
    t('subjects.electrical'),
    t('subjects.mechanical'),
    t('subjects.art'),
    t('subjects.physical')
  ];

  const availableGrades = [
    t('grades.preschool1'),
    t('grades.preschool2'),
    t('grades.primary1'),
    t('grades.primary2'),
    t('grades.primary3'),
    t('grades.primary4'),
    t('grades.primary5'),
    t('grades.primary6'),
    t('grades.middle1'),
    t('grades.middle2'),
    t('grades.middle3'),
    t('grades.coreScience'),
    t('grades.coreLit'),
    t('grades.bac1Phys'),
    t('grades.bac1Life'),
    t('grades.bac1Lit'),
    t('grades.bac1Eco'),
    t('grades.bac2Phys'),
    t('grades.bac2Life'),
    t('grades.bac2Lit'),
    t('grades.bac2Eco'),
    t('grades.bac2Tech'),
    t('grades.bac2MathA'),
    t('grades.bac2MathB')
  ];

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

  return { daysOfWeek, availableSubjects, availableGrades, availableClassrooms, getRoomLabel, roomKeys, normalizeRoomId };
}