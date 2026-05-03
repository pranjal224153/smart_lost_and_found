async function testML() {
  console.log("Testing ML service...");
  try {
    const response = await fetch('https://smart-lost-and-found-1.onrender.com/match', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        item: {
          id: "1",
          title: "lost apple airpods",
          description: "white airpods in a black case",
          category: "Electronics",
          image_url: ""
        },
        candidates: [
          {
            id: "2",
            title: "found white apple airpods",
            description: "found these airpods in a black case near the library",
            category: "Electronics",
            image_url: ""
          }
        ]
      })
    });
    
    if (!response.ok) {
        console.error("HTTP Error:", response.status, response.statusText);
        return;
    }
    
    const data = await response.json();
    console.log("Match results:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error:", err.message);
  }
}

testML();
