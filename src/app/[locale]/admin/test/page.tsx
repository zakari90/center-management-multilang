"use client" // remove if not used in browser

import db from "@/lib/db";
import { faker } from "@faker-js/faker";
import React, { useState } from 'react'


function getFakeCenter() {
    return {
      name: faker.company.name(),
      address: faker.location.streetAddress(),
      phone: faker.phone.number(),
      classrooms: Array.from({ length: 5 }, () => faker.string.alpha(5)),
      workingDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      managers: [faker.string.uuid()],
      adminId: faker.string.uuid(), // Replace with real ObjectId if possible
    };
  }

function Page() {
  return (
    <div><CenterFakeButton/></div>
  )
}

export default Page



const CenterFakeButton= () => {
  const [result, setResult] = useState("");

  async function handleSend() {
    const data = getFakeCenter();
    try {
      const res = await db.center.create({ data });
      setResult("Success: " + JSON.stringify(res));
    } catch (err) {
      setResult("Error: " + (err instanceof Error ? err.message : "Unknown"));
    }
  }

  return (
    <div>
      <button onClick={handleSend}>Send Direct Fake Center</button>
      {result && <pre>{result}</pre>}
    </div>
  );
};
