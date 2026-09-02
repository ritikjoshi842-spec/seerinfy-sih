// Mock image service — returns static images. Swap url for real generated-image endpoint later.
const IMAGES = [
  {
    id: 1,
    url: '/assets/mock-therapy-image-1.jpg',
    caption: 'A classroom in Chennai',
    year: '1988',
    location: 'Chennai, Tamil Nadu',
    prompt: 'Can you tell me what you see in this picture? What does it remind you of?',
  },
  {
    id: 2,
    url: '/assets/mock-therapy-image-1.jpg',
    caption: 'Morning at the village school',
    year: '1975',
    location: 'Shillong, Meghalaya',
    prompt: 'This looks like a special place. Have you ever visited somewhere like this?',
  },
  {
    id: 3,
    url: '/assets/mock-therapy-image-1.jpg',
    caption: 'Family gathering at harvest time',
    year: '1982',
    location: 'Kolkata, West Bengal',
    prompt: 'What memories does this image bring back for you?',
  },
];

export const mockImageService = {
  getImage: (index) => {
    return Promise.resolve(IMAGES[index % IMAGES.length]);
  },
  getAllImages: () => Promise.resolve(IMAGES),
};
