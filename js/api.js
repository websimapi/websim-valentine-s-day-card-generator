export async function getValentineDescription() {
  try {
    const response = await fetch('/api/ai_completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Generate a creative valentine's day message with a cute or romantic theme. Include a title, heartfelt message, and a poetic description of the sentiment. The message should be sweet and appropriate for all ages. Each response should be unique and capture the spirit of Valentine's Day.

        interface Response {
          title: string;
          message: string;  
          type: string; // e.g. "Sweet", "Romantic", "Funny", "Friendly"
          style: string; // Visual theme/style suggestion
          color_scheme: string; // e.g. "Pink/Red", "Purple/Gold"
        }

        Example response (generate something different):
        {
          "title": "You Make My Heart Sparkle",
          "message": "Like stars that light up the night sky, your friendship brings sparkles of joy to my life. Happy Valentine's Day to someone truly special!",
          "type": "Sweet",
          "style": "Starry night with glittering hearts",
          "color_scheme": "Navy/Gold"
        }`,
        data: ""
      }),
    });
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching Valentine description:', error);
    return {
      title: 'Error',
      message: 'Failed to generate Valentine message',
      type: 'Error',
      style: 'Basic',
      color_scheme: 'Pink/Red'
    };
  }
}

export async function generateValentineImage(description) {
  try {
    const response = await fetch('/api/ai_completion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        prompt: `Generate a unique image URL for a Valentine's Day card based on this description: "${description}". Make it sweet and romantic, suitable for Valentine's Day. Return a URL to an image that matches the description and style.

        interface Response {
          imageUrl: string;
        }

        Example response (generate something different):
        {
          "imageUrl": "https://example.com/valentine-image.jpg"
        }`,
        data: description
      }),
    });
    const data = await response.json();
    return data.imageUrl;
  } catch (error) {
    console.error('Error generating Valentine image:', error);
    return null;
  }
}