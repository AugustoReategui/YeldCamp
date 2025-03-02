require('dotenv').config(); // Carga las variables de entorno desde el archivo .env
const axios = require('axios');
const mongoose = require('mongoose');
const Campground = require('../models/campground'); // Asumiendo que ya tienes este modelo
const { UNSPLASH_ACCESS_KEY, UNSPLASH_COLLECTION_ID } = process.env; // Extraemos las claves del archivo .env
const cities = require('./cities');
const { places, descriptors } = require('./seedHelpers'); 
const sample = array => array[Math.floor(Math.random() * array.length)]; // Función para obtener un elemento aleatorio de un array

// Conexión a MongoDB
mongoose.connect('mongodb://localhost:27017/yelp-camp', {

})
.then(() => console.log('Database connected'))
.catch(err => console.log('Database connection error:', err));

// Función para obtener imágenes de una colección de Unsplash
const getUnsplashImages = async () => {
  try {
    const response = await axios.get(`https://api.unsplash.com/collections/${UNSPLASH_COLLECTION_ID}/photos`, {
      headers: {
        Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}`,
      },
    });
    return response.data.map(image => `${image.urls.raw}&w=400&h=400&fit=crop`); // Solo devolvemos las URLs de las imágenes
  } catch (error) {
    console.error('Error fetching images from Unsplash:', error);
  }
};

// Función para sembrar la base de datos con imágenes de Unsplash
const seedDB = async () => {
  const images = await getUnsplashImages(); // Obtén imágenes desde Unsplash

  // Limpia la colección de campamentos en la base de datos
  await Campground.deleteMany({});

  // Crea nuevos campamentos con imágenes de Unsplash
  for (let i = 0; i < 50; i++) {
    const price = Math.floor(Math.random() * 20) + 10;
    const randomIndex = Math.floor(Math.random() * cities.length); // Generar índice aleatorio
    const image = images.length > 0 ? images[i % images.length] : 'URL_IMAGEN_POR_DEFECTO';
    const camp = new Campground({
      author : '67c4c263334ea4566884bc37',
      location: `${cities[randomIndex].city}, ${cities[randomIndex].state}`, // Usamos las ciudades de la colección
      title: `${sample(descriptors)} ${sample(places)}`, // Usamos los adjetivos y lugares de la colección
      image: images[i % images.length], // Usamos las imágenes de la colección
      description: 'Lorem ipsum dolor sit amet consectetur adipisicing elit. Quibusdam dolores vero perferendis laudantium, consequuntur voluptatibus nulla architecto, sit soluta esse iure sed labore ipsam a cum nihil atque molestiae deserunt!',
      price,
    });
    await camp.save();
  }
  console.log('Database seeded!');
};

// Llamar a la función de siembra de base de datos
seedDB().then(() => {
  mongoose.connection.close(); // Cerrar la conexión a la base de datos
});
