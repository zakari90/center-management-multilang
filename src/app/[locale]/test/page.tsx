'use client';

import React, { useEffect, useState } from 'react'

function Test() {
  const [first, setfirst] = useState()
  
  useEffect(() => {
    fetch('http://localhost:3000/api/db-ping', { method: 'POST' })
      .then(res => res.json())
      .then(data => setfirst(data))
      .catch(err => setfirst(err));
  }, []);

  return (
    <div>
      <pre>{JSON.stringify(first, null, 2)}</pre>
      Test
    </div>
  )
}

export default Test