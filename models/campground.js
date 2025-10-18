const mongoose = require('mongoose');
const Review = require('./review');
const { func } = require('joi');
const mongooseLeanVirtuals = require('mongoose-lean-virtuals');
const Schema = mongoose.Schema;


const ImageSchema = new Schema({
  url: String,
  filename: String
});

ImageSchema.virtual('thumbnail').get(function() {
  return this.url.replace('/upload', '/upload/w_300');
});

ImageSchema.plugin(mongooseLeanVirtuals);

const opts = { 
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
};

const CampgroundSchema = new Schema({
  title: String,
  images: [ImageSchema],
  geometry: {
    type: {
      type: String, // 'Point'
      enum: ['Point'],
      required: true
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  price: Number,
  description: String,
  location: String,
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  reviews: [
    {
      type: Schema.Types.ObjectId,
      ref: 'Review'
    }
  ]
}, opts);


CampgroundSchema.virtual('properties.popUpMarkup').get(function () {
  const first = this.images?.[0];
  const thumb = first?.url ? first.url.replace('/upload', '/upload/w_300') : '';
  const price = (this.price != null) ? `$${this.price}/night` : '';
  const location = this.location || '';

 return `
    <div class="map-popup">
      ${thumb ? `<img src="${thumb}" alt="${this.title}" style="width:90px;max-width:50%;border-radius:8px;margin-bottom:6px;">` : ''}
      <strong><a href="/campgrounds/${this._id}">${this.title}</a></strong>
      <div style="font-size:12px;color:#888;margin-top:2px;">${location}</div>
      <div style="margin-top:4px;font-weight:600;">${price}</div>
    </div>
  `;
});

// ⬅️ aplica el plugin después de declarar el schema
CampgroundSchema.plugin(mongooseLeanVirtuals);

CampgroundSchema.post('findOneAndDelete', async function(doc){
  if (doc) {
    await Review.deleteMany({
      _id: {
        $in: doc.reviews
      }
    })
  }
})

module.exports = mongoose.model('Campground', CampgroundSchema);