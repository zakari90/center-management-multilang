/* eslint-disable @typescript-eslint/no-explicit-any */
import { centerActions, subjectActions } from "@/lib/dexie/dexieActions";
import { Center, Subject } from "@/lib/dexie/dbSchema";
import { generateObjectId } from "@/lib/utils/generateObjectId";
import ServerActionCenters from "@/lib/dexie/centerServerAction";
import ServerActionSubjects from "@/lib/dexie/subjectServerAction";
import { isOnline } from "@/lib/utils/network";

// Fake data generators
const fakeCenterNames = [
  "Elite Learning Center",
  "Bright Minds Academy",
  "Success Education Hub",
  "Knowledge Center",
  "Excellence Institute",
  "Future Leaders School",
  "Smart Learning Center",
  "Achievement Academy"
];

const fakeAddresses = [
  "123 Education Street, Casablanca",
  "456 Learning Avenue, Rabat",
  "789 Knowledge Road, Marrakech",
  "321 Success Boulevard, Fes",
  "654 Excellence Lane, Tangier"
];

const fakePhones = [
  "+212 6 12 34 56 78",
  "+212 6 23 45 67 89",
  "+212 6 34 56 78 90",
  "+212 6 45 67 89 01",
  "+212 6 56 78 90 12"
];

const fakeClassrooms = [
  "Room A1", "Room A2", "Room B1", "Room B2", "Room C1", 
  "Room C2", "Lab 1", "Lab 2", "Conference Room", "Study Hall"
];

const subjectsData = [
  { name: "Mathematics", grade: "Primary", price: 300, duration: 60 },
  { name: "Arabic", grade: "Primary", price: 250, duration: 60 },
  { name: "French", grade: "Primary", price: 250, duration: 60 },
  { name: "English", grade: "Primary", price: 250, duration: 60 },
  { name: "Science", grade: "Primary", price: 300, duration: 60 },
  { name: "Mathematics", grade: "Middle", price: 350, duration: 90 },
  { name: "Physics", grade: "Middle", price: 400, duration: 90 },
  { name: "Chemistry", grade: "Middle", price: 400, duration: 90 },
  { name: "Biology", grade: "Middle", price: 350, duration: 90 },
  { name: "Mathematics", grade: "High School", price: 450, duration: 120 },
  { name: "Physics", grade: "High School", price: 500, duration: 120 },
  { name: "Chemistry", grade: "High School", price: 500, duration: 120 },
];

const workingDaysOptions = [
  "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"
];

/**
 * Creates a fake center with fake data for testing
 * @param adminId - The admin user ID (required)
 * @param options - Optional configuration
 * @returns The created center ID
 */
export async function createFakeCenter(
  adminId: string,
  options?: {
    name?: string;
    numSubjects?: number;
    numClassrooms?: number;
    workingDays?: string[];
    syncToServer?: boolean;
  }
): Promise<string> {
  if (!adminId) {
    throw new Error("Admin ID is required to create a center");
  }

  const centerId = generateObjectId();
  const now = Date.now();

  // Generate random center data
  const randomName = options?.name || fakeCenterNames[Math.floor(Math.random() * fakeCenterNames.length)];
  const randomAddress = fakeAddresses[Math.floor(Math.random() * fakeAddresses.length)];
  const randomPhone = fakePhones[Math.floor(Math.random() * fakePhones.length)];
  
  // Generate classrooms (3-6 random classrooms)
  const numClassrooms = options?.numClassrooms || Math.floor(Math.random() * 4) + 3;
  const selectedClassrooms = fakeClassrooms
    .sort(() => Math.random() - 0.5)
    .slice(0, numClassrooms);

  // Generate working days (5-7 days)
  const numWorkingDays = options?.workingDays?.length || Math.floor(Math.random() * 3) + 5;
  const selectedWorkingDays = options?.workingDays || workingDaysOptions
    .sort(() => Math.random() - 0.5)
    .slice(0, numWorkingDays);

  // Generate subjects (4-8 random subjects)
  const numSubjects = options?.numSubjects || Math.floor(Math.random() * 5) + 4;
  const selectedSubjects = subjectsData
    .sort(() => Math.random() - 0.5)
    .slice(0, numSubjects);

  // Create center
  const newCenter: Center = {
    id: centerId,
    name: randomName,
    address: randomAddress,
    phone: randomPhone,
    classrooms: selectedClassrooms,
    workingDays: selectedWorkingDays,
    managers: [],
    adminId: adminId,
    status: 'w', // Waiting to sync
    createdAt: now,
    updatedAt: now,
  };

  // Save center to local DB
  await centerActions.putLocal(newCenter);

  // Create subjects
  const subjectEntities: Subject[] = selectedSubjects.map(subject => ({
    id: generateObjectId(),
    name: subject.name,
    grade: subject.grade,
    price: subject.price,
    duration: subject.duration,
    centerId: centerId,
    status: 'w', // Waiting to sync
    createdAt: now,
    updatedAt: now,
  }));

  // Save all subjects to local DB
  if (subjectEntities.length > 0) {
    await Promise.all(
      subjectEntities.map(subject => subjectActions.putLocal(subject))
    );
  }

  // Sync to server if online and requested
  const shouldSync = options?.syncToServer !== false && isOnline();
  if (shouldSync) {
    try {
      // Sync center
      await ServerActionCenters.SaveToServer(newCenter);
      await centerActions.markSynced(centerId);

      // Sync all subjects
      await Promise.all(
        subjectEntities.map(async (subject) => {
          await ServerActionSubjects.SaveToServer(subject);
          await subjectActions.markSynced(subject.id);
        })
      );

      console.log(`✅ Fake center "${randomName}" created and synced to server`);
    } catch (syncError) {
      console.warn('⚠️ Failed to sync fake center to server (saved locally):', syncError);
    }
  } else {
    console.log(`✅ Fake center "${randomName}" created locally (will sync when online)`);
  }

  return centerId;
}

/**
 * Creates multiple fake centers for testing
 * @param adminId - The admin user ID
 * @param count - Number of centers to create
 * @param options - Optional configuration
 * @returns Array of created center IDs
 */
export async function createMultipleFakeCenters(
  adminId: string,
  count: number = 3,
  options?: {
    syncToServer?: boolean;
  }
): Promise<string[]> {
  const centerIds: string[] = [];

  for (let i = 0; i < count; i++) {
    const centerId = await createFakeCenter(adminId, {
      ...options,
      numSubjects: Math.floor(Math.random() * 5) + 4,
      numClassrooms: Math.floor(Math.random() * 4) + 3,
    });
    centerIds.push(centerId);
  }

  return centerIds;
}

