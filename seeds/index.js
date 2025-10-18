require('dotenv').config();
const axios = require('axios');
const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers');
const { cloudinary } = require('../cloudinary');

const sample = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 👉 usa la misma URL que tu app (Atlas). Si no existe, cae a localhost como fallback.
const dbUrl = process.env.DB_URL || 'mongodb://127.0.0.1:27017/yelp-camp';

(async () => {
  try {
    await mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Database connected');

    const { UNSPLASH_ACCESS_KEY, UNSPLASH_COLLECTION_ID } = process.env;

    const getUnsplashImages = async () => {
      const resp = await axios.get(
        `https://api.unsplash.com/collections/${UNSPLASH_COLLECTION_ID}/photos`,
        { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
      );
      return resp.data.map(img => `${img.urls.raw}&w=300&h=300&fit=crop`);
    };

    const uploadToCloudinary = async (imageUrl) => {
      const result = await cloudinary.uploader.upload(imageUrl, { folder: 'YelpCamp' });
      return { url: result.secure_url, filename: result.public_id };
    };

    await Campground.deleteMany({});

    const images = await getUnsplashImages();
    if (!images || images.length === 0) {
      console.error('⚠️ No images fetched from Unsplash. Aborting.');
      process.exit(1);
    }

    for (let i = 0; i < 50; i++) {
      const price = Math.floor(Math.random() * 20) + 10;
      const idx = Math.floor(Math.random() * cities.length);
      const uploadedImage = await uploadToCloudinary(images[i % images.length]);

      console.log(`Uploaded to Cloudinary: ${uploadedImage.url}`);

      await new Campground({
        author: '67c4c263334ea4566884bc37',    // usa un _id válido de tu colección users
        location: `${cities[idx].city}, ${cities[idx].state}`,
        title: `${sample(descriptors)} ${sample(places)}`,
        description: 'Seed de ejemplo',
        price,
        geometry: { type: 'Point', coordinates: [cities[idx].longitude, cities[idx].latitude] },
        images: [uploadedImage],
      }).save();
    }

    console.log('✅ Seed completado');
    await mongoose.connection.close();
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
})();
